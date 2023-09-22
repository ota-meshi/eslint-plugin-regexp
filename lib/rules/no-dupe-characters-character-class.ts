import type { RegExpVisitor } from "@eslint-community/regexpp/visitor"
import type {
    CharacterClass,
    CharacterClassElement,
    Character,
    EscapeCharacterSet,
    UnicodePropertyCharacterSet,
    CharacterClassRange,
    CharacterSet,
    AnyCharacterSet,
    UnicodeSetsCharacterClass,
    ClassStringDisjunction,
    ExpressionCharacterClass,
} from "@eslint-community/regexpp/ast"
import type { RegExpContext } from "../utils"
import {
    createRule,
    defineRegexpVisitor,
    toCharSetSource,
    fixRemoveCharacterClassElement,
    assertValidFlags,
} from "../utils"
import type { CharRange, CharSet } from "refa"
import { JS } from "refa"
import type { ReadonlyFlags } from "regexp-ast-analysis"
import { toCharSet, toUnicodeSet } from "regexp-ast-analysis"
import { mentionChar } from "../utils/mention"
import { assertNever } from "../utils/util"

interface Grouping {
    duplicates: {
        element: CharacterClassElement
        duplicate: CharacterClassElement
    }[]
    characters: Character[]
    characterRanges: CharacterClassRange[]
    characterSetAndClasses: (
        | EscapeCharacterSet
        | UnicodePropertyCharacterSet
        | UnicodeSetsCharacterClass
        | ClassStringDisjunction
        | ExpressionCharacterClass
    )[]
}

/**
 * Grouping the given character class elements.
 * @param elements The elements to grouping.
 */
function groupElements(
    elements: CharacterClassElement[],
    flags: ReadonlyFlags,
): Grouping {
    const duplicates: Grouping["duplicates"] = []
    const characters = new Map<number, Character>()
    const characterRanges = new Map<string, CharacterClassRange>()
    const characterSetAndClasses = new Map<
        string,
        | EscapeCharacterSet
        | UnicodePropertyCharacterSet
        | UnicodeSetsCharacterClass
        | ClassStringDisjunction
        | ExpressionCharacterClass
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
        if (e.type === "Character") {
            const charSet = toCharSet(e, flags)
            const key = charSet.ranges[0].min
            addToGroup(characters, key, e)
        } else if (e.type === "CharacterClassRange") {
            const charSet = toCharSet(e, flags)
            const key = buildRangeKey(charSet)
            addToGroup(characterRanges, key, e)
        } else if (
            e.type === "CharacterSet" ||
            e.type === "CharacterClass" ||
            e.type === "ClassStringDisjunction" ||
            e.type === "ExpressionCharacterClass"
        ) {
            const key = e.raw
            addToGroup(characterSetAndClasses, key, e)
        } else {
            assertNever(e)
        }
    }

    return {
        duplicates,
        characters: [...characters.values()],
        characterRanges: [...characterRanges.values()],
        characterSetAndClasses: [...characterSetAndClasses.values()],
    }

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

