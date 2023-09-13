import type { RegExpVisitor } from "@eslint-community/regexpp/visitor"
import type {
    CharacterClass,
    CharacterClassElement,
    UnicodePropertyCharacterSet,
} from "@eslint-community/regexpp/ast"
import type { RegExpContext } from "../utils"
import {
    CP_DIGIT_ZERO,
    CP_SPACE,
    createRule,
    defineRegexpVisitor,
} from "../utils"
import { mention } from "../utils/mention"

type CharacterClassElementKind = "\\w" | "\\d" | "\\s" | "\\p" | "*"
const DEFAULT_ORDER: CharacterClassElementKind[] = [
    "\\s",
    "\\w",
    "\\d",
    "\\p",
    "*",
]

/**
 * Get kind of CharacterClassElement for given CharacterClassElement
 */
function getCharacterClassElementKind(
    node: CharacterClassElement,
): CharacterClassElementKind {
    if (node.type === "CharacterSet") {
        return node.kind === "word"
            ? "\\w"
            : node.kind === "digit"
            ? "\\d"
            : node.kind === "space"
            ? "\\s"
            : "\\p"
    }
    return "*"
}

export default createRule("sort-character-class-elements", {
    meta: {
        docs: {
            description: "enforces elements order in character class",
            category: "Stylistic Issues",
            recommended: false,
        },
        fixable: "code",
        schema: [
            {
                type: "object",
                properties: {
                    order: {
                        type: "array",
                        items: { enum: ["\\w", "\\d", "\\s", "\\p", "*"] },
                    },
                },
                additionalProperties: false,
            },
        ],
        messages: {
            sortElements:
                "Expected character class elements to be in ascending order. {{next}} should be before {{prev}}.",
        },
        type: "layout",
    },
    create(context) {
        const orderOption: {
            "*": number
            "\\w"?: number
            "\\d"?: number
            "\\s"?: number
            "\\p"?: number
        } = { "*": Infinity }

        ;(
            (context.options[0]?.order ??
                DEFAULT_ORDER) as CharacterClassElementKind[]
        ).forEach((o, i) => {
            orderOption[o] = i + 1
        })

        function createVisitor({
            node,
            getRegexpLocation,
            patternSource,
        }: RegExpContext): RegExpVisitor.Handlers {
            return {
                onCharacterClassEnter(ccNode) {
                    const prevList: CharacterClassElement[] = []
                    for (const next of ccNode.elements) {
                        if (prevList.length) {
                            const prev = prevList[0]
                            if (!isValidOrder(prev, next)) {
                                let moveTarget = prev
                                for (const p of prevList) {
                                    if (isValidOrder(p, next)) {
                                        break
                                    } else {
                                        moveTarget = p
                                    }
                                }
                                context.report({
                                    node,
                                    loc: getRegexpLocation(next),
                                    messageId: "sortElements",
                                    data: {
                                        next: mention(next),
                                        prev: mention(moveTarget),
                                    },
                                    *fix(fixer) {
                                        const nextRange =
                                            patternSource.getReplaceRange(next)
                                        const targetRange =
                                            patternSource.getReplaceRange(
                                                moveTarget,
                                            )

                                        if (!targetRange || !nextRange) {
                                            return
                                        }

                                        yield targetRange.insertBefore(
                                            fixer,
                                            escapeRaw(next, moveTarget),
                                        )

                                        yield nextRange.remove(fixer)
                                    },
                                })
                            }
                        }
                        prevList.unshift(next)
                    }
                },
            }
        }

        /**
         * Check that the two given CharacterClassElements are in a valid order.
         */
        function isValidOrder(
            prev: CharacterClassElement,
            next: CharacterClassElement,
        ) {
            const prevKind = getCharacterClassElementKind(prev)
            const nextKind = getCharacterClassElementKind(next)
            const prevOrder = orderOption[prevKind] ?? orderOption["*"]
            const nextOrder = orderOption[nextKind] ?? orderOption["*"]
            if (prevOrder < nextOrder) {
                return true
            } else if (prevOrder > nextOrder) {
                return false
            }
            if (prev.type === "CharacterSet" && prev.kind === "property") {
                if (next.type === "CharacterSet") {
                    if (next.kind === "property") {
                        return isValidOrderForUnicodePropertyCharacterSet(
                            prev,
                            next,
                        )
                    }
                    // e.g. /[\p{ASCII}\d]/
                    return false
                }
                // e.g. /[\p{ASCII}a]/
                return true
            } else if (
                next.type === "CharacterSet" &&
                next.kind === "property"
            ) {
                if (prev.type === "CharacterSet") {
                    // e.g. /[\d\p{ASCII}]/
                    return true
                }
                // e.g. /[a\p{ASCII}]/
                return false
            }
            if (prev.type === "CharacterSet" && next.type === "CharacterSet") {
                if (prev.kind === "word" && next.kind === "digit") {
                    return true
                }
                if (prev.kind === "digit" && next.kind === "word") {
                    return false
                }
            }
            const prevCP = getTargetCodePoint(prev)
            const nextCP = getTargetCodePoint(next)
            if (prevCP <= nextCP) {
                return true
            }
            return false
        }

        /**
         * Check that the two given UnicodePropertyCharacterSet are in a valid order.
         */
        function isValidOrderForUnicodePropertyCharacterSet(
            prev: UnicodePropertyCharacterSet,
            next: UnicodePropertyCharacterSet,
        ) {
            if (prev.key < next.key) {
                return true
            } else if (prev.key > next.key) {
                return false
            }
            if (prev.value) {
                if (next.value) {
                    if (prev.value <= next.value) {
                        return true
                    }
                    return false
                }
                return false
            }
            return true
        }

        /**
         * Gets the target code point for a given element.
         */
        function getTargetCodePoint(
            node: Exclude<CharacterClassElement, UnicodePropertyCharacterSet>,
        ) {
            if (node.type === "CharacterSet") {
                if (node.kind === "digit" || node.kind === "word") {
                    return CP_DIGIT_ZERO
                }
                if (node.kind === "space") {
                    return CP_SPACE
                }
                return Infinity
            }
            if (node.type === "CharacterClassRange") {
                return node.min.value
            }
            // FIXME: TS Error
            // @ts-expect-error -- FIXME
            return node.value
        }

        return defineRegexpVisitor(context, {
            createVisitor,
        })
    },
})

/**
 * get the escape text from the given CharacterClassElement.
 */
function escapeRaw(node: CharacterClassElement, target: CharacterClassElement) {
    let raw = node.raw
    if (raw.startsWith("-")) {
        const parent = target.parent as CharacterClass
        // FIXME: TS Error
        // @ts-expect-error -- FIXME
        const prev = parent.elements[parent.elements.indexOf(target) - 1]
        if (
            prev &&
            (prev.type === "Character" || prev.type === "CharacterSet")
        ) {
            raw = `\\${raw}`
        }
    }
    if (target.raw.startsWith("-")) {
        if (node.type === "Character" || node.type === "CharacterSet") {
            raw = `${raw}\\`
        }
    }
    return raw
}
