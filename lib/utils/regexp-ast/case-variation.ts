import type { ReadonlyFlags } from "regexp-ast-analysis"
import {
    toCache,
    hasSomeDescendant,
    toCharSet,
    isEmptyBackreference,
    toUnicodeSet,
} from "regexp-ast-analysis"
import type {
    Alternative,
    Character,
    CharacterClassElement,
    CharacterClassRange,
    CharacterSet,
    Element,
    Pattern,
} from "@eslint-community/regexpp/ast"
import { assertNever } from "../util"

const ignoreCaseFlagsCache = new WeakMap<ReadonlyFlags, ReadonlyFlags>()
const caseSensitiveFlagsCache = new WeakMap<ReadonlyFlags, ReadonlyFlags>()

/**
 * Returns flags equivalent to the given flags but with the `i` flag set.
 */
export function getIgnoreCaseFlags(flags: ReadonlyFlags): ReadonlyFlags {
    if (flags.ignoreCase) {
        return flags
    }

    let cached = ignoreCaseFlagsCache.get(flags)
    if (cached === undefined) {
        cached = toCache({ ...flags, ignoreCase: true })
        ignoreCaseFlagsCache.set(flags, cached)
    }
    return cached
}

/**
 * Returns flags equivalent to the given flags but without the `i` flag set.
 */
export function getCaseSensitiveFlags(flags: ReadonlyFlags): ReadonlyFlags {
    if (flags.ignoreCase === false) {
        return flags
    }

    let cached = caseSensitiveFlagsCache.get(flags)
    if (cached === undefined) {
        cached = toCache({ ...flags, ignoreCase: false })
        caseSensitiveFlagsCache.set(flags, cached)
    }
    return cached
}

/**
 * Returns whether the given element **will not** behave the same with or
 * without the `i` flag.
 *
 * @param wholeCharacterClass Whether character classes will be checked as a
 * whole or as a list of character class elements.
 *
 * If `false`, then the character class is case-variant if any of its elements
 * is case-variant.
 *
 * Examples:
 * - `wholeCharacterClass: true`: `isCaseVariant(/[a-zA-Z]/) -> false`
 * - `wholeCharacterClass: false`: `isCaseVariant(/[a-zA-Z]/) -> true`
 */
export function isCaseVariant(
    element: Element | CharacterClassElement | Alternative | Pattern,
    flags: ReadonlyFlags,
    wholeCharacterClass = true,
): boolean {
    const { unicode = false } = flags

    const iSet = getIgnoreCaseFlags(flags)
    const iUnset = getCaseSensitiveFlags(flags)

    /** Whether the given character class element is case variant */
    function ccElementIsCaseVariant(
        e: Character | CharacterClassRange | CharacterSet,
    ): boolean {
        switch (e.type) {
            case "Character":
                // case-variant characters will accept > 1 characters
                return toCharSet(e, iSet).size !== 1

            case "CharacterClassRange":
                return !toCharSet(e, iSet).equals(toCharSet(e, iUnset))

            case "CharacterSet":
                switch (e.kind) {
                    case "word":
                        // \w which is case-variant in Unicode mode
                        return unicode
                    case "property":
                        // just check for equality
                        return !toUnicodeSet(e, iSet).equals(
                            toUnicodeSet(e, iUnset),
                        )
                    default:
                        // all other character sets are case-invariant
                        return false
                }

            default:
                return assertNever(e)
        }
    }

    return hasSomeDescendant(
        element,
        (d) => {
            switch (d.type) {
                case "Assertion":
                    // \b and \B are defined in terms of \w which is
                    // case-variant in Unicode mode
                    return unicode && d.kind === "word"

                case "Backreference":
                    // we need to check whether the associated capturing group
                    // is case variant
                    if (hasSomeDescendant(element, d.resolved)) {
                        // the capturing group is part of the root element, so
                        // we don't need to make an extra check
                        return false
                    }

                    return (
                        !isEmptyBackreference(d, flags) &&
                        isCaseVariant(d.resolved, flags)
                    )

                case "Character":
                case "CharacterClassRange":
                case "CharacterSet":
                    return ccElementIsCaseVariant(d)

                case "CharacterClass":
                    if (!wholeCharacterClass) {
                        // FIXME: TS Error
                        // @ts-expect-error -- FIXME
                        return d.elements.some(ccElementIsCaseVariant)
                    }
                    // just check for equality
                    return !toUnicodeSet(d, iSet).equals(
                        toUnicodeSet(d, iUnset),
                    )

                default:
                    return false
            }
        },
        (d) => {
            // don't go into character classes and ranges
            return (
                d.type !== "CharacterClass" && d.type !== "CharacterClassRange"
            )
        },
    )
}
