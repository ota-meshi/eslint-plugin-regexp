import { rules as ruleLint } from "../../all-rules"
import type { SeverityString } from "../../types"
import { rules as recommendedRules } from "./recommended"

const all: Record<string, SeverityString> = {}
for (const rule of ruleLint) {
    all[rule.meta.docs.ruleId] = "error"
}
export const rules = {
    ...all,
    ...recommendedRules,
}
