import type { Expression } from "estree"
import type { RegExpVisitor } from "regexpp/visitor"
import type { Character, CharacterClassRange } from "regexpp/ast"
import {
    createRule,
    defineRegexpVisitor,
    getRegexpLocation,
    getRegexpRange,
    isLetter,
    isLowercaseLetter,
    isUppercaseLetter,
} from "../utils"

const CASE_SCHEMA = ["lowercase", "uppercase", "ignore"] as const
type Case = typeof CASE_SCHEMA[number]

/** Parse option */
function parseOptions(option?: {
    caseInsensitive?: Case
    unicodeEscape?: Case
    hexadecimalEscape?: Case
    controlEscape?: Case
}): {
    caseInsensitive: Case
    unicodeEscape: Case
    hexadecimalEscape: Case
    controlEscape: Case
} {
    if (!option) {
        return {
            caseInsensitive: "lowercase",
            unicodeEscape: "lowercase",
            hexadecimalEscape: "lowercase",
            controlEscape: "uppercase",
        }
    }
    return {
        caseInsensitive: option.caseInsensitive || "lowercase",
        unicodeEscape: option.unicodeEscape || "lowercase",
        hexadecimalEscape: option.hexadecimalEscape || "lowercase",
        controlEscape: option.controlEscape || "uppercase",
    }
}

const CODE_POINT_CASE_CHECKER = {
    lowercase: isLowercaseLetter,
    uppercase: isUppercaseLetter,
}
const STRING_CASE_CHECKER = {
    lowercase: (s: string) => s.toLowerCase() === s,
    uppercase: (s: string) => s.toUpperCase() === s,
}
const CONVERTER = {
    lowercase: (s: string) => s.toLowerCase(),
    uppercase: (s: string) => s.toUpperCase(),
}

export default createRule("letter-case", {
    meta: {
        docs: {
            description: "enforce into your favorite case",
            recommended: false,
        },
        fixable: "code",
        schema: [
            {
                type: "object",
                properties: {
                    caseInsensitive: { enum: CASE_SCHEMA },
                    unicodeEscape: { enum: CASE_SCHEMA },
                    hexadecimalEscape: { enum: CASE_SCHEMA },
                    controlEscape: { enum: CASE_SCHEMA },
                },
                additionalProperties: false,
            },
        ],
        messages: {
            unexpected: "'{{char}}' is not in {{case}}",
        },
        type: "layout", // "problem",
    },
    create(context) {
        const options = parseOptions(context.options[0])
        const sourceCode = context.getSourceCode()

        /**
         * Report
         */
        function report(
            node: Expression,
            reportNode: CharacterClassRange | Character,
            letterCase: "lowercase" | "uppercase",
            convertText: (converter: (s: string) => string) => string,
        ) {
            context.report({
                node,
                loc: getRegexpLocation(sourceCode, node, reportNode),
                messageId: "unexpected",
                data: {
                    char: reportNode.raw,
                    case: letterCase,
                },
                fix(fixer) {
                    const range = getRegexpRange(sourceCode, node, reportNode)
                    if (range == null) {
                        return null
                    }
                    const newText = convertText(CONVERTER[letterCase])
                    return fixer.replaceTextRange(range, newText)
                },
            })
        }

        /** Verify for Character in case insensitive */
        function verifyCharacterInCaseInsensitive(
            node: Expression,
            cNode: Character,
        ) {
            if (
                cNode.parent.type === "CharacterClassRange" ||
                options.caseInsensitive === "ignore"
            ) {
                return
            }
            if (
                CODE_POINT_CASE_CHECKER[options.caseInsensitive](cNode.value) ||
                !isLetter(cNode.value)
            ) {
                return
            }

            report(node, cNode, options.caseInsensitive, (converter) =>
                converter(String.fromCodePoint(cNode.value)),
            )
        }

        /** Verify for CharacterClassRange in case insensitive */
        function verifyCharacterClassRangeInCaseInsensitive(
            node: Expression,
            ccrNode: CharacterClassRange,
        ) {
            if (options.caseInsensitive === "ignore") {
                return
            }
            if (
                CODE_POINT_CASE_CHECKER[options.caseInsensitive](
                    ccrNode.min.value,
                ) ||
                !isLetter(ccrNode.min.value) ||
                CODE_POINT_CASE_CHECKER[options.caseInsensitive](
                    ccrNode.max.value,
                ) ||
                !isLetter(ccrNode.max.value)
            ) {
                return
            }
            report(
                node,
                ccrNode,
                options.caseInsensitive,
                (converter) =>
                    `${converter(
                        String.fromCodePoint(ccrNode.min.value),
                    )}-${converter(String.fromCodePoint(ccrNode.max.value))}`,
            )
        }

        /** Verify for Character in unicode escape */
        function verifyCharacterInUnicodeEscape(
            node: Expression,
            cNode: Character,
        ) {
            if (options.unicodeEscape === "ignore") {
                return
            }
            const parts = /^(\\u\{?)(.*)(\}?)$/u.exec(cNode.raw)!
            if (STRING_CASE_CHECKER[options.unicodeEscape](parts[2])) {
                return
            }
            report(
                node,
                cNode,
                options.unicodeEscape,
                (converter) => `${parts[1]}${converter(parts[2])}${parts[3]}`,
            )
        }

        /** Verify for Character in hexadecimal escape */
        function verifyCharacterInHexadecimalEscape(
            node: Expression,
            cNode: Character,
        ) {
            if (options.hexadecimalEscape === "ignore") {
                return
            }
            const parts = /^\\x(.*)$/u.exec(cNode.raw)!
            if (STRING_CASE_CHECKER[options.hexadecimalEscape](parts[1])) {
                return
            }
            report(
                node,
                cNode,
                options.hexadecimalEscape,
                (converter) => `\\x${converter(parts[1])}`,
            )
        }

        /** Verify for Character in control escape */
        function verifyCharacterInControl(node: Expression, cNode: Character) {
            if (options.controlEscape === "ignore") {
                return
            }
            const parts = /^\\c(.*)$/u.exec(cNode.raw)!
            if (STRING_CASE_CHECKER[options.controlEscape](parts[1])) {
                return
            }
            report(
                node,
                cNode,
                options.controlEscape,
                (converter) => `\\c${converter(parts[1])}`,
            )
        }

        /**
         * Create visitor
         * @param node
         */
        function createVisitor(
            node: Expression,
            _pattern: string,
            flags: string,
        ): RegExpVisitor.Handlers {
            return {
                onCharacterEnter(cNode) {
                    if (flags.includes("i")) {
                        verifyCharacterInCaseInsensitive(node, cNode)
                    }
                    if (cNode.raw.startsWith("\\u")) {
                        verifyCharacterInUnicodeEscape(node, cNode)
                    }
                    if (/^\\x.+$/u.test(cNode.raw)) {
                        verifyCharacterInHexadecimalEscape(node, cNode)
                    }
                    if (/^\\c[a-zA-Z]$/u.test(cNode.raw)) {
                        verifyCharacterInControl(node, cNode)
                    }
                },
                ...(flags.includes("i")
                    ? {
                          onCharacterClassRangeEnter(ccrNode) {
                              verifyCharacterClassRangeInCaseInsensitive(
                                  node,
                                  ccrNode,
                              )
                          },
                      }
                    : {}),
            }
        }

        return defineRegexpVisitor(context, {
            createVisitor,
        })
    },
})
