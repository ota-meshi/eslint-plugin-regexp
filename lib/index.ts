import type { RuleModule } from "./types"
import { rules as ruleList } from "./utils/rules"
import recommended from "./configs/recommended"

const configs = {
    recommended,
}

const rules = ruleList.reduce((obj, r) => {
    obj[r.meta.docs.ruleName] = r
    return obj
}, {} as { [key: string]: RuleModule })

export = {
    configs,
    rules,
}
