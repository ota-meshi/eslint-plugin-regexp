import { RegExpValidator } from "regexpp"
import type { RegExpVisitor } from "regexpp/visitor"
import type { RegExpContext } from "../utils"
import { createRule, defineRegexpVisitor } from "../utils"

const validator = new RegExpValidator({ strict: true })

/**
 * Check syntax error in a given pattern.
 * @returns {string|null} The syntax error.
 */
function validateRegExpPattern(pattern: string, uFlag?: boolean) {
    try {
        validator.validatePattern(pattern, undefined, undefined, uFlag)
        return null
    } catch (err) {
        return err.message
    }
}

export default createRule("strict", {
    meta: {
        docs: {
            description: "disallow not strictly valid regular expressions",
            category: "Possible Errors",
            // TODO Switch to recommended in the major version.
            // recommended: true,
            recommended: false,
        },
        schema: [],
        messages: {
            regexMessage: "{{message}}.",
        },
        type: "suggestion",
    },
    create(context) {
        /**
         * Create visitor
         */
        function createVisitor(
            regexpContext: RegExpContext,
        ): RegExpVisitor.Handlers {
            const { node, flags, pattern } = regexpContext

            const message = validateRegExpPattern(pattern, flags.unicode)

            if (message) {
                context.report({
                    node,
                    messageId: "regexMessage",
                    data: {
                        message,
                    },
                })
            }

            return {}
        }

        return defineRegexpVisitor(context, {
            createVisitor,
        })
    },
})
