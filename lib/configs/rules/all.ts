import { rules as recommendedRules } from "./recommended"
import { rules as ruleLint } from "../../utils/rules"

const all: Record<string, string> = {}
for (const rule of ruleLint) {
    all[rule.meta.docs.ruleId] = "error"
}
export const rules = {
    ...all,
    ...recommendedRules,
}