export default createRule("no-dupe-characters-character-class", {
    meta: {
        type: "suggestion",
        docs: {
            description:
                "disallow duplicate characters in the RegExp character class",
            category: "Best Practices",
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
                "{{subsetElement}} is already included by the elements {{elements}}.",
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
                        duplicate: mentionChar(duplicate),
                    },
                    fix: fixRemoveCharacterClassElement(
                        regexpContext,
                        duplicate,
                    ),
                })
            } else {
                context.report({
                    node,
                    loc: getRegexpLocation(duplicate),
                    messageId: "duplicateNonObvious",
                    data: {
                        duplicate: mentionChar(duplicate),
                        element: mentionChar(element),
                    },
                    fix: fixRemoveCharacterClassElement(
                        regexpContext,
                        duplicate,
                    ),
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
                    elementA: mentionChar(element),
                    elementB: mentionChar(intersectElement),
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
                | CharacterClassRange
                | UnicodeSetsCharacterClass
                | ClassStringDisjunction
                | ExpressionCharacterClass,
        ) {
            const { node, getRegexpLocation } = regexpContext

            context.report({
                node,
                loc: getRegexpLocation(subsetElement),
                messageId: "subset",
                data: {
                    subsetElement: mentionChar(subsetElement),
                    element: mentionChar(element),
                },
                fix: fixRemoveCharacterClassElement(
                    regexpContext,
                    subsetElement,
                ),
            })
        }

        /**
         * Report the element included in the element.
         */
        function reportSubsetOfMany(
            regexpContext: RegExpContext,
            subsetElement: CharacterClassElement,
            elements: CharacterClassElement[],
        ) {
            const { node, getRegexpLocation } = regexpContext

            context.report({
                node,
                loc: getRegexpLocation(subsetElement),
                messageId: "subsetOfMany",
                data: {
                    subsetElement: mentionChar(subsetElement),
                    elements: `'${elements
                        .map((e) => e.raw)
                        .join("")}' (${elements.map(mentionChar).join(", ")})`,
                },
                fix: fixRemoveCharacterClassElement(
                    regexpContext,
                    subsetElement,
                ),
            })
        }

        function createVisitor(
            regexpContext: RegExpContext,
        ): RegExpVisitor.Handlers {
            const { flags } = regexpContext

            return {
                onCharacterClassEnter(ccNode: CharacterClass) {
                    const {
                        duplicates,
                        characters,
                        characterRanges,
                        characterSetAndClasses,
                    } = groupElements(ccNode.elements, flags)
                    const elementsOtherThanCharacter = [
                        ...characterRanges,
                        ...characterSetAndClasses,
                    ]

                    // keep track of all reported subset elements
                    const subsets = new Set<CharacterClassElement>()

                    // report all duplicates
                    for (const { element, duplicate } of duplicates) {
                        reportDuplicate(regexpContext, duplicate, element)
                        subsets.add(duplicate)
                    }

                    // report characters that are already matched by some range or set
                    for (const char of characters) {
                        for (const other of elementsOtherThanCharacter) {
                            if (
                                toUnicodeSet(other, flags).chars.has(char.value)
                            ) {
                                reportSubset(regexpContext, char, other)
                                subsets.add(char)
                                break
                            }
                        }
                    }

                    // report character ranges and sets that are already matched by some range or set
                    for (const element of elementsOtherThanCharacter) {
                        for (const other of elementsOtherThanCharacter) {
                            if (element === other || subsets.has(other)) {
                                continue
                            }

                            if (
                                toUnicodeSet(element, flags).isSubsetOf(
                                    toUnicodeSet(other, flags),
                                )
                            ) {
                                reportSubset(regexpContext, element, other)
                                subsets.add(element)
                                break
                            }
                        }
                    }

                    // character ranges and sets might be a subset of a combination of other elements
                    // e.g. `b-d` is a subset of `a-cd-f`
                    const characterTotal = toUnicodeSet(
                        characters.filter((c) => !subsets.has(c)),
                        flags,
                    )
                    for (const element of elementsOtherThanCharacter) {
                        if (subsets.has(element)) {
                            continue
                        }

                        const totalOthers = characterTotal.union(
                            ...elementsOtherThanCharacter
                                .filter((e) => !subsets.has(e) && e !== element)
                                .map((e) => toUnicodeSet(e, flags)),
                        )

                        const elementCharSet = toUnicodeSet(element, flags)
                        if (elementCharSet.isSubsetOf(totalOthers)) {
                            const superSetElements = ccNode.elements
                                .filter((e) => !subsets.has(e) && e !== element)
                                .filter(
                                    (e) =>
                                        !toUnicodeSet(e, flags).isDisjointWith(
                                            elementCharSet,
                                        ),
                                )

                            reportSubsetOfMany(
                                regexpContext,
                                element,
                                superSetElements,
                            )
                            subsets.add(element)
                        }
                    }

                    // report overlaps between ranges and sets
                    // e.g. `a-f` and `d-g` overlap
                    for (let i = 0; i < characterRanges.length; i++) {
                        const range = characterRanges[i]
                        if (subsets.has(range)) {
                            continue
                        }

                        for (
                            let j = i + 1;
                            j < elementsOtherThanCharacter.length;
                            j++
                        ) {
                            const other = elementsOtherThanCharacter[j]
                            if (range === other || subsets.has(other)) {
                                continue
                            }

                            const intersection = toUnicodeSet(
                                range,
                                flags,
                            ).intersect(toUnicodeSet(other, flags))
                            if (intersection.isEmpty) {
                                continue
                            }

                            // we are only interested in parts of the
                            // intersection that contain the min/max of the
                            // character range.
                            // there is no point in reporting overlaps that can't be fixed.
                            const interestingRanges =
                                // Range and string never intersect, so we can only check `chars`.
                                intersection.chars.ranges.filter(
                                    (r) =>
                                        inRange(r, range.min.value) ||
                                        inRange(r, range.max.value),
                                )

                            // we might break the ignore case property here
                            // (see GH #189).
                            // to prevent this, we will create a new CharSet
                            // using `createCharSet`
                            assertValidFlags(flags)
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
