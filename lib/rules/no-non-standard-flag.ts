import type { RegExpContext, UnparsableRegExpContext } from "../utils"
import { createRule, defineRegexpVisitor } from "../utils"

const STANDARD_FLAGS = "dgimsuy"

export default createRule("no-non-standard-flag", {
    meta: {
        docs: {
            description: "disallow non-standard flags",
            category: "Best Practices",
            recommended: true,
        },
        schema: [],
        messages: {
            unexpected: "Unexpected non-standard flag '{{flag}}'.",
        },
        type: "suggestion", // "problem",
    },
    create(context) {
        /** The logic of this rule */
        function visit({
            regexpNode,
            getFlagsLocation,
            flagsString,
        }: RegExpContext | UnparsableRegExpContext) {
            if (flagsString) {
                const nonStandard = [...flagsString].filter(
                    (f) => !STANDARD_FLAGS.includes(f),
                )

                if (nonStandard.length > 0) {
                    context.report({
                        node: regexpNode,
                        loc: getFlagsLocation(),
                        messageId: "unexpected",
                        data: { flag: nonStandard[0] },
                    })
                }
            }
        }

        return defineRegexpVisitor(context, {
            createVisitor(regexpContext) {
                visit(regexpContext)
                return {}
            },
            visitInvalid: visit,
            visitUnknown: visit,
        })
    },
})
