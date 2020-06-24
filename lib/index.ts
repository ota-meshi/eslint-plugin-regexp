import type { RuleModule } from "./types"
import { rules as ruleList } from "./utils/rules"

const configs = {
    recommended: require("./configs/recommended"),
}

const rules = ruleList.reduce((obj, r) => {
    obj[r.meta.docs.ruleName] = r
    return obj
}, {} as { [key: string]: RuleModule })

export = {
    configs,
    rules,
}
