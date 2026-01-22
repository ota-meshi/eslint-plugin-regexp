import plugin from "../../index.ts"
export { rules } from "../rules/recommended.ts"

export const plugins = {
    // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types -- ignore for dynamically plugin import
    get regexp() {
        return plugin
    },
}
