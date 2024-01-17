import { RuleTester as OriginalRuleTester } from "eslint"

export const RuleTester = getUnsupportedFlatRuleTester() || OriginalRuleTester

function getUnsupportedFlatRuleTester() {
    try {
        // eslint-disable-next-line @typescript-eslint/no-require-imports, @typescript-eslint/no-var-requires -- for test
        return require("eslint/use-at-your-own-risk").FlatRuleTester
    } catch {
        return null
    }
}
