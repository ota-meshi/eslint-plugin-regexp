import type { CharSet } from "refa"
import type {
    FirstConsumedChar,
    MatchingDirection,
    ReadonlyFlags,
} from "regexp-ast-analysis"
import {
    getFirstCharAfter,
    // eslint-disable-next-line no-restricted-imports -- x
    toCharSet,
    getFirstConsumedChar,
    getFirstConsumedCharAfter,
    FirstConsumedChars,
    isZeroLength,
    isPotentiallyZeroLength,
    isStrictBackreference,
} from "regexp-ast-analysis"
import type {
    Alternative,
    CapturingGroup,
    Element,
    Group,
    Quantifier,
} from "regexpp/ast"

const ltrCache = new WeakMap<Alternative, readonly CharSet[]>()
const rtlCache = new WeakMap<Alternative, readonly CharSet[]>()

/**
 * Returns the longest knowable prefix of characters accepted by the given
 * alternative and after it.
 *
 * The returned set of characters may contain the first character after the
 * given alternative.
 *
 * All returned character set are guaranteed to be non-empty.
 */
export function getLongestPrefix(
    alternative: Alternative,
    direction: MatchingDirection,
    flags: ReadonlyFlags,
): readonly CharSet[] {
    const cache = direction === "ltr" ? ltrCache : rtlCache
    let cached = cache.get(alternative)
    if (cached === undefined) {
        cached = getLongestPrefixUncached(alternative, direction, flags)
        cache.set(alternative, cached)
    }
    return cached
}

/** Uncached version of {@link getLongestPrefix} */
function getLongestPrefixUncached(
    alternative: Alternative,
    direction: MatchingDirection,
    flags: ReadonlyFlags,
): readonly CharSet[] {
    const prefix = getAlternativePrefix(alternative, direction, flags)
    let { chars } = prefix

    if (prefix.complete) {
        chars.push(getFirstCharAfter(alternative, direction, flags).char)
    }

    // remove everything after an empty char set
    for (let i = 0; i < chars.length; i++) {
        if (chars[i].isEmpty) {
            chars = chars.slice(0, i)
            break
        }
    }

    return chars
}

interface Prefix {
    chars: CharSet[]
    complete: boolean
}

/** Returns the prefix of the given alternative */
function getAlternativePrefix(
    alternative: Alternative,
    direction: MatchingDirection,
    flags: ReadonlyFlags,
): Prefix {
    const { elements } = alternative

    const chars: CharSet[] = []

    const first = direction === "ltr" ? 0 : elements.length - 1
    const inc = direction === "ltr" ? +1 : -1
    for (let i = first; i >= 0 && i < elements.length; i += inc) {
        const inner = getElementPrefix(elements[i], direction, flags)
        chars.push(...inner.chars)

        if (!inner.complete) {
            return { chars, complete: false }
        }
    }

    return { chars, complete: true }
}

/** Returns the prefix of the given element */
function getElementPrefix(
    element: Element,
    direction: MatchingDirection,
    flags: ReadonlyFlags,
): Prefix {
    switch (element.type) {
        case "Assertion":
            return { chars: [], complete: true }

        case "Character":
        case "CharacterClass":
        case "CharacterSet":
            return {
                chars: [toCharSet(element, flags)],
                complete: true,
            }

        case "CapturingGroup":
        case "Group":
            return getGroupPrefix(element, direction, flags)

        case "Quantifier":
            return getQuantifierPrefix(element, direction, flags)

        case "Backreference": {
            if (isStrictBackreference(element)) {
                const inner = getElementPrefix(
                    element.resolved,
                    direction,
                    flags,
                )
                if (inner.complete) {
                    return inner
                }
            }

            const look = FirstConsumedChars.toLook(
                getFirstConsumedCharPlusAfter(element, direction, flags),
            )
            return { chars: [look.char], complete: false }
        }

        default:
            throw new Error("unreachable")
    }
}

/** Returns the prefix of the given group */
function getGroupPrefix(
    element: Group | CapturingGroup,
    direction: MatchingDirection,
    flags: ReadonlyFlags,
): Prefix {
    if (element.alternatives.length === 1) {
        return getAlternativePrefix(element.alternatives[0], direction, flags)
    }

    const alternatives = element.alternatives.map((a) =>
        getAlternativePrefix(a, direction, flags),
    )

    const chars: CharSet[] = []
    let complete = true
    for (let i = 0; complete; i++) {
        const cs: CharSet[] = []
        let end = false
        for (const a of alternatives) {
            if (i >= a.chars.length) {
                end = true
            } else {
                cs.push(a.chars[i])
                if (i === a.chars.length - 1 && !a.complete) {
                    complete = false
                }
            }
        }

        if (cs.length === 0) {
            // This means that all alternatives are complete and have the same
            // length, so we can stop here.
            break
        }

        if (end) {
            // This means that one (but not all) complete alternatives have
            // reached the end, so we have consider the chars after the group.
            complete = false
            cs.push(getFirstCharAfter(element, direction, flags).char)
        }

        const total = cs[0].union(...cs.slice(1))
        chars.push(total)
    }

    return { chars, complete }
}

/** Returns the prefix of the given quantifier */
function getQuantifierPrefix(
    element: Quantifier,
    direction: MatchingDirection,
    flags: ReadonlyFlags,
): Prefix {
    if (isZeroLength(element)) {
        return { chars: [], complete: true }
    }
    if (isPotentiallyZeroLength(element)) {
        const look = FirstConsumedChars.toLook(
            getFirstConsumedCharPlusAfter(element, direction, flags),
        )
        return { chars: [look.char], complete: false }
    }

    const inner = getElementPrefix(element.element, direction, flags)
    if (!inner.complete) {
        return inner
    }

    const chars: CharSet[] = []
    for (let i = 0; i < element.min; i++) {
        chars.push(...inner.chars)
        if (chars.length > 100) {
            // this is a safe-guard to protect against regexes like a{100000}
            return { chars, complete: false }
        }
    }

    if (element.min === element.max) {
        return { chars, complete: true }
    }

    const look = FirstConsumedChars.toLook(
        getFirstConsumedCharAfter(element.element, direction, flags),
    )
    chars.push(look.char)
    return { chars, complete: false }
}

/**
 * This operations is equal to:
 *
 * ```
 * concat(
 *     getFirstConsumedChar(element, direction, flags),
 *     getFirstConsumedCharAfter(element, direction, flags),
 * )
 * ```
 */
function getFirstConsumedCharPlusAfter(
    element: Element | Alternative,
    direction: MatchingDirection,
    flags: ReadonlyFlags,
): FirstConsumedChar {
    const consumed = getFirstConsumedChar(element, direction, flags)

    if (!consumed.empty) {
        return consumed
    }

    return FirstConsumedChars.concat(
        [consumed, getFirstConsumedCharAfter(element, direction, flags)],
        flags,
    )
}
