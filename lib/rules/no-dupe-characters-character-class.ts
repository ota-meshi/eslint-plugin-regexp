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
import type { CharSet } from "refa"

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
 * Gets the two given CharRanges intersections.
 */
function getCharRangesIntersections(
    rangesA: readonly CharRange[],
    rangesB: readonly CharRange[],
): {
    a: CharRange
    b: CharRange
    intersection: CharRange
}[] {
    const intersections = []
    for (const a of rangesA) {
        for (const b of rangesB) {
            const intersection = getRangesIntersection(a, b)
            if (intersection) {
                intersections.push({ a, b, intersection })
            }
        }
    }
    return intersections
}

/**
 * Gets the given character class range and other intersection.
 * @param range The character class range.
 * @param other The character class range or character set.
 */
function getCharacterClassRangeAndCharacterClassRangeOrCharacterSetIntersections(
    range: CharacterClassRange,
    other:
        | CharacterClassRange
        | EscapeCharacterSet
        | UnicodePropertyCharacterSet,
    { toCharSet }: RegExpContext,
): (number | CharRange)[] {
    if (other.type === "CharacterClassRange") {
        return getCharRangesIntersections(
            toCharSet(range).ranges,
            toCharSet(other).ranges,
        ).map(({ intersection }) => intersection)
    }

    const minCodePoints = toCharSet(range.min).ranges.map(({ min: cp }) => cp)
    const maxCodePoints = toCharSet(range.max).ranges.map(({ min: cp }) => cp)

    /**
     * Gets the min and max that match the code points.
     * @param codePoints The code points to check
     */
    function getMinAndMaxMatchCodePoints(codePoints: number[]) {
        const result: number[] = []
        if (minCodePoints.every((cp) => codePoints.includes(cp))) {
            result.push(...minCodePoints)
        }
        if (maxCodePoints.every((cp) => codePoints.includes(cp))) {
            result.push(...maxCodePoints)
        }
        return result
    }

    /**
     * Gets the intersections that do not separate the range.
     * @param otherRanges the range to check
     * @returns intersections
     */
    function getIntersectionAndNotSeparate(otherRanges: CharRange[]) {
        const intersections = []
        for (const result of getCharRangesIntersections(
            toCharSet(range).ranges,
            otherRanges,
        )) {
            const codePointRange = result.a
            const intersection = result.intersection

            if (
                codePointRange.min < intersection.min &&
                intersection.max < codePointRange.max
            ) {
                // When separating the range, the intersection is not returned.
                continue
            }
            intersections.push(intersection)
        }
        return intersections
    }

    const ranges: CharRange[] = []
    const codePoints: number[] = []
    for (const r of toCharSet(other).ranges) {
        if (r.min === r.max) {
            codePoints.push(r.min)
        } else {
            ranges.push(r)
        }
    }

    const result = getMinAndMaxMatchCodePoints(codePoints)
    const intersections = getIntersectionAndNotSeparate(ranges)
    return [...result, ...intersections]
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
            const key = buildRangeKey(charSet)
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

    /**
     * Build key of range
     */
    function buildRangeKey(rangeCharSet: CharSet) {
        return rangeCharSet.ranges
            .map((r) => String.fromCodePoint(r.min, r.max))
            .join(",")
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
            elementIsInElement:
                "The '{{reportElement}}' is included in '{{element}}'.",
            intersect:
                "Unexpected intersection of '{{elementA}}' and '{{elementB}}' was found '{{intersection}}'.",
        },
    },
    create(context) {
        const sourceCode = context.getSourceCode()

        const elementInElementReported = new Map<
            CharacterClassElement,
            CharacterClassElement[]
        >()

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
         * Checks if it was reported as the element included in the element.
         */
        function isElementInElementReported(
            a: CharacterClassElement,
            b: CharacterClassElement,
        ) {
            return (
                elementInElementReported.get(a)?.includes(b) ||
                elementInElementReported.get(b)?.includes(a)
            )
        }

        /**
         * Report the element included in the element.
         */
        function reportElementInElement(
            node: Expression,
            reportElements: CharacterClassElement[],
            element:
                | Exclude<CharacterSet, AnyCharacterSet>
                | CharacterClassRange,
        ) {
            for (const reportElement of reportElements) {
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
            let reportedList = elementInElementReported.get(reportElements[0])
            if (reportedList) {
                reportedList.push(element)
            } else {
                elementInElementReported.set(reportElements[0], [element])
            }
            reportedList = elementInElementReported.get(element)
            if (reportedList) {
                reportedList.push(reportElements[0])
            } else {
                elementInElementReported.set(element, [reportElements[0]])
            }
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
                // eslint-disable-next-line complexity -- X(
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
                                reportElementInElement(
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

                        for (const [other, ...others] of [
                            ...characterClassRanges.filter(
                                ([ccr]) => ccr !== range,
                            ),
                            ...characterSets,
                        ]) {
                            if (isElementInElementReported(range, other)) {
                                continue
                            }
                            if (
                                toCharSet(other).isSupersetOf(toCharSet(range))
                            ) {
                                reportElementInElement(
                                    node,
                                    [range, ...dupeRanges],
                                    other,
                                )
                                continue
                            }
                            if (
                                toCharSet(range).isSupersetOf(toCharSet(other))
                            ) {
                                reportElementInElement(
                                    node,
                                    [other, ...others],
                                    range,
                                )
                                continue
                            }
                            const intersections = getCharacterClassRangeAndCharacterClassRangeOrCharacterSetIntersections(
                                range,
                                other,
                                regexpContext,
                            )
                            for (const intersection of intersections) {
                                reportIntersect(
                                    node,
                                    [range, ...dupeRanges],
                                    other,
                                    intersection,
                                )
                            }
                        }
                    }
                    for (const [set, ...dupeSets] of characterSets) {
                        if (dupeSets.length) {
                            reportDuplicates(node, [set, ...dupeSets])
                        }
                        for (const [other] of [
                            ...characterSets.filter(([o]) => o !== set),
                            ...characterClassRanges,
                        ]) {
                            if (isElementInElementReported(set, other)) {
                                continue
                            }
                            if (toCharSet(other).isSupersetOf(toCharSet(set))) {
                                reportElementInElement(
                                    node,
                                    [set, ...dupeSets],
                                    other,
                                )
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
