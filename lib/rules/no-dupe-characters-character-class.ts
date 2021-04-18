import type { Expression } from "estree"
import type { RegExpVisitor } from "regexpp/visitor"
import type {
    CharacterClass,
    CharacterClassElement,
    Character,
    EscapeCharacterSet,
    UnicodePropertyCharacterSet,
    CharacterClassRange,
    CharacterSet,
    AnyCharacterSet,
} from "regexpp/ast"
import type { RegExpContext } from "../utils"
import {
    createRule,
    defineRegexpVisitor,
    getRegexpLocation,
    invisibleEscape,
} from "../utils"
import type { CharRange } from "../utils/char-ranges"

/**
 * Gets the two given range intersection.
 * @param a The first range.
 * @param b The second range.
 * @returns the two given range intersection.
 */
function getRangesIntersection(a: CharRange, b: CharRange): CharRange | null {
    if (b.max < a.min || a.max < b.min) {
        return null
    }

    return { min: Math.max(a.min, b.min), max: Math.min(a.max, b.max) }
}

/**
 * Gets the two given character class range intersection.
 * @param a The first character class range.
 * @param b The second character class range.
 * @returns the two given character class range is intersect.
 */
function getCharacterClassRangesIntersection(
    a: CharacterClassRange,
    b: CharacterClassRange,
    { toCharSet }: RegExpContext,
) {
    return getRangesIntersection(toCharSet(a).ranges[0], toCharSet(b).ranges[0])
}

/**
 * Gets the two given character class range ans character set intersections.
 * @param range The character class range.
 * @param set The character set.
 * @returns the two given character class range ans character set intersections.
 */
function getCharacterClassRangeAndCharacterSetIntersections(
    range: CharacterClassRange,
    set: EscapeCharacterSet | UnicodePropertyCharacterSet,
    { toCharSet }: RegExpContext,
): {
    intersections: (number | CharRange)[]
    set?: EscapeCharacterSet | UnicodePropertyCharacterSet
} {
    const codePointRange = {
        min: range.min.value,
        max: range.max.value,
    }

    /**
     * Checks if the given code point is at the edge of the range.
     * @param codePoint The code point to check
     * @returns `true` if the given code point is at the edge of the range.
     */
    function isCodePointIsRangeEdge(codePoint: number) {
        return (
            codePointRange.min === codePoint || codePointRange.max === codePoint
        )
    }

    /**
     * Gets the intersections that do not separate the range.
     * @param otherRange the range to check
     * @returns intersection
     */
    function getIntersectionAndNotSeparate(otherRange: CharRange) {
        const intersection = getRangesIntersection(codePointRange, otherRange)
        if (intersection) {
            if (
                codePointRange.min < intersection.min &&
                intersection.max < codePointRange.max
            ) {
                // When separating the range, the intersection is not returned.
                return null
            }
        }
        return intersection
    }

    if (toCharSet(range).isSupersetOf(toCharSet(set))) {
        return {
            intersections: [],
            set,
        }
    }

    const ranges: CharRange[] = []
    const codePoints: number[] = []
    for (const r of toCharSet(set).ranges) {
        if (r.min === r.max) {
            codePoints.push(r.min)
        } else {
            ranges.push(r)
        }
    }

    const result: number[] = codePoints.filter(isCodePointIsRangeEdge)
    const intersections: CharRange[] = []
    for (const r of ranges) {
        const intersection = getIntersectionAndNotSeparate(r)
        if (intersection) {
            intersections.push(intersection)
        }
    }
    return {
        intersections: [...result, ...intersections],
    }
}

/**
 * Grouping the given character class elements.
 * @param elements The elements to grouping.
 */
