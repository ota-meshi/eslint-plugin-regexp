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
import {
    createRule,
    defineRegexpVisitor,
    getRegexpLocation,
    invisibleEscape,
    parseFlags,
} from "../utils"
import type { ReadonlyFlags } from "regexp-ast-analysis"
import { toCharSet } from "regexp-ast-analysis"
import type { CharRange } from "../utils/char-ranges"
import type { CharSet } from "refa"

type NodeAndCharSet<N extends CharacterClassElement> = {
    charSet: CharSet
    node: N
}

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
    a: NodeAndCharSet<CharacterClassRange>,
    b: NodeAndCharSet<CharacterClassRange>,
) {
    return getRangesIntersection(a.charSet.ranges[0], b.charSet.ranges[0])
}

/**
 * Gets the two given character class range ans character set intersections.
 * @param range The character class range.
 * @param set The character set.
 * @returns the two given character class range ans character set intersections.
 */
function getCharacterClassRangeAndCharacterSetIntersections(
    range: NodeAndCharSet<CharacterClassRange>,
    set: NodeAndCharSet<EscapeCharacterSet | UnicodePropertyCharacterSet>,
): {
    intersections: (number | CharRange)[]
    set?: NodeAndCharSet<EscapeCharacterSet | UnicodePropertyCharacterSet>
} {
    const codePointRange = {
        min: range.node.min.value,
        max: range.node.max.value,
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

    if (range.charSet.isSupersetOf(set.charSet)) {
        return {
            intersections: [],
            set,
        }
    }

    const ranges: CharRange[] = []
    const codePoints: number[] = []
    for (const r of set.charSet.ranges) {
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
    flags: ReadonlyFlags,
) {
    const characters = new Map<number, NodeAndCharSet<Character>[]>()
    const characterClassRanges = new Map<
        string,
        NodeAndCharSet<CharacterClassRange>[]
    >()
    const characterSets = new Map<
        string,
        NodeAndCharSet<EscapeCharacterSet | UnicodePropertyCharacterSet>[]
    >()

    for (const e of elements) {
        const charSet = toCharSet(e, flags)
        if (e.type === "Character") {
            const nodeAndCharSet = { node: e, charSet }
            const key = charSet.ranges[0].min
            const list = characters.get(key)
            if (list) {
                list.push(nodeAndCharSet)
            } else {
                characters.set(key, [nodeAndCharSet])
            }
        } else if (e.type === "CharacterClassRange") {
            const nodeAndCharSet = { node: e, charSet }
            const range = charSet.ranges[0]
            const key = String.fromCodePoint(range.min, range.max)
            const list = characterClassRanges.get(key)
            if (list) {
                list.push(nodeAndCharSet)
            } else {
                characterClassRanges.set(key, [nodeAndCharSet])
            }
        } else if (e.type === "CharacterSet") {
            const nodeAndCharSet = { node: e, charSet }
            const key = e.raw
            const list = characterSets.get(key)
            if (list) {
                list.push(nodeAndCharSet)
            } else {
                characterSets.set(key, [nodeAndCharSet])
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
            elements: NodeAndCharSet<CharacterClassElement>[],
        ) {
            for (const element of elements) {
                context.report({
                    node,
                    loc: getRegexpLocation(sourceCode, node, element.node),
                    messageId: "duplicates",
                    data: {
                        element: element.node.raw,
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
            characters: NodeAndCharSet<Character>[],
            element: NodeAndCharSet<CharacterClassElement>,
        ) {
            for (const char of characters) {
                context.report({
                    node,
                    loc: getRegexpLocation(sourceCode, node, char.node),
                    messageId: "charIsIncluded",
                    data: {
                        char: char.node.raw,
                        element: element.node.raw,
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
            elements: NodeAndCharSet<CharacterClassElement>[],
            intersectElement: NodeAndCharSet<CharacterClassElement>,
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
                    loc: getRegexpLocation(sourceCode, node, element.node),
                    messageId: "intersect",
                    data: {
                        elementA: element.node.raw,
                        elementB: intersectElement.node.raw,
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
            reportElement: NodeAndCharSet<
                Exclude<CharacterSet, AnyCharacterSet> | CharacterClassRange
            >,
            element: NodeAndCharSet<
                Exclude<CharacterSet, AnyCharacterSet> | CharacterClassRange
            >,
        ) {
            context.report({
                node,
                loc: getRegexpLocation(sourceCode, node, reportElement.node),
                messageId: "elementIsInElement",
                data: {
                    reportElement: reportElement.node.raw,
                    element: element.node.raw,
                },
            })
        }

        /**
         * Create visitor
         * @param node
         */
        function createVisitor(
            node: Expression,
            _pattern: string,
            flagsStr: string,
        ): RegExpVisitor.Handlers {
            const flags = parseFlags(flagsStr)
            return {
                onCharacterClassEnter(ccNode: CharacterClass) {
                    const {
                        characters,
                        characterClassRanges,
                        characterSets,
                    } = groupingElements(ccNode.elements, flags)

                    for (const [char, ...dupeChars] of characters) {
                        if (dupeChars.length) {
                            reportDuplicates(node, [char, ...dupeChars])
                        }

                        for (const [rangeOrSet] of [
                            ...characterClassRanges,
                            ...characterSets,
                        ]) {
                            if (rangeOrSet.charSet.isSupersetOf(char.charSet)) {
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
                            if (otherSet.charSet.isSupersetOf(set.charSet)) {
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
