import type { CallExpression, Literal } from "estree"
import { createRule } from "../utils"
import { createTypeTracker } from "../utils/type-tracker"
import type { RegExpLiteral, Pattern } from "@eslint-community/regexpp/ast"
import type { Rule } from "eslint"
import type { ReferenceElement } from "../utils/ast-utils"
import { isKnownMethodCall, parseReplacements } from "../utils/ast-utils"
import {
    extractCaptures,
    getRegExpNodeFromExpression,
} from "../utils/regexp-ast"

/**
 * Extract `$` replacements
 */
function extractDollarReplacements(context: Rule.RuleContext, node: Literal) {
    return parseReplacements(context, node).filter(
        (e): e is ReferenceElement => e.type === "ReferenceElement",
    )
}

export default createRule("no-useless-dollar-replacements", {
    meta: {
        docs: {
            description:
                "disallow useless `$` replacements in replacement string",
            category: "Possible Errors",
            recommended: true,
        },
        schema: [],
        messages: {
            numberRef:
                "'${{ refText }}' replacement will insert '${{ refText }}' because there are less than {{ num }} capturing groups. Use '$$' if you want to escape '$'.",
            numberRefCapturingNotFound:
                "'${{ refText }}' replacement will insert '${{ refText }}' because capturing group does not found. Use '$$' if you want to escape '$'.",
            namedRef:
                "'$<{{ refText }}>' replacement will be ignored because the named capturing group is not found. Use '$$' if you want to escape '$'.",
            namedRefNamedCapturingNotFound:
                "'$<{{ refText }}>' replacement will insert '$<{{ refText }}>' because named capturing group does not found. Use '$$' if you want to escape '$'.",
        },
        type: "suggestion", // "problem",
    },
    create(context) {
        const typeTracer = createTypeTracker(context)
        const sourceCode = context.getSourceCode()

        function verify(
            patternNode: Pattern | RegExpLiteral,
            replacement: Literal,
        ) {
            const captures = extractCaptures(patternNode)
            for (const dollarReplacement of extractDollarReplacements(
                context,
                replacement,
            )) {
                if (typeof dollarReplacement.ref === "number") {
                    if (captures.count < dollarReplacement.ref) {
                        context.report({
                            node: replacement,
                            loc: {
                                start: sourceCode.getLocFromIndex(
                                    dollarReplacement.range[0],
                                ),
                                end: sourceCode.getLocFromIndex(
                                    dollarReplacement.range[1],
                                ),
                            },
                            messageId:
                                captures.count > 0
                                    ? "numberRef"
                                    : "numberRefCapturingNotFound",
                            data: {
                                refText: dollarReplacement.refText,
                                num: String(dollarReplacement.ref),
                            },
                        })
                    }
                } else {
                    if (!captures.names.has(dollarReplacement.ref)) {
                        context.report({
                            node: replacement,
                            loc: {
                                start: sourceCode.getLocFromIndex(
                                    dollarReplacement.range[0],
                                ),
                                end: sourceCode.getLocFromIndex(
                                    dollarReplacement.range[1],
                                ),
                            },
                            messageId:
                                captures.names.size > 0
                                    ? "namedRef"
                                    : "namedRefNamedCapturingNotFound",
                            data: {
                                refText: dollarReplacement.refText,
                            },
                        })
                    }
                }
            }
        }

        return {
            CallExpression(node: CallExpression) {
                if (!isKnownMethodCall(node, { replace: 2, replaceAll: 2 })) {
                    return
                }
                const mem = node.callee
                const replacementTextNode = node.arguments[1]
                if (
                    replacementTextNode.type !== "Literal" ||
                    typeof replacementTextNode.value !== "string"
                ) {
                    return
                }
                const patternNode = getRegExpNodeFromExpression(
                    node.arguments[0],
                    context,
                )
                if (!patternNode) {
                    return
                }
                if (!typeTracer.isString(mem.object)) {
                    return
                }
                verify(patternNode, replacementTextNode)
            },
        }
    },
})
