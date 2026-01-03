import type { Character, CharacterSet } from "@eslint-community/regexpp/ast"
import type { RegExpVisitor } from "@eslint-community/regexpp/visitor"
import type { ObjectOption } from "../types.ts"
import type { PatternRange } from "../utils/ast-utils/pattern-source.ts"
import type { RegExpContext } from "../utils/index.ts"
import {
    createRule,
    defineRegexpVisitor,
    isDigit,
    isLetter,
    isSymbol,
} from "../utils/index.ts"
import { quantToString } from "../utils/regexp-ast/index.ts"

type CharTarget = CharacterSet | Character

class CharBuffer {
    public target: CharTarget

    public elements: CharTarget[]

    public times: number

    public equalChar: (element: CharTarget) => boolean

    private readonly allows: string[]

    public constructor(target: CharTarget, allows: string[]) {
        this.target = target
        this.elements = [target]
        this.allows = allows

        this.times = 1

        if (target.type === "CharacterSet") {
            if (target.kind === "any") {
                this.equalChar = (e) =>
                    e.type === "CharacterSet" && e.kind === "any"
            } else if (target.kind === "property") {
                this.equalChar = (e) =>
                    e.type === "CharacterSet" &&
                    e.kind === "property" &&
                    e.key === target.key &&
                    e.value === target.value &&
                    e.negate === target.negate
            } else {
                // Escape
                this.equalChar = (e) =>
                    e.type === "CharacterSet" &&
                    e.kind === target.kind &&
                    e.negate === target.negate
            }
        } else {
            this.equalChar = (e) =>
                e.type === "Character" && e.value === target.value
        }
    }

    public addElement(element: CharTarget) {
        this.elements.push(element)
        this.times += 1
    }

    private get bufferRawContents() {
        return this.elements.reduce((acc, element) => acc + element.raw, "")
    }

    public isValid(): boolean {
        if (this.elements.length < 2) {
            return true
        }
        if (this.allows.includes(this.bufferRawContents)) {
            return true
        }

        let charKind: "digit" | "letter" | "symbol" | null = null
        for (const element of this.elements) {
            if (element.type === "Character") {
                if (charKind == null) {
                    if (isDigit(element.value)) {
                        charKind = "digit"
                    } else if (isLetter(element.value)) {
                        charKind = "letter"
                    } else if (isSymbol(element.value)) {
                        charKind = "symbol"
                    } else {
                        return false
                    }
                }
            } else {
                return false
            }
        }
        if (
            // It is valid when the same numbers are consecutive.
            charKind === "digit" ||
            // It is valid when the same letter character continues twice.
            (charKind === "letter" && this.elements.length <= 2) ||
            // It is valid when the same symbol character continues three times.
            (charKind === "symbol" && this.elements.length <= 3)
        ) {
            return true
        }
        return false
    }

    public getQuantifier(): string {
        return quantToString({ min: this.times, max: this.times })
    }
}

export default createRule("prefer-quantifier", {
    meta: {
        docs: {
            description: "enforce using quantifier",
            category: "Best Practices",
            recommended: false,
        },
        fixable: "code",
        schema: [
            {
                type: "object",
                properties: {
                    allows: {
                        type: "array",
                        items: {
                            type: "string",
                        },
                    },
                },
                additionalProperties: false,
            },
        ],
        messages: {
            unexpected:
                "Unexpected consecutive same {{type}}. Use '{{quantifier}}' instead.",
        },
        type: "suggestion", // "problem",
    },
    create(context) {
        const allows: string[] =
            (context.options[0] as ObjectOption)?.allows ?? []

        function createVisitor({
            node,
            patternSource,
        }: RegExpContext): RegExpVisitor.Handlers {
            return {
                onAlternativeEnter(aNode) {
                    let charBuffer: CharBuffer | null = null
                    for (const element of aNode.elements) {
                        if (
                            element.type === "CharacterSet" ||
                            element.type === "Character"
                        ) {
                            if (charBuffer && charBuffer.equalChar(element)) {
                                charBuffer.addElement(element)
                            } else {
                                validateBuffer(charBuffer)
                                charBuffer = new CharBuffer(element, allows)
                            }
                        } else {
                            validateBuffer(charBuffer)
                            charBuffer = null
                        }
                    }

                    validateBuffer(charBuffer)

                    function validateBuffer(buffer: CharBuffer | null) {
                        if (!buffer || buffer.isValid()) {
                            return
                        }

                        const bufferRange: PatternRange = {
                            start: buffer.elements[0].start,
                            end: buffer.elements[buffer.elements.length - 1]
                                .end,
                        }

                        context.report({
                            node,
                            loc: patternSource.getAstLocation(bufferRange),
                            messageId: "unexpected",
                            data: {
                                type:
                                    buffer.target.type === "Character"
                                        ? "characters"
                                        : buffer.target.kind === "any"
                                          ? "any characters"
                                          : "character class escapes",
                                quantifier: buffer.getQuantifier(),
                            },
                            fix(fixer) {
                                const range =
                                    patternSource.getReplaceRange(bufferRange)
                                if (!range) {
                                    return null
                                }
                                return range.replace(
                                    fixer,
                                    buffer.target.raw + buffer.getQuantifier(),
                                )
                            },
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