function groupingElements(
    elements: CharacterClassElement[],
    { toCharSet }: RegExpContext,
) {
    const characters = new Map<number, Character[]>()
    const characterClassRanges = new Map<string, CharacterClassRange[]>()
    const characterSets = new Map<
        string,
        (EscapeCharacterSet | UnicodePropertyCharacterSet)[]
    >()

    for (const e of elements) {
        const charSet = toCharSet(e)
        if (e.type === "Character") {
            const key = charSet.ranges[0].min
            const list = characters.get(key)
            if (list) {
                list.push(e)
            } else {
                characters.set(key, [e])
            }
        } else if (e.type === "CharacterClassRange") {
            const range = charSet.ranges[0]
            const key = String.fromCodePoint(range.min, range.max)
            const list = characterClassRanges.get(key)
            if (list) {
                list.push(e)
            } else {
                characterClassRanges.set(key, [e])
            }
        } else if (e.type === "CharacterSet") {
            const key = e.raw
            const list = characterSets.get(key)
            if (list) {
                list.push(e)
            } else {
                characterSets.set(key, [e])
            }
        }
    }

    return {
        characters: [...characters.values()],
        characterClassRanges: [...characterClassRanges.values()],
        characterSets: [...characterSets.values()],
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
            duplicates: "Unexpected element '{{element}}' duplication.",
            charIsIncluded: "The '{{char}}' is included in '{{element}}'.",
            elementIsInElement:
                "The '{{reportElement}}' is included in '{{element}}'.",
            intersect:
                "Unexpected intersection of '{{elementA}}' and '{{elementB}}' was found '{{intersection}}'.",
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
            intersection: CharRange | number,
        ) {
            const intersectionText =
                typeof intersection === "number"
                    ? invisibleEscape(intersection)
                    : intersection.min === intersection.max
                    ? invisibleEscape(intersection.min)
                    : `${invisibleEscape(intersection.min)}-${invisibleEscape(
                          intersection.max,
                      )}`
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
         * Report the element included in the element.
         */
        function reportElementInElement(
            node: Expression,
            reportElement:
                | Exclude<CharacterSet, AnyCharacterSet>
                | CharacterClassRange,
            element:
                | Exclude<CharacterSet, AnyCharacterSet>
                | CharacterClassRange,
        ) {
            context.report({
                node,
                loc: getRegexpLocation(sourceCode, node, reportElement),
                messageId: "elementIsInElement",
                data: {
                    reportElement: reportElement.raw,
                    element: element.raw,
                },
            })
        }

        /**
         * Create visitor
         */
        function createVisitor(
            _node: Expression,
            _pattern: string,
            _flagsStr: string,
            _regexpNode: Expression,
            regexpContext: RegExpContext,
        ): RegExpVisitor.Handlers {
            const { toCharSet, node } = regexpContext
            return {
                onCharacterClassEnter(ccNode: CharacterClass) {
                    const {
                        characters,
                        characterClassRanges,
                        characterSets,
                    } = groupingElements(ccNode.elements, regexpContext)

                    for (const [char, ...dupeChars] of characters) {
                        if (dupeChars.length) {
                            reportDuplicates(node, [char, ...dupeChars])
                        }

                        for (const [rangeOrSet] of [
                            ...characterClassRanges,
                            ...characterSets,
                        ]) {
                            if (
                                toCharSet(rangeOrSet).isSupersetOf(
                                    toCharSet(char),
                                )
                            ) {
                                reportCharIncluded(
                                    node,
                                    [char, ...dupeChars],
                                    rangeOrSet,
                                )
                            }
                        }
                    }

                    for (const [range, ...dupeRanges] of characterClassRanges) {
                        if (dupeRanges.length) {
                            reportDuplicates(node, [range, ...dupeRanges])
                        }

                        for (const [rangeOther] of characterClassRanges.filter(
                            ([ccr]) => ccr !== range,
                        )) {
                            const intersection = getCharacterClassRangesIntersection(
                                range,
                                rangeOther,
                                regexpContext,
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

                        for (const [set] of characterSets) {
                            const {
                                set: reportSet,
                                intersections,
                            } = getCharacterClassRangeAndCharacterSetIntersections(
                                range,
                                set,
                                regexpContext,
                            )
                            if (reportSet) {
                                reportElementInElement(node, reportSet, range)
                            }
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
                    for (const [set, ...dupeSets] of characterSets) {
                        if (dupeSets.length) {
                            reportDuplicates(node, [set, ...dupeSets])
                        }
                        for (const [otherSet] of characterSets.filter(
                            ([o]) => o !== set,
                        )) {
                            if (
                                toCharSet(otherSet).isSupersetOf(toCharSet(set))
                            ) {
                                reportElementInElement(node, set, otherSet)
                            }
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
