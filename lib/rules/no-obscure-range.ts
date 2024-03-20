import {
    getAllowedCharRanges,
    inRange,
    getAllowedCharValueSchema,
} from "../utils/char-ranges"
import type { RegExpVisitor } from "@eslint-community/regexpp/visitor"
import type { RegExpContext } from "../utils"
import { createRule, defineRegexpVisitor } from "../utils"
import {
    isControlEscape,
    isEscapeSequence,
    isOctalEscape,
    isHexLikeEscape,
} from "../utils/regex-syntax"
import { mentionChar } from "../utils/mention"

export default createRule("no-obscure-range", {
    meta: {
        docs: {
            description: "disallow obscure character ranges",
            category: "Best Practices",
            recommended: true,
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
                "Unexpected obscure character range. The characters of {{range}} are not obvious.",
        },
        type: "suggestion", // "problem",
    },
    create(context) {
        const allowedRanges = getAllowedCharRanges(
            context.options[0]?.allowed,
            context,
        )

        function createVisitor({
            node,
            getRegexpLocation,
        }: RegExpContext): RegExpVisitor.Handlers {
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
                        (isHexLikeEscape(min.raw) || min.value === 0) &&
                        isHexLikeEscape(max.raw)
                    ) {
                        // both min and max are hexadecimal (with a small exception for \0)
                        return
                    }

                    if (
                        !isEscapeSequence(min.raw) &&
                        !isEscapeSequence(max.raw) &&
                        inRange(allowedRanges, min.value, max.value)
                    ) {
                        return
                    }

                    context.report({
                        node,
                        loc: getRegexpLocation(rNode),
                        messageId: "unexpected",
                        data: {
                            range: mentionChar(rNode),
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
