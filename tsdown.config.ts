import { defineConfig } from "tsdown"

export default defineConfig({
    tsconfig: "tsconfig.build.json",
    dts: true,
    entry: ["lib/index.ts"],
    fixedExtension: false
})
