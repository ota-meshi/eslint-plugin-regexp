import module from "node:module"
export { rules } from "../rules/all.ts"

const require = module.createRequire(import.meta.url)

export const plugins = {
    // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types -- ignore for dynamically plugin import
    get regexp() {
        return require("../../index.js").default
    },
}
