import type { Expression } from "estree"
import type { RegExpVisitor } from "regexpp/visitor"
import type { Character, CharacterSet, Quantifier } from "regexpp/ast"
import { createRule, defineRegexpVisitor, getRegexpRange } from "../utils"

class CharBuffer {
    public target: CharacterSet | Character

    public min: number

    public max: number

    public elements: (CharacterSet | Character | Quantifier)[]

    public equalChar: (element: CharacterSet | Character) => boolean

    public constructor(
        element: CharacterSet | Character | Quantifier,
        target: CharacterSet | Character,
    ) {
        this.target = target
        this.elements = [element]

        if (element.type === "Quantifier") {
            this.min = element.min
            this.max = element.max
        } else {
            this.min = 1
            this.max = 1
        }
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

    public addElement(element: CharacterSet | Character | Quantifier) {
        this.elements.push(element)
        if (element.type === "Quantifier") {
            this.min += element.min
            this.max += element.max
        } else {
            this.min += 1
            this.max += 1
        }
    }

    public getQuantifier(): string {
        if (this.min === 0 && this.max === Number.POSITIVE_INFINITY) {
            return "*"
        } else if (this.min === 1 && this.max === Number.POSITIVE_INFINITY) {
            return "+"
        } else if (this.min === 0 && this.max === 1) {
            return "?"
        } else if (this.min === this.max) {
            return `{${this.min}}`
        } else if (this.max === Number.POSITIVE_INFINITY) {
            return `{${this.min},}`
        }
        return `{${this.min},${this.max}}`
    }
}

export default createRule("prefer-quantifier", {
    meta: {
        docs: {
            description: "enforce using quantifier",
            // TODO In the major version, it will be changed to "recommended".
            recommended: false,
        },
        fixable: "code",
        schema: [],
        messages: {
            unexpected:
                'Unexpected consecutive same {{type}}. Use "{{quantifier}}" instead.',
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
                onAlternativeEnter(aNode) {
                    let charBuffer: CharBuffer | null = null
                    for (const element of aNode.elements) {
                        let target: CharacterSet | Character
                        if (
                            element.type === "CharacterSet" ||
                            element.type === "Character"
                        ) {
                            target = element
                        } else if (element.type === "Quantifier") {
                            if (
                                element.element.type === "CharacterSet" ||
                                element.element.type === "Character"
                            ) {
                                target = element.element
                            } else {
                                if (charBuffer) {
                                    validateBuffer(charBuffer)
                                    charBuffer = null
                                }
                                continue
                            }
                        } else {
                            if (charBuffer) {
                                validateBuffer(charBuffer)
                                charBuffer = null
                            }
                            continue
                        }
                        if (charBuffer) {
                            if (charBuffer.equalChar(target)) {
                                charBuffer.addElement(element)
                                continue
                            }
                            validateBuffer(charBuffer)
                        }
                        charBuffer = new CharBuffer(element, target)
                    }
                    if (charBuffer) {
                        validateBuffer(charBuffer)
                        charBuffer = null
                    }

                    /**
                     * Validate
                     */
                    function validateBuffer(buffer: CharBuffer) {
                        if (buffer.elements.length < 2) {
                            return
                        }
                        const firstRange = getRegexpRange(
                            sourceCode,
                            node,
                            buffer.elements[0],
                        )
                        const lastRange = getRegexpRange(
                            sourceCode,
                            node,
                            buffer.elements[buffer.elements.length - 1],
                        )
                        let range: [number, number] | null = null
                        if (firstRange && lastRange) {
                            range = [firstRange[0], lastRange[1]]
                        }
                        context.report({
                            node,
                            loc: range
                                ? {
                                      start: sourceCode.getLocFromIndex(
                                          range[0],
                                      ),
                                      end: sourceCode.getLocFromIndex(range[1]),
                                  }
                                : undefined,
                            messageId: "unexpected",
                            data: {
                                type:
                                    buffer.target.type === "Character"
                                        ? "characters"
                                        : "character sets",
                                quantifier: buffer.getQuantifier(),
                            },
                            fix(fixer) {
                                if (range == null) {
                                    return null
                                }
                                return fixer.replaceTextRange(
                                    range,
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
