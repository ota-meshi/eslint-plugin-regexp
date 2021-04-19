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
import { createRule, defineRegexpVisitor, getRegexpLocation } from "../utils"
import type { CharSet } from "refa"
import { JS } from "refa"
import type { ReadonlyFlags } from "regexp-ast-analysis"

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

/**
 * Returns a readable representation of the given char set.
 */
function charSetToReadableString(
    charSet: CharSet,
    flags: ReadonlyFlags,
): string {
    return JS.toLiteral(
        {
            type: "Concatenation",
            elements: [{ type: "CharacterClass", characters: charSet }],
        },
        { flags },
    ).source
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
            intersection: CharSet,
            flags: ReadonlyFlags,
        ) {
            for (const element of elements) {
                context.report({
                    node,
                    loc: getRegexpLocation(sourceCode, node, element),
                    messageId: "intersect",
                    data: {
                        elementA: element.raw,
                        elementB: intersectElement.raw,
                        intersection: charSetToReadableString(
                            intersection,
                            flags,
                        ),
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
            const { toCharSet, node, flags } = regexpContext
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

                            const intersection = toCharSet(range).intersect(
                                toCharSet(other),
                            )

                            if (!intersection.isEmpty) {
                                // only report if it includes the ends of the range.
                                // there is no point in reporting overlaps that can't be fixed.
                                if (
                                    intersection.has(range.min.value) ||
                                    intersection.has(range.max.value)
                                ) {
                                    const reportRanges = intersection.ranges.filter(
                                        ({ min, max }) => {
                                            return (
                                                min === range.min.value ||
                                                max === range.max.value
                                            )
                                        },
                                    )
                                    reportIntersect(
                                        node,
                                        [range, ...dupeRanges],
                                        other,
                                        intersection.intersect(reportRanges),
                                        flags,
                                    )
                                }
                            }
                        }
                    }
                    for (const [set, ...dupeSets] of characterSets) {
                        if (dupeSets.length) {
                            reportDuplicates(node, [set, ...dupeSets])
                        }
                        for (const [other] of characterSets.filter(
                            ([o]) => o !== set,
                        )) {
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
