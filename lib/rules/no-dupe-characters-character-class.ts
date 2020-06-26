import type { Expression } from "estree"
import type { RegExpVisitor } from "regexpp/visitor"
import type {
    CharacterClass,
    CharacterClassElement,
    Character,
    EscapeCharacterSet,
    UnicodePropertyCharacterSet,
    CharacterClassRange,
} from "regexpp/ast"
import {
    createRule,
    defineRegexpVisitor,
    getRegexpLocation,
    CP_DIGIT_ZERO,
    CP_DIGIT_NINE,
    CP_SMALL_A,
    CP_SMALL_Z,
    CP_CAPITAL_A,
    CP_CAPITAL_Z,
    CP_LOW_LINE,
} from "../utils"

const CP_SPACE = " ".codePointAt(0)!
const CPS_SINGLE_SPACES = new Set<number>(
    Array.from(
        " \f\n\r\t\v\u00a0\u1680\u180e\u2028\u2029\u202f\u205f\u3000\ufeff",
    ).map((s) => s.codePointAt(0)!),
)
const CP_EN_QUAD = "\u2000".codePointAt(0)!
const CP_HAIR_SPACE = "\u200a".codePointAt(0)!

const CP_RANGE_DIGIT = [CP_DIGIT_ZERO, CP_DIGIT_NINE] as const
const CP_RANGE_SMALL_LETTER = [CP_SMALL_A, CP_SMALL_Z] as const
const CP_RANGE_CAPITAL_LETTER = [CP_CAPITAL_A, CP_CAPITAL_Z] as const
const CP_RANGE_SPACES = [CP_EN_QUAD, CP_HAIR_SPACE] as const

const CP_RANGES_WORDS = [
    CP_RANGE_SMALL_LETTER,
    CP_RANGE_CAPITAL_LETTER,
    CP_RANGE_DIGIT,
]

/**
 * Checks if the given code point is within the code point range.
 * @param codePoint The code point to check.
 * @param range The range of code points of the range.
 * @returns {boolean} `true` if the given character is within the character class range.
 */
function isCodePointInRange(
    codePoint: number,
    [start, end]: readonly [number, number],
) {
    return start <= codePoint && codePoint <= end
}

/**
 * Checks if the given code point is digit.
 * @param codePoint The code point to check
 * @returns {boolean} `true` if the given code point is digit.
 */
function isDigit(codePoint: number) {
    return isCodePointInRange(codePoint, CP_RANGE_DIGIT)
}

/**
 * Checks if the given code point is space.
 * @param codePoint The code point to check
 * @returns {boolean} `true` if the given code point is space.
 */
function isSpace(codePoint: number) {
    return (
        CPS_SINGLE_SPACES.has(codePoint) ||
        isCodePointInRange(codePoint, CP_RANGE_SPACES)
    )
}

/**
 * Checks if the given code point is word.
 * @param codePoint The code point to check
 * @returns {boolean} `true` if the given code point is word.
 */
function isWord(codePoint: number) {
    return (
        CP_RANGES_WORDS.some((range) => isCodePointInRange(codePoint, range)) ||
        CP_LOW_LINE === codePoint
    )
}

/**
 * Code point to display string.
 * @param codePoint The code point to convert.
 * @returns {string} the string.
 */
function codePointToDispString(codePoint: number) {
    if (isSpace(codePoint)) {
        if (codePoint === CP_SPACE) {
            return " "
        }
        return `\\u${codePoint.toString(16).padStart(4, "0")}`
    }
    return String.fromCodePoint(codePoint)
}

/**
 * Checks if the given character is within the character class range.
 * @param char The character to check.
 * @param range The character class range to check.
 * @returns {boolean} `true` if the given character is within the character class range.
 */
function isCharacterInCharacterClassRange(
    char: Character,
    range: CharacterClassRange,
) {
    return range.min.value <= char.value && char.value <= range.max.value
}

/**
 * Checks if the given character is within the character set.
 * @param char The character to check.
 * @param set The character set to check.
 * @returns {boolean} `true` if the given character is within the character set.
 */
function isCharacterInCharacterSet(
    char: Character,
    set: EscapeCharacterSet | UnicodePropertyCharacterSet,
) {
    if (set.kind === "digit") {
        return set.negate ? !isDigit(char.value) : isDigit(char.value)
    }
    if (set.kind === "space") {
        return set.negate ? !isSpace(char.value) : isSpace(char.value)
    }
    if (set.kind === "word") {
        return set.negate ? !isWord(char.value) : isWord(char.value)
    }

    // It does not check Unicode properties.
    return false
}

/**
 * Gets the two given range intersection.
 * @param a The first range.
 * @param b The second range.
 * @returns the two given range intersection.
 */
