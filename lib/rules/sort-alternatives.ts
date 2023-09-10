import type { RegExpVisitor } from "@eslint-community/regexpp/visitor"
import type {
    Alternative,
    Character,
    CharacterClass,
    CharacterSet,
    ClassStringDisjunction,
    Element,
    ExpressionCharacterClass,
    Pattern,
    StringAlternative,
} from "@eslint-community/regexpp/ast"
import type { RegExpContext } from "../utils"
import {
    CP_MINUS,
    CP_PLUS,
    CP_STAR,
    CP_QUESTION,
    CP_SLASH,
    CP_SPACE,
    CP_APOSTROPHE,
    createRule,
    defineRegexpVisitor,
    assertValidFlags,
} from "../utils"
import type {
    GetLongestPrefixOptions,
    ReadonlyFlags,
} from "regexp-ast-analysis"
import {
    Chars,
    hasSomeDescendant,
    canReorder,
    getLongestPrefix,
    getConsumedChars,
    toUnicodeSet,
    hasStrings,
} from "regexp-ast-analysis"
import type { CharSet, Word, ReadonlyWord } from "refa"
import { NFA, JS, transform } from "refa"
import { getParser } from "../utils/regexp-ast"

interface AllowedChars {
    allowed: CharSet
    required: CharSet
}
const cache = new Map<string, Readonly<AllowedChars>>()

