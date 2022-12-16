
import typescript from "@rollup/plugin-typescript"
import { nodeResolve } from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';

import * as fs from "fs"
import path from "path"

const dir = "src"

let files = fs.readdirSync(dir).filter(el => path.extname(el) === ".ts").map(el => dir + "/" + el)

if(!files.length) {
    throw new Error(`No sources found in: ${dir}`)
}

export default files.map(el => {
    return {
        input: el,
        output: {
            dir: "dist",
            format: "esm",
            sourcemap: false
        },
        plugins: [
          commonjs(),
            typescript({
                tsconfig: "./tsconfig.json"
            }),
            nodeResolve(),
        ]
    }
})