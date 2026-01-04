import { defineConfig } from "tsdown"

export default defineConfig({
    clean: true,
    tsconfig: "tsconfig.build.json",
    dts: true,
    outDir: "dist",
    entry: ["lib/index.ts"],
    format: ["esm"],
    unbundle: true, // transpile only like `tsc`
    fixedExtension: false,
})
