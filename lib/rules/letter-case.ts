import type { RegExpVisitor } from "regexpp/visitor"
import type { Character, CharacterClassRange } from "regexpp/ast"
import type { RegExpContext } from "../utils"
import {
    createRule,
    defineRegexpVisitor,
    isLetter,
    isLowercaseLetter,
    isUppercaseLetter,
} from "../utils"

const CASE_SCHEMA = ["lowercase", "uppercase", "ignore"] as const
type Case = typeof CASE_SCHEMA[number]

const DEFAULTS = {
    caseInsensitive: "lowercase" as const,
    unicodeEscape: "lowercase" as const,
    // TODO In the major version
    // hexadecimalEscape: "lowercase" as const,
    // controlEscape: "uppercase" as const,
    hexadecimalEscape: "ignore" as const,
    controlEscape: "ignore" as const,
}

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
        return DEFAULTS
    }
    return {
        caseInsensitive: option.caseInsensitive || DEFAULTS.caseInsensitive,
        unicodeEscape: option.unicodeEscape || DEFAULTS.unicodeEscape,
        hexadecimalEscape:
            option.hexadecimalEscape || DEFAULTS.hexadecimalEscape,
        controlEscape: option.controlEscape || DEFAULTS.controlEscape,
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

        /**
         * Report
         */
        function report(
            { node, getRegexpLocation, fixReplaceNode }: RegExpContext,
            reportNode: CharacterClassRange | Character,
            letterCase: "lowercase" | "uppercase",
            convertText: (converter: (s: string) => string) => string,
        ) {
            context.report({
                node,
                loc: getRegexpLocation(reportNode),
                messageId: "unexpected",
                data: {
                    char: reportNode.raw,
                    case: letterCase,
                },
                fix: fixReplaceNode(reportNode, () =>
                    convertText(CONVERTER[letterCase]),
                ),
            })
        }

        /** Verify for Character in case insensitive */
        function verifyCharacterInCaseInsensitive(
            regexpContext: RegExpContext,
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

            report(regexpContext, cNode, options.caseInsensitive, (converter) =>
                converter(String.fromCodePoint(cNode.value)),
            )
        }

        /** Verify for CharacterClassRange in case insensitive */
        function verifyCharacterClassRangeInCaseInsensitive(
            regexpContext: RegExpContext,
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
                regexpContext,
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
            regexpContext: RegExpContext,
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
                regexpContext,
                cNode,
                options.unicodeEscape,
                (converter) => `${parts[1]}${converter(parts[2])}${parts[3]}`,
            )
        }

        /** Verify for Character in hexadecimal escape */
        function verifyCharacterInHexadecimalEscape(
            regexpContext: RegExpContext,
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
                regexpContext,
                cNode,
                options.hexadecimalEscape,
                (converter) => `\\x${converter(parts[1])}`,
            )
        }

        /** Verify for Character in control escape */
        function verifyCharacterInControl(
            regexpContext: RegExpContext,
            cNode: Character,
        ) {
            if (options.controlEscape === "ignore") {
                return
            }
            const parts = /^\\c(.*)$/u.exec(cNode.raw)!
            if (STRING_CASE_CHECKER[options.controlEscape](parts[1])) {
                return
            }
            report(
                regexpContext,
                cNode,
                options.controlEscape,
                (converter) => `\\c${converter(parts[1])}`,
            )
        }

        /**
         * Create visitor
         */
        function createVisitor(
            regexpContext: RegExpContext,
        ): RegExpVisitor.Handlers {
            const { flags } = regexpContext
            return {
                onCharacterEnter(cNode) {
                    if (flags.ignoreCase) {
                        verifyCharacterInCaseInsensitive(regexpContext, cNode)
                    }
                    if (cNode.raw.startsWith("\\u")) {
                        verifyCharacterInUnicodeEscape(regexpContext, cNode)
                    }
                    if (/^\\x.+$/u.test(cNode.raw)) {
                        verifyCharacterInHexadecimalEscape(regexpContext, cNode)
                    }
                    if (/^\\c[A-Za-z]$/u.test(cNode.raw)) {
                        verifyCharacterInControl(regexpContext, cNode)
                    }
                },
                ...(flags.ignoreCase
                    ? {
                          onCharacterClassRangeEnter(ccrNode) {
                              verifyCharacterClassRangeInCaseInsensitive(
                                  regexpContext,
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
