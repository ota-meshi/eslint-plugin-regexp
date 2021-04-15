import type { Expression } from "estree"
import {
    getAllowedCharRanges,
    inRange,
    getAllowedCharValueSchema,
} from "../utils/char-ranges"
import type { RegExpVisitor } from "regexpp/visitor"
import {
    createRule,
    defineRegexpVisitor,
    getRegexpLocation,
    isControlEscape,
    isHexadecimalEscape,
    isOctalEscape,
} from "../utils"

export default createRule("no-obscure-range", {
    meta: {
        docs: {
            description: "disallow obscure character ranges",
            // TODO Switch to recommended in the major version.
            // recommended: true,
            recommended: false,
        },
        schema: [
            {
                type: "object",
                properties: {
                    allowed: getAllowedCharValueSchema(),
                },
                additionalProperties: false,
            },
        ],
        messages: {
            unexpected:
                "Unexpected obscure character range. The characters of '{{range}}' ({{unicode}}) are not obvious.",
        },
        type: "suggestion", // "problem",
    },
    create(context) {
        const allowedRanges = getAllowedCharRanges(
            context.options[0]?.allowed,
            context,
        )
        const sourceCode = context.getSourceCode()

        /**
         * Create visitor
         * @param node
         */
        function createVisitor(node: Expression): RegExpVisitor.Handlers {
            return {
                onCharacterClassRangeEnter(rNode) {
                    const { min, max } = rNode

                    if (min.value === max.value) {
                        // we don't deal with that
                        return
                    }

                    if (isControlEscape(min.raw) && isControlEscape(max.raw)) {
                        // both min and max are control escapes
                        return
                    }
                    if (isOctalEscape(min.raw) && isOctalEscape(max.raw)) {
                        // both min and max are either octal
                        return
                    }
                    if (
                        (isHexadecimalEscape(min.raw) || min.value === 0) &&
                        isHexadecimalEscape(max.raw)
                    ) {
                        // both min and max are hexadecimal (with a small exception for \0)
                        return
                    }

                    if (inRange(allowedRanges, min.value, max.value)) {
                        return
                    }

                    const uMin = `U+${min.value.toString(16).padStart(4, "0")}`
                    const uMax = `U+${max.value.toString(16).padStart(4, "0")}`

                    context.report({
                        node,
                        loc: getRegexpLocation(sourceCode, node, rNode),
                        messageId: "unexpected",
                        data: {
                            range: rNode.raw,
                            unicode: `${uMin} - ${uMax}`,
                        },
                    })
                },
            }
        }

        return defineRegexpVisitor(context, {
            createVisitor,
        })
    },
})
