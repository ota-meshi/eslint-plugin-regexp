import type { RegExpVisitor } from "regexpp/visitor"
import type { Alternative, CapturingGroup, Element, Group } from "regexpp/ast"
import type { RegExpContext } from "../utils"
import { createRule, defineRegexpVisitor } from "../utils"
import {
    Chars,
    getFirstCharAfter,
    getFirstConsumedChar,
    hasSomeDescendant,
    isEmptyBackreference,
} from "regexp-ast-analysis"
import type { CharRange, CharSet } from "refa"

/**
 * Returns the union of all characters that can possibly be consumed by the
 * given element.
 */
function getConsumedChars(
    element: Element | Alternative,
    context: RegExpContext,
): CharSet {
    const ranges: CharRange[] = []

    // we misuse hasSomeDescendant to iterate all relevant elements
    hasSomeDescendant(
        element,
        (d) => {
            if (
                d.type === "Character" ||
                d.type === "CharacterClass" ||
                d.type === "CharacterSet"
            ) {
                ranges.push(...context.toCharSet(d).ranges)
            } else if (d.type === "Backreference" && !isEmptyBackreference(d)) {
                ranges.push(...getConsumedChars(d.resolved, context).ranges)
            }

            // always continue to the next element
            return false
        },
        // don't go into assertions
        (d) => d.type !== "Assertion" && d.type !== "CharacterClass",
    )

    return Chars.empty(context.flags).union(ranges)
}

/**
 * Assuming that the given group only consumes the given characters, this will
 * return whether the alternatives of the group can be reordered freely without
 * affecting the behavior of the regex.
 *
 * This also assumes that the alternatives of the given group do not contain
 * capturing group in such a way that their order matters.
 */
function canReorder(
    group: Group | CapturingGroup,
    consumedChars: CharSet,
    context: RegExpContext,
): boolean {
    return (
        getFirstCharAfter(group, "rtl", context.flags).char.isDisjointWith(
            consumedChars,
        ) &&
        getFirstCharAfter(group, "ltr", context.flags).char.isDisjointWith(
            consumedChars,
        )
    )
}

/**
 * Sorts the given alternatives.
 */
function sortAlternatives(
    alternatives: Alternative[],
    context: RegExpContext,
): void {
    const firstChars = new Map<Alternative, number>()
    for (const a of alternatives) {
        const chars = getFirstConsumedChar(a, "ltr", context.flags)
        const char =
            chars.empty || chars.char.isEmpty
                ? Infinity
                : chars.char.ranges[0].min
        firstChars.set(a, char)
    }

    alternatives.sort((a, b) => {
        const firstA = firstChars.get(a)!
        const firstB = firstChars.get(b)!
        if (firstA !== firstB) {
            return firstA - firstB
        }

        if (context.flags.ignoreCase) {
            return a.raw.toUpperCase().localeCompare(b.raw.toUpperCase())
        }

        return a.raw.localeCompare(b.raw)
    })
}

export default createRule("sort-alternatives", {
    meta: {
        docs: {
            description: "sort alternatives if order doesn't matter",
            category: "Best Practices",
            recommended: false,
        },
        fixable: "code",
        schema: [],
        messages: {
            sort:
                "The alternatives of this group can be sorted without affecting the regex.",
        },
        type: "suggestion", // "problem",
    },
    create(context) {
        /**
         * Create visitor
         */
        function createVisitor(
            regexpContext: RegExpContext,
        ): RegExpVisitor.Handlers {
            const { node, getRegexpLocation, fixReplaceNode } = regexpContext

            /** */
            function onGroup(group: Group | CapturingGroup): void {
                if (group.alternatives.length < 2) {
                    return
                }

                const consumedChars = getConsumedChars(group, regexpContext)
                if (!canReorder(group, consumedChars, regexpContext)) {
                    return
                }

                const alternatives = [...group.alternatives]
                sortAlternatives(alternatives, regexpContext)

                const reordered = alternatives.some(
                    (a, i) => group.alternatives[i] !== a,
                )

                if (reordered) {
                    context.report({
                        node,
                        loc: getRegexpLocation(group),
                        messageId: "sort",
                        fix: fixReplaceNode(group, () => {
                            const prefix = group.raw.slice(
                                0,
                                group.alternatives[0].start - group.start,
                            )
                            const suffix = group.raw.slice(
                                group.alternatives[
                                    group.alternatives.length - 1
                                ].end - group.start,
                            )

                            return (
                                prefix +
                                alternatives.map((a) => a.raw).join("|") +
                                suffix
                            )
                        }),
                    })
                }
            }

            return {
                onGroupEnter: onGroup,
                onCapturingGroupEnter: onGroup,
            }
        }

        return defineRegexpVisitor(context, {
            createVisitor,
        })
    },
})
