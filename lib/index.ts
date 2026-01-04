import { rules as ruleList } from "./all-rules.ts"
import * as all from "./configs/all.ts"
import * as flatAll from "./configs/flat/all.ts"
import * as flatRecommended from "./configs/flat/recommended.ts"
import * as recommended from "./configs/recommended.ts"
import * as meta from "./meta.ts"
import type { RuleModule } from "./types.ts"

export * as meta from "./meta.ts"

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

export default { configs, rules, meta }
