import { rules as ruleList } from "./all-rules"
import * as flatAll from "./configs/flat/all"
import * as flatRecommended from "./configs/flat/recommended"
import * as metadata from "./meta"
import type { RuleModule } from "./types"

export const meta = {
    name: metadata.name,
    version: metadata.version,
}

export const configs = {
    recommended: flatRecommended,
    all: flatAll,
    // For backwards compatibility
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
