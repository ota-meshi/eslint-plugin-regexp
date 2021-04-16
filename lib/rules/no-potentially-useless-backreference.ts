import type { Expression } from "estree"
import type { RegExpVisitor } from "regexpp/visitor"
import { createRule, defineRegexpVisitor, getRegexpLocation } from "../utils"
import {
    isEmptyBackreference,
    isStrictBackreference,
} from "regexp-ast-analysis"

export default createRule("no-potentially-useless-backreference", {
    meta: {
        docs: {
            description:
                "disallow backreferences that reference a group that might not be matched",
            // TODO Switch to recommended in the major version.
            // recommended: true,
            recommended: false,
            default: "warn",
        },
        schema: [],
        messages: {
            potentiallyUselessBackreference:
                "Some paths leading to the backreference do not go through the referenced capturing group or the captured text might be reset before reaching the backreference.",
        },
        type: "problem",
    },
    create(context) {
        const sourceCode = context.getSourceCode()

        /**
         * Create visitor
         * @param node
         */
        function createVisitor(node: Expression): RegExpVisitor.Handlers {
            return {
                onBackreferenceEnter(backreference) {
                    if (isEmptyBackreference(backreference)) {
                        // handled by regexp/no-useless-backreference
                        return
                    }

                    if (!isStrictBackreference(backreference)) {
                        context.report({
                            node,
                            loc: getRegexpLocation(
                                sourceCode,
                                node,
                                backreference,
                            ),
                            messageId: "potentiallyUselessBackreference",
                        })
                    }
                },
            }
        }

        return defineRegexpVisitor(context, {
            createVisitor,
        })
    },
})
