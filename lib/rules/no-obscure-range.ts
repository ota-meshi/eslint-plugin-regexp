import type { Expression } from "estree"
import type { RegExpVisitor } from "regexpp/visitor"
import {
    CP_CAPITAL_A,
    CP_CAPITAL_Z,
    CP_DIGIT_NINE,
    CP_DIGIT_ZERO,
    CP_SMALL_A,
    CP_SMALL_Z,
    createRule,
    defineRegexpVisitor,
    getRegexpLocation,
    isControlEscape,
    isHexadecimalEscape,
    isOctalEscape,
} from "../utils"

const allowedRanges: readonly { min: number; max: number }[] = [
    // digits 0-9
    { min: CP_DIGIT_ZERO, max: CP_DIGIT_NINE },
    // Latin A-Z
    { min: CP_CAPITAL_A, max: CP_CAPITAL_Z },
    // Latin a-z
    { min: CP_SMALL_A, max: CP_SMALL_Z },
    // Cyrillic
    { min: "А".charCodeAt(0), max: "Я".charCodeAt(0) },
    { min: "а".charCodeAt(0), max: "я".charCodeAt(0) },
]

/**
 * Returns whether the given range is an allowed one.
 */
function isAllowedRange(min: number, max: number): boolean {
    for (const range of allowedRanges) {
        if (range.min <= min && max <= range.max) {
            return true
        }
    }
    return false
}

export default createRule("no-obscure-range", {
    meta: {
        docs: {
            description: "disallow obscure character ranges",
            recommended: true,
        },
        schema: [],
        messages: {
            unexpected:
                "Unexpected obscure character range. The characters of '{{range}}' ({{unicode}}) are not obvious.",
        },
        type: "suggestion", // "problem",
    },
    create(context) {
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

                    if (isAllowedRange(min.value, max.value)) {
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
