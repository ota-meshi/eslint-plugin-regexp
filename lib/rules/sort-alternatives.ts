import type { RegExpVisitor } from "regexpp/visitor"
import type {
    Alternative,
    CapturingGroup,
    Element,
    Group,
    LookaroundAssertion,
    Pattern,
} from "regexpp/ast"
import type { RegExpContext } from "../utils"
import { CP_MINUS, CP_SPACE, createRule, defineRegexpVisitor } from "../utils"
import type { ReadonlyFlags } from "regexp-ast-analysis"
import {
    getLengthRange,
    Chars,
    getFirstCharAfter,
    getFirstConsumedChar,
    hasSomeDescendant,
    isEmptyBackreference,
} from "regexp-ast-analysis"
import type { CharRange, CharSet } from "refa"
import { JS } from "refa"
import type { SourceLocation, Position } from "estree"

interface AllowedChars {
    allowed: CharSet
    required: CharSet
}
const cache = new Map<string, Readonly<AllowedChars>>()

/** */
function getAllowedChars(flags: ReadonlyFlags) {
    const cacheKey = (flags.ignoreCase ? "i" : "") + (flags.unicode ? "u" : "")
    let result = cache.get(cacheKey)
    if (result === undefined) {
        result = {
            allowed: JS.createCharSet(
                [
                    { kind: "word", negate: false },
                    { min: CP_SPACE, max: CP_SPACE },
                    { min: CP_MINUS, max: CP_MINUS },
                    { min: CP_MINUS, max: CP_MINUS },
                ],
                flags,
            ),
            required: Chars.word(flags),
        }
        cache.set(cacheKey, result)
    }
    return result
}

/**
 * Returns the union of all characters that can possibly be consumed by the
 * given element.
 */
