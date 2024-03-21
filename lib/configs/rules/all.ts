import { rules as ruleLint } from "../../all-rules"
import { rules as recommendedRules } from "./recommended"

const all: Record<string, string> = {}
for (const rule of ruleLint) {
    all[rule.meta.docs.ruleId] = "error"
}
export const rules = {
    ...all,
    ...recommendedRules,
}
