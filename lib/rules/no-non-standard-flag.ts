import type { RegExpVisitor } from "regexpp/visitor"
import type { RegExpContext } from "../utils"
import { createRule, defineRegexpVisitor } from "../utils"

const STANDARD_FLAGS = "gimsuy"

export default createRule("no-non-standard-flag", {
    meta: {
        docs: {
            description: "disallow non-standard flags",
            // TODO Switch to recommended in the major version.
            // recommended: true,
            recommended: false,
        },
        schema: [],
        messages: {
            unexpected: "Unexpected non-standard flag '{{flag}}'.",
        },
        type: "suggestion", // "problem",
    },
    create(context) {
        /**
         * Create visitor
         */
        function createVisitor({
            node,
            getFlagsLocation,
            flagsString,
        }: RegExpContext): RegExpVisitor.Handlers {
            if (flagsString) {
                const nonStandard = [...flagsString].filter(
                    (f) => !STANDARD_FLAGS.includes(f),
                )

                if (nonStandard.length > 0) {
                    context.report({
                        node,
                        loc: getFlagsLocation(),
                        messageId: "unexpected",
                        data: { flag: nonStandard[0] },
                    })
                }
            }
            return {}
        }

        return defineRegexpVisitor(context, {
            createVisitor,
        })
    },
})
