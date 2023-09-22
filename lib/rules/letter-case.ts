import type { RegExpVisitor } from "@eslint-community/regexpp/visitor"
import type {
    Character,
    CharacterClassRange,
} from "@eslint-community/regexpp/ast"
import type { RegExpContext } from "../utils"
import {
    createRule,
    defineRegexpVisitor,
    isLetter,
    isLowercaseLetter,
    isUppercaseLetter,
    EscapeSequenceKind,
    getEscapeSequenceKind,
} from "../utils"

const CASE_SCHEMA = ["lowercase", "uppercase", "ignore"] as const
type Case = (typeof CASE_SCHEMA)[number]

const DEFAULTS = {
    caseInsensitive: "lowercase" as const,
    unicodeEscape: "lowercase" as const,
    hexadecimalEscape: "lowercase" as const,
    controlEscape: "uppercase" as const,
}

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
            category: "Stylistic Issues",
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

        function verifyCharacterInUnicodeEscape(
            regexpContext: RegExpContext,
            cNode: Character,
        ) {
            if (options.unicodeEscape === "ignore") {
                return
            }
            const parts = /^(?<prefix>\\u\{?)(?<code>.*?)(?<suffix>\}?)$/u.exec(
                cNode.raw,
            )!
            if (
                STRING_CASE_CHECKER[options.unicodeEscape](parts.groups!.code)
            ) {
                return
            }
            report(
                regexpContext,
                cNode,
                options.unicodeEscape,
                (converter) =>
                    `${parts.groups!.prefix}${converter(parts.groups!.code)}${
                        parts.groups!.suffix
                    }`,
            )
        }

        function verifyCharacterInHexadecimalEscape(
            regexpContext: RegExpContext,
            cNode: Character,
        ) {
            if (options.hexadecimalEscape === "ignore") {
                return
            }
            const parts = /^\\x(?<code>.*)$/u.exec(cNode.raw)!
            if (
                STRING_CASE_CHECKER[options.hexadecimalEscape](
                    parts.groups!.code,
                )
            ) {
                return
            }
            report(
                regexpContext,
                cNode,
                options.hexadecimalEscape,
                (converter) => `\\x${converter(parts.groups!.code)}`,
            )
        }

        function verifyCharacterInControl(
            regexpContext: RegExpContext,
            cNode: Character,
        ) {
            if (options.controlEscape === "ignore") {
                return
            }
            const parts = /^\\c(?<code>.*)$/u.exec(cNode.raw)!
            if (
                STRING_CASE_CHECKER[options.controlEscape](parts.groups!.code)
            ) {
                return
            }
            report(
                regexpContext,
                cNode,
                options.controlEscape,
                (converter) => `\\c${converter(parts.groups!.code)}`,
            )
        }

        function createVisitor(
            regexpContext: RegExpContext,
        ): RegExpVisitor.Handlers {
            const { flags } = regexpContext
            return {
                onCharacterEnter(cNode) {
                    if (flags.ignoreCase) {
                        verifyCharacterInCaseInsensitive(regexpContext, cNode)
                    }
                    const escapeKind = getEscapeSequenceKind(cNode.raw)
                    if (
                        escapeKind === EscapeSequenceKind.unicode ||
                        escapeKind === EscapeSequenceKind.unicodeCodePoint
                    ) {
                        verifyCharacterInUnicodeEscape(regexpContext, cNode)
                    }
                    if (escapeKind === EscapeSequenceKind.hexadecimal) {
                        verifyCharacterInHexadecimalEscape(regexpContext, cNode)
                    }
                    if (escapeKind === EscapeSequenceKind.control) {
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
