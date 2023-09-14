import type { RegExpVisitor } from "@eslint-community/regexpp/visitor"
import type { RegExpContext } from "../utils"
import {
    createRule,
    defineRegexpVisitor,
    CP_DIGIT_ZERO,
    CP_DIGIT_NINE,
} from "../utils"
import { Chars, toCharSet } from "regexp-ast-analysis"
import { mention } from "../utils/mention"
import type {
    CharacterClassElement,
    CharacterClassRange,
    EscapeCharacterSet,
} from "@eslint-community/regexpp/ast"

/**
 * Returns whether the given character class element is equivalent to `\d`.
 */
function isDigits(
    element: CharacterClassElement,
): element is EscapeCharacterSet | CharacterClassRange {
    return (
        (element.type === "CharacterSet" &&
            element.kind === "digit" &&
            !element.negate) ||
        (element.type === "CharacterClassRange" &&
            element.min.value === CP_DIGIT_ZERO &&
            element.max.value === CP_DIGIT_NINE)
    )
}

export default createRule("prefer-d", {
    meta: {
        docs: {
            description: "enforce using `\\d`",
            category: "Stylistic Issues",
            recommended: true,
        },
        fixable: "code",
        schema: [
            {
                type: "object",
                properties: {
                    insideCharacterClass: {
                        type: "string",
                        enum: ["ignore", "range", "d"],
                    },
                },
                additionalProperties: false,
            },
        ],
        messages: {
            unexpected:
                "Unexpected {{type}} {{expr}}. Use '{{instead}}' instead.",
        },
        type: "suggestion",
    },
    create(context) {
        const insideCharacterClass: "ignore" | "range" | "d" =
            context.options[0]?.insideCharacterClass ?? "d"

        function createVisitor({
            node,
            flags,
            getRegexpLocation,
            fixReplaceNode,
        }: RegExpContext): RegExpVisitor.Handlers {
            return {
                onCharacterClassEnter(ccNode) {
                    // FIXME: TS Error
                    // @ts-expect-error -- FIXME
                    const charSet = toCharSet(ccNode, flags)

                    let predefined: string | undefined = undefined
                    if (charSet.equals(Chars.digit(flags))) {
                        predefined = "\\d"
                    } else if (charSet.equals(Chars.digit(flags).negate())) {
                        predefined = "\\D"
                    }

                    if (predefined) {
                        context.report({
                            node,
                            loc: getRegexpLocation(ccNode),
                            messageId: "unexpected",
                            data: {
                                type: "character class",
                                expr: mention(ccNode),
                                instead: predefined,
                            },
                            fix: fixReplaceNode(ccNode, predefined),
                        })
                        return
                    }

                    if (insideCharacterClass === "ignore") {
                        return
                    }

                    const expected =
                        insideCharacterClass === "d" ? "\\d" : "0-9"

                    // check the elements in this character class
                    for (const e of ccNode.elements) {
                        if (isDigits(e) && e.raw !== expected) {
                            context.report({
                                node,
                                loc: getRegexpLocation(e),
                                messageId: "unexpected",
                                data: {
                                    type:
                                        e.type === "CharacterSet"
                                            ? "character set"
                                            : "character class range",
                                    expr: mention(e),
                                    instead: expected,
                                },
                                fix: fixReplaceNode(e, expected),
                            })
                        }
                    }
                },
            }
        }

        return defineRegexpVisitor(context, {
            createVisitor,
        })
    },
})
