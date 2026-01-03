import { rules as ruleLint } from "../../all-rules.ts"
import type { SeverityString } from "../../types.ts"
import { rules as recommendedRules } from "./recommended.ts"

const all: Record<string, SeverityString> = {}
for (const rule of ruleLint) {
    all[rule.meta.docs.ruleId] = "error"
}
export const rules = {
    ...all,
    ...recommendedRules,
}