function getConsumedChars(
    element: Element | Pattern | Alternative,
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

type Parent = Group | CapturingGroup | Pattern | LookaroundAssertion

/**
 * Assuming that the given group only consumes the given characters, this will
 * return whether the alternatives of the group can be reordered freely without
 * affecting the behavior of the regex.
 *
 * This also assumes that the alternatives of the given group do not contain
 * capturing group in such a way that their order matters.
 */
function canReorder(
    parent: Parent,
    consumedChars: CharSet,
    context: RegExpContext,
): boolean {
    const lengthRange = getLengthRange(parent.alternatives)
    if (lengthRange && lengthRange.min === lengthRange.max) {
        return true
    }

    if (parent.type === "Pattern" || parent.type === "Assertion") {
        return false
    }

    return (
        getFirstCharAfter(parent, "rtl", context.flags).char.isDisjointWith(
            consumedChars,
        ) &&
        getFirstCharAfter(parent, "ltr", context.flags).char.isDisjointWith(
            consumedChars,
        )
    )
}

/**
 * Returns whether the given element contains only literal characters and
 * groups/other elements containing literal characters.
 */
function containsOnlyLiterals(
    element: Element | Pattern | Alternative,
): boolean {
    return !hasSomeDescendant(
        element,
        (d) => {
            return (
                d.type === "Backreference" ||
                d.type === "CharacterSet" ||
                (d.type === "Quantifier" && d.max === Infinity) ||
                (d.type === "CharacterClass" && d.negate)
            )
        },
        (d) => d.type !== "Assertion",
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

/**
 * This tries to sort the given alternatives by assuming that all alternatives
 * are a number.
 */
function trySortNumberAlternatives(alternatives: Alternative[]): void {
    const numberRanges: [number, number][] = []
    {
        let start = 0
        for (let i = 0; i < alternatives.length; i++) {
            if (!/^0|[1-9]\d*$/.test(alternatives[i].raw)) {
                if (start < i) {
                    numberRanges.push([start, i])
                }
                start = i + 1
            }
        }
        if (start < alternatives.length) {
            numberRanges.push([start, alternatives.length])
        }
    }

    for (const [start, end] of numberRanges) {
        const slice = alternatives.slice(start, end)

        slice.sort((a, b) => {
            return Number(a.raw) - Number(b.raw)
        })

        alternatives.splice(start, end - start, ...slice)
    }
}

/**
 * Returns the combined source location of the two given locations.
 */
function unionLocations(a: SourceLocation, b: SourceLocation): SourceLocation {
    /** x < y */
    function less(x: Position, y: Position): boolean {
        if (x.line < y.line) {
            return true
        } else if (x.line > y.line) {
            return false
        }
        return x.column < y.column
    }

    return {
        start: { ...(less(a.start, b.start) ? a.start : b.start) },
        end: { ...(less(a.end, b.end) ? b.end : a.end) },
    }
}

/**
 * Returns the indexes of the first and last of original array that is changed
 * when compared with the reordered one.
 */
function getReorderingBounds<T>(
    original: readonly T[],
    reorder: readonly T[],
): [number, number] | undefined {
    if (original.length !== reorder.length) {
        return undefined
    }

    const len = original.length

    let first = 0
    for (; first < len && original[first] === reorder[first]; first++);

    if (first === len) {
        return undefined
    }

    let last = len - 1
    for (; last >= 0 && original[last] === reorder[last]; last--);

    return [first, last]
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
            const {
                node,
                getRegexpLocation,
                fixReplaceNode,
                flags,
            } = regexpContext

            const allowedChars = getAllowedChars(flags)

            /**
             * Creates a report if the sorted alternatives are different from
             * the unsorted ones.
             */
            function enforceSorted(sorted: Alternative[]): void {
                const parent = sorted[0].parent
                const unsorted = parent.alternatives

                const bounds = getReorderingBounds(unsorted, sorted)
                if (!bounds) {
                    return
                }

                const loc = unionLocations(
                    getRegexpLocation(unsorted[bounds[0]]),
                    getRegexpLocation(unsorted[bounds[1]]),
                )

                context.report({
                    node,
                    loc,
                    messageId: "sort",
                    fix: fixReplaceNode(parent, () => {
                        const prefix = parent.raw.slice(
                            0,
                            parent.alternatives[0].start - parent.start,
                        )
                        const suffix = parent.raw.slice(
                            parent.alternatives[parent.alternatives.length - 1]
                                .end - parent.start,
                        )

                        return (
                            prefix + sorted.map((a) => a.raw).join("|") + suffix
                        )
                    }),
                })
            }

            /** The handler for parents */
            function onParent(parent: Parent): void {
                if (parent.alternatives.length < 2) {
                    return
                }

                if (!containsOnlyLiterals(parent)) {
                    return
                }

                if (
                    hasSomeDescendant(
                        parent,
                        (d) => d !== parent && d.type === "CapturingGroup",
                    )
                ) {
                    // it's not safe to reorder alternatives with capturing groups
                    return
                }

                const consumedChars = getConsumedChars(parent, regexpContext)
                if (consumedChars.isEmpty) {
                    // all alternatives are either empty or only contain
                    // assertions
                    return
                }
                if (!consumedChars.isSubsetOf(allowedChars.allowed)) {
                    // contains some chars that are not allowed
                    return
                }
                if (consumedChars.isDisjointWith(allowedChars.required)) {
                    // doesn't contain required chars
                    return
                }

                const alternatives = [...parent.alternatives]

                if (canReorder(parent, consumedChars, regexpContext)) {
                    // alternatives can be reordered freely
                    sortAlternatives(alternatives, regexpContext)
                    trySortNumberAlternatives(alternatives)
                } else if (
                    !consumedChars.isDisjointWith(Chars.digit(flags)) &&
                    canReorder(
                        parent,
                        consumedChars.intersect(Chars.digit(flags)),
                        regexpContext,
                    )
                ) {
                    // let's try to at least sort numbers
                    trySortNumberAlternatives(alternatives)
                }

                enforceSorted(alternatives)
            }

            return {
                onGroupEnter: onParent,
                onPatternEnter: onParent,
                onCapturingGroupEnter: onParent,
            }
        }

        return defineRegexpVisitor(context, {
            createVisitor,
        })
    },
})
