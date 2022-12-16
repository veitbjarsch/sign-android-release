import { getInput, debug, error, setFailed, exportVariable, setOutput } from '@actions/core';
import {signAabFile, signApkFile} from "./signing";
import * as path from "path";
import * as fs from "fs";
import * as io from "./io-utils";





async function run() {
  try {
    if (process.env.DEBUG_ACTION === 'true') {
      debug("DEBUG FLAG DETECTED, SHORTCUTTING ACTION.")
      return;
    }

    const releaseDir = getInput('releaseDirectory');
    const signingKeyBase64 = getInput('signingKeyBase64');
    const alias = getInput('alias');
    const keyStorePassword = getInput('keyStorePassword');
    const keyPassword = getInput('keyPassword');

    console.log(`Preparing to sign key @ ${releaseDir} with signing key`);

    // 1. Find release files
    const releaseFiles = io.findReleaseFiles(releaseDir);
    if (releaseFiles !== undefined && releaseFiles.length !== 0) {
      // 3. Now that we have a release files, decode and save the signing key
      const signingKey = path.join(releaseDir, 'signingKey.jks');
      fs.writeFileSync(signingKey, signingKeyBase64, 'base64');

      // 4. Now zipalign and sign each one of the the release files
      let signedReleaseFiles:string[] = [];
      let index = 0;
      for (let releaseFile of releaseFiles) {
        debug(`Found release to sign: ${releaseFile.name}`);
        const releaseFilePath = path.join(releaseDir, releaseFile.name);
        let signedReleaseFile = '';
        if (releaseFile.name.endsWith('.apk')) {
          signedReleaseFile = await signApkFile(releaseFilePath, signingKey, alias, keyStorePassword, keyPassword);
        } else if (releaseFile.name.endsWith('.aab')) {
          signedReleaseFile = await signAabFile(releaseFilePath, signingKey, alias, keyStorePassword, keyPassword);
        } else {
          error('No valid release file to sign, abort.');
          setFailed('No valid release file to sign.');
        }

        // Each signed release file is stored in a separate variable + output.
        exportVariable(`SIGNED_RELEASE_FILE_${index}`, signedReleaseFile);
        setOutput(`signedReleaseFile${index}`, signedReleaseFile);
        signedReleaseFiles.push(signedReleaseFile);
        ++index;
      }

      // All signed release files are stored in a merged variable + output.
      exportVariable(`SIGNED_RELEASE_FILES`, signedReleaseFiles.join(":"));
      setOutput('signedReleaseFiles', signedReleaseFiles.join(":"));
      exportVariable(`NOF_SIGNED_RELEASE_FILES`, `${signedReleaseFiles.length}`);
      setOutput(`nofSignedReleaseFiles`, `${signedReleaseFiles.length}`);

      // When there is one and only one signed release file, stoire it in a specific variable + output.
      if (signedReleaseFiles.length == 1) {
        exportVariable(`SIGNED_RELEASE_FILE`, signedReleaseFiles[0]);
        setOutput('signedReleaseFile', signedReleaseFiles[0]);
      }
      console.log('Releases signed!');
    } else {
      error("No release files (.apk or .aab) could be found. Abort.");
      setFailed('No release files (.apk or .aab) could be found.');
    }
  } catch (error: any) {
    setFailed(error.message);
  }
}

run();
