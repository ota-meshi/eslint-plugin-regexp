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
    toCharSetSource,
    mightCreateNewElement,
} from "../utils"
import type { CharRange, CharSet } from "refa"
import { JS } from "refa"
// eslint-disable-next-line no-restricted-imports -- there's no way around it
import { toCharSet as uncachedToCharSet } from "regexp-ast-analysis"
import type { Rule } from "eslint"

interface Grouping {
    duplicates: {
        element: CharacterClassElement
        duplicate: CharacterClassElement
    }[]
    characters: Character[]
    characterRanges: CharacterClassRange[]
    characterSets: (EscapeCharacterSet | UnicodePropertyCharacterSet)[]
}

/**
 * Grouping the given character class elements.
 * @param elements The elements to grouping.
 */
function groupElements(
    elements: CharacterClassElement[],
    { toCharSet }: RegExpContext,
): Grouping {
    const duplicates: Grouping["duplicates"] = []
    const characters = new Map<number, Character>()
    const characterRanges = new Map<string, CharacterClassRange>()
    const characterSets = new Map<
        string,
        EscapeCharacterSet | UnicodePropertyCharacterSet
    >()

    /**
     * If the given element is a duplicate of another element, it will be added
     * to the the duplicates array. Otherwise, it will be added to the given
     * group.
     */
    function addToGroup<K, V extends CharacterClassElement>(
        group: Map<K, V>,
        key: K,
        element: V,
    ) {
        const current = group.get(key)
        if (current !== undefined) {
            duplicates.push({ element: current, duplicate: element })
        } else {
            group.set(key, element)
        }
    }

    for (const e of elements) {
        const charSet = toCharSet(e)

        if (e.type === "Character") {
            const key = charSet.ranges[0].min
            addToGroup(characters, key, e)
        } else if (e.type === "CharacterClassRange") {
            const key = buildRangeKey(charSet)
            addToGroup(characterRanges, key, e)
        } else if (e.type === "CharacterSet") {
            const key = e.raw
            addToGroup(characterSets, key, e)
        }
    }

    return {
        duplicates,
        characters: [...characters.values()],
        characterRanges: [...characterRanges.values()],
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
 * Returns whether the given character is within the bounds of the given char range.
 */
function inRange({ min, max }: CharRange, char: number): boolean {
    return min <= char && char <= max
}

/**
 * Removes the given character class element from its character class.
 */
function fixRemove(
    context: RegExpContext,
    element: CharacterClassElement,
): Rule.ReportDescriptor["fix"] {
    const parent = element.parent
    if (parent.type !== "CharacterClass") {
        throw new Error("Only call this function for character class elements.")
    }

    return context.fixReplaceNode(element, () => {
        const textBefore = parent.raw.slice(0, element.start - parent.start)
        const textAfter = parent.raw.slice(element.end - parent.start)

        if (mightCreateNewElement(textBefore, textAfter)) {
            return null
        }

        const elementBefore: CharacterClassElement | undefined =
            parent.elements[parent.elements.indexOf(element) - 1]
        const elementAfter: CharacterClassElement | undefined =
            parent.elements[parent.elements.indexOf(element) + 1]

        if (
            elementBefore &&
            elementAfter &&
            elementBefore.type === "Character" &&
            elementBefore.raw === "-" &&
            elementAfter.type === "Character"
        ) {
            // e.g. [\s0-\s9] -> [\s0-9] is incorrect
            return null
        }

        // add a backslash if ...
        if (
            // ... the text character is a dash
            // e.g. [a\w-b] -> [a\-b], [\w-b] -> [-b], [\s\w-b] -> [\s-b]
            (textAfter.startsWith("-") &&
                elementBefore &&
                elementBefore.type === "Character") ||
            // ... the next character is a caret and the caret will then be the
            // first character in the character class
            // e.g. [a^b] -> [\^b], [ba^] -> [b^]
            (textAfter.startsWith("^") && !parent.negate && !elementBefore)
        ) {
            return "\\"
        }

        return ""
    })
}

/**
 * Creates a string that mentions the given element.
 */
function mention(element: CharacterClassElement): string {
    /** Creates a "U+FFFF" string */
    function unicode(value: number): string {
        return `U+${value.toString(16).padStart(4, "0")}`
    }

    if (element.type === "Character") {
        return `'${element.raw}' (${unicode(element.value)})`
    } else if (element.type === "CharacterClassRange") {
        return `'${element.raw}' (${unicode(element.min.value)} - ${unicode(
            element.max.value,
        )})`
    }
    return `'${element.raw}'`
}

export default createRule("no-dupe-characters-character-class", {
    meta: {
        type: "suggestion",
        docs: {
            description:
                "disallow duplicate characters in the RegExp character class",
            recommended: true,
        },
        fixable: "code",
        schema: [],
        messages: {
            duplicate: "Unexpected duplicate {{duplicate}}.",
            duplicateNonObvious:
                "Unexpected duplicate. {{duplicate}} is a duplicate of {{element}}.",
            subset: "{{subsetElement}} is already included in {{element}}.",
            subsetOfMany:
                "{{subsetElement}} is already included by a combination of other elements.",
            overlap:
                "Unexpected overlap of {{elementA}} and {{elementB}} was found '{{overlap}}'.",
        },
    },
    create(context) {
        /**
         * Report a duplicate element.
         */
        function reportDuplicate(
            regexpContext: RegExpContext,
            duplicate: CharacterClassElement,
            element: CharacterClassElement,
        ) {
            const { node, getRegexpLocation } = regexpContext

            if (duplicate.raw === element.raw) {
                context.report({
                    node,
                    loc: getRegexpLocation(duplicate),
                    messageId: "duplicate",
                    data: {
                        duplicate: mention(duplicate),
                    },
                    fix: fixRemove(regexpContext, duplicate),
                })
            } else {
                context.report({
                    node,
                    loc: getRegexpLocation(duplicate),
                    messageId: "duplicateNonObvious",
                    data: {
                        duplicate: mention(duplicate),
                        element: mention(element),
                    },
                    fix: fixRemove(regexpContext, duplicate),
                })
            }
        }

        /**
         * Reports that the elements intersect.
         */
        function reportOverlap(
            { node, getRegexpLocation }: RegExpContext,
            element: CharacterClassRange,
            intersectElement: CharacterClassElement,
            overlap: string,
        ) {
            context.report({
                node,
                loc: getRegexpLocation(element),
                messageId: "overlap",
                data: {
                    elementA: mention(element),
                    elementB: mention(intersectElement),
                    overlap,
                },
            })
        }

        /**
         * Report the element included in the element.
         */
        function reportSubset(
            regexpContext: RegExpContext,
            subsetElement: CharacterClassElement,
            element:
                | Exclude<CharacterSet, AnyCharacterSet>
                | CharacterClassRange,
        ) {
            const { node, getRegexpLocation } = regexpContext

            context.report({
                node,
                loc: getRegexpLocation(subsetElement),
                messageId: "subset",
                data: {
                    subsetElement: mention(subsetElement),
                    element: mention(element),
                },
                fix: fixRemove(regexpContext, subsetElement),
            })
        }

        /**
         * Report the element included in the element.
         */
        function reportSubsetOfMany(
            regexpContext: RegExpContext,
            subsetElement: CharacterClassElement,
        ) {
            const { node, getRegexpLocation } = regexpContext

            context.report({
                node,
                loc: getRegexpLocation(subsetElement),
                messageId: "subsetOfMany",
                data: {
                    subsetElement: mention(subsetElement),
                },
                fix: fixRemove(regexpContext, subsetElement),
            })
        }

        /**
         * Create visitor
         */
        function createVisitor(
            regexpContext: RegExpContext,
        ): RegExpVisitor.Handlers {
            const { toCharSet, flags } = regexpContext

            return {
                // eslint-disable-next-line complexity -- X
                onCharacterClassEnter(ccNode: CharacterClass) {
                    const {
                        duplicates,
                        characters,
                        characterRanges,
                        characterSets,
                    } = groupElements(ccNode.elements, regexpContext)
                    const rangesAndSets = [...characterRanges, ...characterSets]

                    // report all duplicates
                    for (const { element, duplicate } of duplicates) {
                        reportDuplicate(regexpContext, duplicate, element)
                    }

                    // keep track of all reported subset elements
                    const subsets = new Set<CharacterClassElement>()

                    // report characters that are already matched by some range or set
                    for (const char of characters) {
                        for (const other of rangesAndSets) {
                            if (toCharSet(other).has(char.value)) {
                                reportSubset(regexpContext, char, other)
                                subsets.add(char)
                                break
                            }
                        }
                    }

                    // report character ranges and sets that are already matched by some range or set
                    for (const element of rangesAndSets) {
                        for (const other of rangesAndSets) {
                            if (element === other || subsets.has(other)) {
                                continue
                            }

                            if (
                                toCharSet(element).isSubsetOf(toCharSet(other))
                            ) {
                                reportSubset(regexpContext, element, other)
                                subsets.add(element)
                                break
                            }
                        }
                    }

                    // character ranges and sets might be a subset of a combination of other elements
                    // e.g. `b-d` is a subset of `a-cd-f`
                    const characterTotal = uncachedToCharSet(
                        characters.filter((c) => !subsets.has(c)),
                        flags,
                    )
                    for (const element of rangesAndSets) {
                        if (subsets.has(element)) {
                            continue
                        }

                        const totalOthers = characterTotal.union(
                            ...rangesAndSets
                                .filter((e) => !subsets.has(e) && e !== element)
                                .map((e) => toCharSet(e)),
                        )

                        if (toCharSet(element).isSubsetOf(totalOthers)) {
                            reportSubsetOfMany(regexpContext, element)
                            subsets.add(element)
                            break
                        }
                    }

                    // report overlaps between ranges and sets
                    // e.g. `a-f` and `d-g` overlap
                    for (let i = 0; i < characterRanges.length; i++) {
                        const range = characterRanges[i]
                        if (subsets.has(range)) {
                            continue
                        }

                        for (let j = i + 1; j < rangesAndSets.length; j++) {
                            const other = rangesAndSets[j]
                            if (range === other || subsets.has(other)) {
                                continue
                            }

                            const intersection = toCharSet(range).intersect(
                                toCharSet(other),
                            )
                            if (intersection.isEmpty) {
                                continue
                            }

                            // we are only interested in parts of the
                            // intersection that contain the min/max of the
                            // character range.
                            // there is no point in reporting overlaps that can't be fixed.
                            const interestingRanges = intersection.ranges.filter(
                                (r) =>
                                    inRange(r, range.min.value) ||
                                    inRange(r, range.max.value),
                            )

                            // we might break the ignore case property here
                            // (see GH #189).
                            // to prevent this, we will create a new CharSet
                            // using `createCharSet`
                            const interest = JS.createCharSet(
                                interestingRanges,
                                flags,
                            )

                            if (!interest.isEmpty) {
                                reportOverlap(
                                    regexpContext,
                                    range,
                                    other,
                                    toCharSetSource(interest, flags),
                                )
                                break
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
