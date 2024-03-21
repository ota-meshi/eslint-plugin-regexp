import { rules as ruleList } from "./all-rules"
import * as all from "./configs/all"
import * as flatAll from "./configs/flat/all"
import * as flatRecommended from "./configs/flat/recommended"
import * as recommended from "./configs/recommended"
import type { RuleModule } from "./types"
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
