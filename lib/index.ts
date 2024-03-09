import type { RuleModule } from "./types"
import { rules as ruleList } from "./utils/rules"
import * as recommended from "./configs/recommended"
import * as all from "./configs/all"
import * as flatRecommended from "./configs/flat/recommended"
import * as flatAll from "./configs/flat/all"
export * as meta from "./meta"

export const configs = {
    recommended,
    all,
    "flat/all": flatAll,
    "flat/recommended": flatRecommended,
}
export const rules = ruleList.reduce(
    (obj, r) => {
        obj[r.meta.docs.ruleName] = r
        return obj
    },
    {} as { [key: string]: RuleModule },
)