/** */
function getAllowedChars(flags: ReadonlyFlags) {
    assertValidFlags(flags)
    const cacheKey = (flags.ignoreCase ? "i" : "") + (flags.unicode ? "u" : "")
    let result = cache.get(cacheKey)
    if (result === undefined) {
        result = {
            allowed: JS.createCharSet(
                [
                    { kind: "word", negate: false },
                    { min: CP_SPACE, max: CP_SPACE },

                    // common punctuation and operators
                    { min: CP_PLUS, max: CP_PLUS },
                    { min: CP_MINUS, max: CP_MINUS },
                    { min: CP_STAR, max: CP_STAR },
                    { min: CP_SLASH, max: CP_SLASH },

                    { min: CP_APOSTROPHE, max: CP_APOSTROPHE },
                    { min: CP_QUESTION, max: CP_QUESTION },
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
                (d.type === "CharacterClass" && d.negate) ||
                (d.type === "ExpressionCharacterClass" && d.negate)
            )
        },
        (d) => d.type !== "Assertion",
    )
}

const lssCache = new WeakMap<Alternative, ReadonlyWord>()

/**
 * A cached version of {@link approximateLexicographicallySmallest}.
 */
function cachedApproximateLexicographicallySmallest(
    alternative: Alternative,
    parser: JS.Parser,
    flags: ReadonlyFlags,
): ReadonlyWord {
    let cached = lssCache.get(alternative)
    if (cached === undefined) {
        cached = approximateLexicographicallySmallest(
            alternative,
            parser,
            flags,
        )
        lssCache.set(alternative, cached)
    }
    return cached
}

const LONGEST_PREFIX_OPTIONS: GetLongestPrefixOptions = {
    includeAfter: true,
    onlyInside: true,
    looseGroups: true,
}

/**
 * Return an approximation of the lexicographically smallest string (LSS)
 * accepted by the given alternative.
 *
 * If the LSS is defined for the given alternative and shorter than 1000
 * characters, then the LSS will be returned. Otherwise, a prefix-based
 * approximation will be returned.
 *
 * Assertions will be ignored when computing the LSS.
 *
 * Backreferences will be disabled when computing the LSS, but the prefix-based
 * approximation will account for them.
 */
function approximateLexicographicallySmallest(
    alternative: Alternative,
    parser: JS.Parser,
    flags: ReadonlyFlags,
): Word {
    const lss = getLexicographicallySmallestFromAlternative(
        alternative,
        parser,
        flags,
    )
    if (lss !== undefined) return lss

    // prefix-based approximation
    const prefix = getLongestPrefix(
        alternative,
        "ltr",
        flags,
        LONGEST_PREFIX_OPTIONS,
    )
    return getLexicographicallySmallestFromCharSets(prefix)
}

function getLexicographicallySmallestFromAlternative(
    alternative: Alternative,
    parser: JS.Parser,
    flags: ReadonlyFlags,
): Word | undefined
function getLexicographicallySmallestFromAlternative(
    alternative: StringAlternative,
    parser: JS.Parser,
    flags: ReadonlyFlags,
): Word
/**
 * If defined, this will return the lexicographically smallest string accepted
 * by the given alternative (ignoring assertions).
 */
function getLexicographicallySmallestFromAlternative(
    alternative: Alternative | StringAlternative,
    parser: JS.Parser,
    flags: ReadonlyFlags,
): Word | undefined {
    if (
        alternative.type === "StringAlternative" ||
        hasOnlyCharacters(alternative, flags)
    ) {
        // fast path to avoid converting simple alternatives into NFAs
        const smallest: Word = []
        for (const e of alternative.elements) {
            const cs = toUnicodeSet(e, flags).chars
            if (cs.isEmpty) return undefined
            smallest.push(cs.ranges[0].min)
        }
        return smallest
    }

    if (isOnlyCharacterElements(alternative.elements)) {
        const reversedElements = [...alternative.elements].reverse()
        const smallest: Word = []
        for (const e of reversedElements) {
            const us = toUnicodeSet(e, flags)
            if (us.isEmpty) return undefined
            if (us.accept.isEmpty) {
                smallest.unshift(us.chars.ranges[0].min)
            } else {
                const words: ReadonlyWord[] = [
                    ...(us.chars.isEmpty ? [] : [[us.chars.ranges[0].min]]),
                    ...us.accept.words,
                ]
                smallest.unshift(
                    ...words
                        // Sort by connecting the following string.
                        // This compares `'a'+'bb'` and `'aba'+'bb'`
                        // if the current word set is 'a' and 'aba', and the following string is 'bb'.
                        // We expect `'aba'+'bb'` to become an LSA as a result.
                        .map((word) => ({
                            word,
                            concatenated: [...word, ...smallest],
                        }))
                        .sort((a, b) =>
                            compareWords(a.concatenated, b.concatenated),
                        )
                        .shift()!.word,
                )
            }
        }
        return smallest
    }

    try {
        const result = parser.parseElement(alternative, {
            assertions: "unknown",
            backreferences: "disable",
            maxBackreferenceWords: 4,
            maxNodes: 1000,
        })

        // remove all unknowns (assertions)
        const expression = transform(
            {
                onConcatenation(concat) {
                    concat.elements = concat.elements.filter(
                        (e) => e.type !== "Unknown",
                    )
                },
            },
            result.expression,
        )

        const nfa = NFA.fromRegex(
            expression,
            { maxCharacter: result.maxCharacter },
            {},
            new NFA.LimitedNodeFactory(1000),
        )

        return getLexicographicallySmallestFromNfa(nfa.initial, nfa.finals)
    } catch (_error) {
        return undefined
    }
}

/**
 * Returns whether the given array of nodes contains only characters.
 * But note that if the pattern has the v flag, the character class may contain strings.
 */
function isOnlyCharacterElements(
    nodes: Element[],
): nodes is (
    | Character
    | CharacterClass
    | CharacterSet
    | ExpressionCharacterClass
)[] {
    return nodes.every(
        (e) =>
            e.type === "Character" ||
            e.type === "CharacterClass" ||
            e.type === "CharacterSet" ||
            e.type === "ExpressionCharacterClass",
    )
}

/**
 * Returns whether the given alternative has contains only characters.
 * The v flag in the pattern does not contains the string.
 */
function hasOnlyCharacters(
    alternative: Alternative,
    flags: ReadonlyFlags,
): alternative is Alternative & {
    elements: readonly (
        | Character
        | CharacterClass
        | CharacterSet
        | ExpressionCharacterClass
    )[]
} {
    return (
        isOnlyCharacterElements(alternative.elements) &&
        alternative.elements.every((e) => !hasStrings(e, flags))
    )
}

/**
 * If defined, this will return the lexicographically smallest string accepted
 * by the given NFA.
 */
function getLexicographicallySmallestFromNfa(
    initial: NFA.ReadonlyNode,
    finals: ReadonlySet<NFA.ReadonlyNode>,
): Word | undefined {
    // this is a variation on Thompson's algorithm
    const smallest: Word = []
    let currentStates = [initial]
    const newStatesSet = new Set<NFA.ReadonlyNode>()

    const MAX_LENGTH = 1000
    for (let i = 0; i < MAX_LENGTH; i++) {
        if (currentStates.some((n) => finals.has(n))) {
            // one of the current states is a final state
            return smallest
        }

        // find the smallest character
        let min = Infinity
        for (const state of currentStates) {
            // eslint-disable-next-line no-loop-func -- false positive
            state.out.forEach((charSet) => {
                if (!charSet.isEmpty) {
                    min = Math.min(min, charSet.ranges[0].min)
                }
            })
        }

        if (min === Infinity) {
            // the NFA doesn't accept any words
            return undefined
        }
        smallest.push(min)

        const newStates: NFA.ReadonlyNode[] = []
        newStatesSet.clear()

        for (const state of currentStates) {
            // eslint-disable-next-line no-loop-func -- false positive
            state.out.forEach((charSet, to) => {
                if (charSet.has(min) && !newStatesSet.has(to)) {
                    newStates.push(to)
                    newStatesSet.add(to)
                }
            })
        }

        currentStates = newStates
    }

    // the lexicographically smallest string either has more than
    // MAX_LENGTH characters or doesn't exist.
    return undefined
}

/**
 * If defined, this will return the lexicographically smallest string accepted
 * by the given sequence of character sets.
 *
 * If any of the given character sets is empty, the current smallest will be
 * returned.
 */
function getLexicographicallySmallestFromCharSets(
    word: Iterable<CharSet>,
): Word {
    const result: Word = []
    for (const set of word) {
        if (set.isEmpty) break
        result.push(set.ranges[0].min)
    }
    return result
}

/**
 * Compare two string independent of the current locale by byte order.
 */
function compareByteOrder(a: string, b: string): number {
    if (a === b) {
        return 0
    }
    return a < b ? -1 : +1
}

/**
 * Compare two char sets by byte order.
 */
function compareCharSets(a: CharSet, b: CharSet): number {
    // The basic idea here is the following:
    // We want to sort the two sets based on their characters. To do that, we
    // will consider the sort lists of characters (see `CharSet#characters()`)
    // of the two sets respectively. We will then lexicographically compare
    // these lists of characters.
    // Obviously, we don't actually look at the full list of characters.
    // CharSets are represented as ranges, and we will take advantage of that.
    // In lexicographical sorting, we just have to find the first character
    // that differs in the two sequences, and that's quite simple to do in the
    // range representation. Further, if one sequence ends before that
    // character was found, we compare the length of the two sequences. That is
    // trivial to do in the range form as well.

    const aRanges = a.ranges
    const bRanges = b.ranges
    for (let i = 0; i < aRanges.length && i < bRanges.length; i++) {
        const aR = aRanges[i]
        const bR = bRanges[i]

        if (aR.min !== bR.min) return aR.min - bR.min
        if (aR.max !== bR.max) {
            if (aR.max < bR.max) {
                // [aR.min .. aR.max]           [...?]
                // [bR.min .. aR.max .. bR.max]

                // If there is another range for a, then a is larger than b
                return i + 1 < aRanges.length ? +1 : -1

                // eslint-disable-next-line no-else-return -- x
            } else {
                // [aR.min .. bR.max .. aR.max]
                // [bR.min .. bR.max]           [...?]

                // If there is another range for b, then a is smaller than b
                return i + 1 < bRanges.length ? -1 : +1
            }
        }
    }

    return aRanges.length - bRanges.length
}

/**
 * Compare two strings of char sets by byte order.
 */
function compareCharSetStrings(
    a: readonly CharSet[],
    b: readonly CharSet[],
): number {
    const l = Math.min(a.length, b.length)
    for (let i = 0; i < l; i++) {
        const diff = compareCharSets(a[i], b[i])
        if (diff !== 0) {
            return diff
        }
    }

    return a.length - b.length
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

/**
 * Sorts the given alternatives.
 *
 * The comparison function implemented by this function has 3 parts:
 *
 * 1) Comparison based on the lexicographically smallest strings (LSS) accepted
 *    by the alternatives.
 * 2) Comparison based on the longest prefix of the alternatives.
 * 3) Comparison based on the raw source code of the alternatives.
 *
 * For more information on why we use LSS-based comparison and how it works,
 * see https://github.com/ota-meshi/eslint-plugin-regexp/pull/423.
 */
function sortAlternatives(
    alternatives: Alternative[],
    parser: JS.Parser,
    flags: ReadonlyFlags,
): void {
    alternatives.sort((a, b) => {
        const lssDiff = compareWords(
            cachedApproximateLexicographicallySmallest(a, parser, flags),
            cachedApproximateLexicographicallySmallest(b, parser, flags),
        )
        if (lssDiff !== 0) {
            return lssDiff
        }

        const prefixDiff = compareCharSetStrings(
            getLongestPrefix(a, "ltr", flags, LONGEST_PREFIX_OPTIONS),
            getLongestPrefix(b, "ltr", flags, LONGEST_PREFIX_OPTIONS),
        )
        if (prefixDiff !== 0) {
            return prefixDiff
        }

        if (flags.ignoreCase) {
            return (
                compareByteOrder(a.raw.toUpperCase(), b.raw.toUpperCase()) ||
                compareByteOrder(a.raw, b.raw)
            )
        }

        return compareByteOrder(a.raw, b.raw)
    })
}

/**
 * Sorts the given string alternatives.
 *
 * Sorting is done by comparing the lexicographically smallest strings (LSS).
 *
 * For more information on why we use LSS-based comparison and how it works,
 * see https://github.com/ota-meshi/eslint-plugin-regexp/pull/423.
 */
function sortStringAlternatives(
    alternatives: StringAlternative[],
    parser: JS.Parser,
    flags: ReadonlyFlags,
): void {
    alternatives.sort((a, b) => {
        const lssDiff = compareWords(
            getLexicographicallySmallestFromAlternative(a, parser, flags),
            getLexicographicallySmallestFromAlternative(b, parser, flags),
        )
        return lssDiff
    })
}

/**
 * Returns whether the given string is a valid integer.
 * @param str
 * @returns
 */
function isIntegerString(str: string): boolean {
    return /^(?:0|[1-9]\d*)$/u.test(str)
}

/**
 * This tries to sort the given alternatives by assuming that all alternatives
 * are a number.
 */
function trySortNumberAlternatives(
    alternatives: (Alternative | StringAlternative)[],
): void {
    const runs = getRuns(alternatives, (a) => isIntegerString(a.raw))
    for (const { startIndex, elements } of runs) {
        elements.sort((a, b) => {
            return Number(a.raw) - Number(b.raw)
        })
        alternatives.splice(startIndex, elements.length, ...elements)
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

interface Run<T> {
    startIndex: number
    elements: T[]
}

/**
 * Returns an array of runs of elements that fulfill the given condition.
 */
function getRuns<T>(iter: Iterable<T>, condFn: (item: T) => boolean): Run<T>[] {
    const runs: Run<T>[] = []

    let elements: T[] = []
    let index = 0

    for (const item of iter) {
        if (condFn(item)) {
            elements.push(item)
        } else {
            if (elements.length > 0) {
                runs.push({ startIndex: index - elements.length, elements })
                elements = []
            }
        }

        index++
    }

    if (elements.length > 0) {
        runs.push({ startIndex: index - elements.length, elements })
        elements = []
    }

    return runs
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
            sort: "The {{alternatives}} can be sorted without affecting the regex.",
        },
        type: "suggestion", // "problem",
    },
    create(context) {
        const sliceMinLength = 3

        /**
         * Create visitor
         */
        function createVisitor(
            regexpContext: RegExpContext,
        ): RegExpVisitor.Handlers {
            const { node, getRegexpLocation, fixReplaceNode, flags } =
                regexpContext

            const allowedChars = getAllowedChars(flags)

            const possibleCharsCache = new Map<Alternative, CharSet>()
            const parser = getParser(regexpContext)

            /** A cached version of getConsumedChars */
            function getPossibleChars(a: Alternative): CharSet {
                let chars = possibleCharsCache.get(a)
                if (chars === undefined) {
                    chars = getConsumedChars(a, flags).chars
                }
                return chars
            }

            /** Tries to sort the given alternatives. */
            function trySortRun(run: Run<Alternative>): void {
                const alternatives = run.elements

                if (canReorder(alternatives, flags)) {
                    // alternatives can be reordered freely
                    sortAlternatives(alternatives, parser, flags)
                    trySortNumberAlternatives(alternatives)
                } else {
                    const consumedChars = Chars.empty(flags).union(
                        ...alternatives.map(getPossibleChars),
                    )
                    if (!consumedChars.isDisjointWith(Chars.digit(flags))) {
                        // let's try to at least sort numbers
                        const runs = getRuns(alternatives, (a) =>
                            isIntegerString(a.raw),
                        )

                        for (const { startIndex: index, elements } of runs) {
                            if (
                                elements.length > 1 &&
                                canReorder(elements, flags)
                            ) {
                                trySortNumberAlternatives(elements)
                                alternatives.splice(
                                    index,
                                    elements.length,
                                    ...elements,
                                )
                            }
                        }
                    }
                }

                enforceSorted(run, "alternatives of this group")
            }

            /**
             * Creates a report if the sorted alternatives are different from
             * the unsorted ones.
             */
            function enforceSorted(
                run: Run<Alternative | StringAlternative>,
                alternatives:
                    | "alternatives of this group"
                    | "string alternatives",
            ): void {
                const sorted = run.elements
                const parent = sorted[0].parent
                const unsorted = parent.alternatives.slice(
                    run.startIndex,
                    run.startIndex + sorted.length,
                )

                const bounds = getReorderingBounds(unsorted, sorted)
                if (!bounds) {
                    return
                }

                const loc = getRegexpLocation({
                    start: unsorted[bounds[0]].start,
                    end: unsorted[bounds[1]].end,
                })

                context.report({
                    node,
                    loc,
                    messageId: "sort",
                    data: { alternatives },
                    fix: fixReplaceNode(parent, () => {
                        const prefix = parent.raw.slice(
                            0,
                            unsorted[0].start - parent.start,
                        )
                        const suffix = parent.raw.slice(
                            unsorted[unsorted.length - 1].end - parent.start,
                        )

                        return (
                            prefix + sorted.map((a) => a.raw).join("|") + suffix
                        )
                    }),
                })
            }

            /** The handler for parents */
            function onParent(parent: Alternative["parent"]): void {
                if (parent.alternatives.length < 2) {
                    return
                }

                const runs = getRuns(parent.alternatives, (a) => {
                    if (!containsOnlyLiterals(a)) {
                        return false
                    }

                    const consumedChars = getPossibleChars(a)
                    if (consumedChars.isEmpty) {
                        // the alternative is either empty or only contains
                        // assertions
                        return false
                    }
                    if (!consumedChars.isSubsetOf(allowedChars.allowed)) {
                        // contains some chars that are not allowed
                        return false
                    }
                    if (consumedChars.isDisjointWith(allowedChars.required)) {
                        // doesn't contain required chars
                        return false
                    }

                    return true
                })

                if (
                    runs.length === 1 &&
                    runs[0].elements.length === parent.alternatives.length
                ) {
                    // All alternatives are to be sorted
                    trySortRun(runs[0])
                } else {
                    // Some slices are to be sorted
                    for (const run of runs) {
                        if (
                            run.elements.length >= sliceMinLength &&
                            run.elements.length >= 2
                        ) {
                            trySortRun(run)
                        }
                    }
                }
            }

            /** The handler for ClassStringDisjunction */
            function onClassStringDisjunction(
                parent: ClassStringDisjunction,
            ): void {
                if (parent.alternatives.length < 2) {
                    return
                }

                const alternatives = [...parent.alternatives]
                sortStringAlternatives(alternatives, parser, flags)
                trySortNumberAlternatives(alternatives)
                const run: Run<StringAlternative> = {
                    startIndex: 0,
                    elements: [...alternatives],
                }
                enforceSorted(run, "string alternatives")
            }

            return {
                onGroupEnter: onParent,
                onPatternEnter: onParent,
                onCapturingGroupEnter: onParent,
                onClassStringDisjunctionEnter: onClassStringDisjunction,
            }
        }

        return defineRegexpVisitor(context, {
            createVisitor,
        })
    },
})
