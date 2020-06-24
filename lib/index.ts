import type { RuleModule } from "./types"
import { rules as ruleList } from "./utils/rules"

const configs = {
    base: require("./configs/base"),
    recommended: require("./configs/recommended"),
    all: require("./configs/all"),
}

const rules = ruleList.reduce((obj, r) => {
    obj[r.meta.docs.ruleName] = r
    return obj
}, {} as { [key: string]: RuleModule })

export = {
    configs,
    rules,
}
