import { defineConfig } from "tsdown"

export default defineConfig({
    clean: true,
    tsconfig: "tsconfig.build.json",
    dts: true,
    outDir: "dist",
    entry: ["lib/index.ts"],
    format: ["esm"],
    unbundle: true,
    fixedExtension: false,
    plugins: [
        {
            /**
             * A plugin to polyfill `__dirname` and `__filename` in `node_modules/typescript/lib/typescript.js`
             */
            name: "eslint-plugin-regexp-tsdown-ts-polyfill",
            // eslint-lint-disable-next-line consistent-return -- ignore
            transform(code, id) {
                if (id.endsWith("typescript.js")) {
                    const polifyllCode = `import { fileURLToPath } from "node:url";
import path from "node:path";
const __filename = fileURLToPath(${["import", "meta", "url"].join(".")});
const __dirname = path.dirname(__filename);`
                    return {
                        code: `${polifyllCode}\n${code}`,
                        map: null,
                    }
                }
                return null
            },
        },
    ],
})
