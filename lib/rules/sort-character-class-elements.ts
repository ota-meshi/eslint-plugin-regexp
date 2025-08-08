import type {
    CharacterClass,
    CharacterClassElement,
    ClassRangesCharacterClassElement,
    UnicodePropertyCharacterSet,
    UnicodeSetsCharacterClassElement,
} from "@eslint-community/regexpp/ast"
import type { RegExpVisitor } from "@eslint-community/regexpp/visitor"
import type { ReadonlyWord } from "refa"
import type { ReadonlyFlags } from "regexp-ast-analysis"
import { toUnicodeSet } from "regexp-ast-analysis"
import type { ObjectOption } from "../types"
import type { RegExpContext } from "../utils"
import { createRule, defineRegexpVisitor } from "../utils"
import { getLexicographicallySmallest } from "../utils/lexicographically-smallest"
import { mention } from "../utils/mention"

type CharacterClassElementKind =
    | "\\w"
    | "\\d"
    | "\\s"
    | "\\p"
    | "*"
    | "\\q"
    | "[]"
const DEFAULT_ORDER: CharacterClassElementKind[] = [
    "\\s",
    "\\w",
    "\\d",
    "\\p",
    "*",
    "\\q",
    "[]",
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
    if (node.type === "ClassStringDisjunction") {
        return "\\q"
    }
    if (
        node.type === "CharacterClass" ||
        node.type === "ExpressionCharacterClass"
    ) {
        return "[]"
    }
    return "*"
}

/**
 * Return the lexicographically smallest string accepted by the given element.
 * If the class set is negate, the original value is used for calculation.
 */
function getLexicographicallySmallestFromElement(
    node: CharacterClassElement,
    flags: ReadonlyFlags,
): ReadonlyWord {
    const us =
        node.type === "CharacterSet" && node.negate
            ? toUnicodeSet({ ...node, negate: false }, flags)
            : toUnicodeSet(node, flags)
    return getLexicographicallySmallest(us) || []
}

/**
 * Compare two strings of char sets by byte order.
 */
function compareWords(a: ReadonlyWord, b: ReadonlyWord): number {
    const l = Math.min(a.length, b.length)
    for (let i = 0; i < l; i++) {
        const aI = a[i]
        const bI = b[i]
        if (aI !== bI) return aI - bI
    }
    return a.length - b.length
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
                        items: {
                            enum: [
                                "\\s",
                                "\\w",
                                "\\d",
                                "\\p",
                                "*",
                                "\\q",
                                "[]",
                            ],
                        },
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
            "\\q"?: number
            "[]"?: number
        } = { "*": Infinity }

        ;(
            ((context.options[0] as ObjectOption)?.order ??
                DEFAULT_ORDER) as CharacterClassElementKind[]
        ).forEach((o, i) => {
            orderOption[o] = i + 1
        })

        function createVisitor({
            node,
            flags,
            getRegexpLocation,
            patternSource,
        }: RegExpContext): RegExpVisitor.Handlers {
            return {
                onCharacterClassEnter(ccNode) {
                    const prevList: CharacterClassElement[] = []
                    for (const next of ccNode.elements) {
                        if (prevList.length) {
                            const prev = prevList[0]
                            if (!isValidOrder(prev, next, flags)) {
                                let moveTarget = prev
                                for (const p of prevList) {
                                    if (isValidOrder(p, next, flags)) {
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
            flags: ReadonlyFlags,
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

            const prevOrderShortCircuit = DEFAULT_ORDER.indexOf(prevKind)
            const nextOrderShortCircuit = DEFAULT_ORDER.indexOf(nextKind)
            if (prevOrderShortCircuit < nextOrderShortCircuit) {
                return true
            } else if (prevOrderShortCircuit > nextOrderShortCircuit) {
                return false
            }

            if (
                prev.type === "CharacterSet" &&
                prev.kind === "property" &&
                next.type === "CharacterSet" &&
                next.kind === "property"
            ) {
                return isValidOrderForUnicodePropertyCharacterSet(prev, next)
            }

            const prevWord = getLexicographicallySmallestFromElement(
                prev,
                flags,
            )
            const nextWord = getLexicographicallySmallestFromElement(
                next,
                flags,
            )
            if (compareWords(prevWord, nextWord) <= 0) {
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
        const elements: (
            | UnicodeSetsCharacterClassElement
            | ClassRangesCharacterClassElement
        )[] = parent.elements
        const prev = elements[elements.indexOf(target) - 1]
        if (
            prev &&
            (prev.type === "Character" || prev.type === "CharacterSet")
        ) {
            raw = `\\${raw}`
        }
    } else if (raw[0] === "^") {
        const parent = target.parent as CharacterClass
        const elements: (
            | UnicodeSetsCharacterClassElement
            | ClassRangesCharacterClassElement
        )[] = parent.elements
        if (elements[0] === target) {
            raw = `\\${raw}`
        }
    }
    if (target.raw[0] === "-") {
        if (node.type === "Character" || node.type === "CharacterSet") {
            raw = `${raw}\\`
        }
    }
    return raw
}