function getRangesIntersection(
    a: readonly [number, number],
    b: readonly [number, number],
): [number, number] | null {
    if (b[1] < a[0] || a[1] < b[0]) {
        return null
    }

    return [Math.max(a[0], b[0]), Math.min(a[1], b[1])]
}

/**
 * Gets the two given character class range intersection.
 * @param a The first character class range.
 * @param b The second character class range.
 * @returns { [number, number] | null } the two given character class range is intersect.
 */
function getCharacterClassRangesIntersection(
    a: CharacterClassRange,
    b: CharacterClassRange,
) {
    return getRangesIntersection(
        [a.min.value, a.max.value],
        [b.min.value, b.max.value],
    )
}

/**
 * Gets the two given character class range ans character set intersections.
 * @param range The character class range.
 * @param set The character set.
 * @returns { (number | [number, number])[] } the two given character class range ans character set intersections.
 */
function getCharacterClassRangeAndCharacterSetIntersections(
    range: CharacterClassRange,
    set: EscapeCharacterSet | UnicodePropertyCharacterSet,
) {
    if (set.negate) {
        // It does not check negate character set.
        return []
    }
    const codePointRange = [range.min.value, range.max.value] as const

    /**
     * Checks if the given code point is at the edge of the range.
     * @param codePoint The code point to check
     * @returns {boolean} `true` if the given code point is at the edge of the range.
     */
    function isCodePointIsRangeEdge(codePoint: number) {
        return (
            codePointRange[0] === codePoint || codePointRange[1] === codePoint
        )
    }

    /**
     * Gets the intersections that do not separate the range.
     * @param otherRange the range to check
     * @returns intersection
     */
    function getIntersectionAndNotSeparate(
        otherRange: readonly [number, number],
    ) {
        const intersection = getRangesIntersection(codePointRange, otherRange)
        if (intersection) {
            if (
                codePointRange[0] < intersection[0] &&
                intersection[1] < codePointRange[1]
            ) {
                // When separating the range, the intersection is not returned.
                return null
            }
        }
        return intersection
    }

    if (set.kind === "digit") {
        const intersection = getRangesIntersection(
            codePointRange,
            CP_RANGE_DIGIT,
        )
        return intersection ? [intersection] : []
    }
    if (set.kind === "space") {
        const result: number[] = []
        for (const codePoint of CPS_SINGLE_SPACES) {
            if (isCodePointIsRangeEdge(codePoint)) {
                result.push(codePoint)
            }
        }
        const intersection = getIntersectionAndNotSeparate(CP_RANGE_SPACES)
        return intersection ? [...result, intersection] : result
    }
    if (set.kind === "word") {
        const intersections: [number, number][] = []
        for (const wordRange of CP_RANGES_WORDS) {
            const intersection = getIntersectionAndNotSeparate(wordRange)
            if (intersection) {
                intersections.push(intersection)
            }
        }
        return isCodePointIsRangeEdge(CP_LOW_LINE)
            ? [...intersections, CP_LOW_LINE]
            : intersections
    }

    // It does not check Unicode properties.
    return []
}

/**
 * Grouping the given character class elements.
 * @param elements The elements to grouping.
 */
function groupingElements(elements: CharacterClassElement[]) {
    const characters = new Map<number, Character[]>()
    const characterClassRanges = new Map<string, CharacterClassRange[]>()
    const characterSets = new Map<
        string,
        (EscapeCharacterSet | UnicodePropertyCharacterSet)[]
    >()

    for (const e of elements) {
        if (e.type === "Character") {
            const codePoint = e.value
            const list = characters.get(codePoint)
            if (list) {
                list.push(e)
            } else {
                characters.set(codePoint, [e])
            }
        } else if (e.type === "CharacterClassRange") {
            const key = String.fromCodePoint(e.min.value, e.max.value)
            const list = characterClassRanges.get(key)
            if (list) {
                list.push(e)
            } else {
                characterClassRanges.set(key, [e])
            }
        } else if (e.type === "CharacterSet") {
            const key = buildCharacterSetKey(e)
            const list = characterSets.get(key)
            if (list) {
                list.push(e)
            } else {
                characterSets.set(key, [e])
            }
        }
    }

    return {
        characters,
        characterClassRanges,
        characterSets,
    }

    /**
     * @param characterSet
     */
    function buildCharacterSetKey(
        characterSet: EscapeCharacterSet | UnicodePropertyCharacterSet,
    ): string {
        if (characterSet.kind === "digit") {
            return characterSet.negate ? "D" : "d"
        }
        if (characterSet.kind === "space") {
            return characterSet.negate ? "S" : "s"
        }
        if (characterSet.kind === "word") {
            return characterSet.negate ? "W" : "w"
        }
        if (characterSet.kind === "property") {
            return `${`${characterSet.negate ? "P" : "p"}{${
                characterSet.value != null
                    ? `${characterSet.key}=${characterSet.value}`
                    : characterSet.key
            }`}}`
        }
        return Symbol("unknown CharacterSet") as any
    }
}

export default createRule("no-dupe-characters-character-class", {
    meta: {
        type: "suggestion",
        docs: {
            description:
                "disallow duplicate characters in the RegExp character class",
            recommended: true,
        },
        schema: [],
        messages: {
            duplicates: 'Unexpected element "{{element}}" duplication.',
            charIsIncluded: 'The "{{char}}" is included in "{{element}}".',
            intersect:
                'Unexpected intersection of "{{elementA}}" and "{{elementB}}" was found "{{intersection}}".',
        },
    },
    create(context) {
        const sourceCode = context.getSourceCode()

        /**
         * Report duplicate elements.
         * @param node The node to report.
         * @param elements The elements to report
         */
        function reportDuplicates(
            node: Expression,
            elements: CharacterClassElement[],
        ) {
            for (const element of elements) {
                context.report({
                    node,
                    loc: getRegexpLocation(sourceCode, node, element),
                    messageId: "duplicates",
                    data: {
                        element: element.raw,
                    },
                })
            }
        }

        /**
         * Report the character included in the element.
         * @param node The node to report.
         * @param characters The characters to report
         * @param element The element
         */
        function reportCharIncluded(
            node: Expression,
            characters: Character[],
            element: CharacterClassElement,
        ) {
            for (const char of characters) {
                context.report({
                    node,
                    loc: getRegexpLocation(sourceCode, node, char),
                    messageId: "charIsIncluded",
                    data: {
                        char: char.raw,
                        element: element.raw,
                    },
                })
            }
        }

        /**
         * Reports that the elements intersect.
         * @param node The node to report.
         * @param elements The elements to report
         * @param intersectElement The intersecting element.
         * @param intersection the intersection
         */
        function reportIntersect(
            node: Expression,
            elements: CharacterClassElement[],
            intersectElement: CharacterClassElement,
            intersection: [number, number] | number,
        ) {
            const intersectionText =
                typeof intersection === "number"
                    ? codePointToDispString(intersection)
                    : intersection[0] === intersection[1]
                    ? codePointToDispString(intersection[0])
                    : `${codePointToDispString(
                          intersection[0],
                      )}-${codePointToDispString(intersection[1])}`
            for (const element of elements) {
                context.report({
                    node,
                    loc: getRegexpLocation(sourceCode, node, element),
                    messageId: "intersect",
                    data: {
                        elementA: element.raw,
                        elementB: intersectElement.raw,
                        intersection: intersectionText,
                    },
                })
            }
        }

        /**
         * Create visitor
         * @param node
         */
        function createVisitor(node: Expression): RegExpVisitor.Handlers {
            return {
                onCharacterClassEnter(ccNode: CharacterClass) {
                    const {
                        characters,
                        characterClassRanges,
                        characterSets,
                    } = groupingElements(ccNode.elements)

                    for (const [char, ...dupeChars] of characters.values()) {
                        if (dupeChars.length) {
                            reportDuplicates(node, [char, ...dupeChars])
                        }

                        for (const [range] of characterClassRanges.values()) {
                            if (isCharacterInCharacterClassRange(char, range)) {
                                reportCharIncluded(
                                    node,
                                    [char, ...dupeChars],
                                    range,
                                )
                            }
                        }
                        for (const [set] of characterSets.values()) {
                            if (isCharacterInCharacterSet(char, set)) {
                                reportCharIncluded(
                                    node,
                                    [char, ...dupeChars],
                                    set,
                                )
                            }
                        }
                    }

                    for (const [
                        key,
                        [range, ...dupeRanges],
                    ] of characterClassRanges) {
                        if (dupeRanges.length) {
                            reportDuplicates(node, [range, ...dupeRanges])
                        }

                        for (const [
                            keyOther,
                            [rangeOther],
                        ] of characterClassRanges) {
                            if (keyOther === key) {
                                continue
                            }
                            const intersection = getCharacterClassRangesIntersection(
                                range,
                                rangeOther,
                            )
                            if (intersection) {
                                reportIntersect(
                                    node,
                                    [range, ...dupeRanges],
                                    rangeOther,
                                    intersection,
                                )
                            }
                        }

                        for (const [set] of characterSets.values()) {
                            const intersections = getCharacterClassRangeAndCharacterSetIntersections(
                                range,
                                set,
                            )
                            for (const intersection of intersections) {
                                reportIntersect(
                                    node,
                                    [range, ...dupeRanges],
                                    set,
                                    intersection,
                                )
                            }
                        }
                    }
                    for (const [set, ...dupeSets] of characterSets.values()) {
                        if (dupeSets.length) {
                            reportDuplicates(node, [set, ...dupeSets])
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
