import type {
    Alternative,
    CharacterClass,
    CharacterClassElement,
    CharacterSet,
    Element,
    ExpressionCharacterClass,
    Pattern,
    StringAlternative,
} from "@eslint-community/regexpp/ast"
import type { ReadonlyFlags } from "regexp-ast-analysis"
import {
    toCache,
    hasSomeDescendant,
    toCharSet,
    isEmptyBackreference,
    toUnicodeSet,
} from "regexp-ast-analysis"
import { assertNever, cachedFn } from "../util"

/**
 * Returns flags equivalent to the given flags but with the `i` flag set.
 */
export const getIgnoreCaseFlags = cachedFn(
    (flags: ReadonlyFlags): ReadonlyFlags => {
        return flags.ignoreCase
            ? flags
            : toCache({ ...flags, ignoreCase: true })
    },
)

/**
 * Returns flags equivalent to the given flags but without the `i` flag set.
 */
export const getCaseSensitiveFlags = cachedFn(
    (flags: ReadonlyFlags): ReadonlyFlags => {
        return flags.ignoreCase === false
            ? flags
            : toCache({ ...flags, ignoreCase: false })
    },
)

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
    element:
        | Element
        | CharacterClassElement
        | StringAlternative
        | Alternative
        | Pattern,
    flags: ReadonlyFlags,
    wholeCharacterClass = true,
): boolean {
    const unicodeLike = Boolean(flags.unicode || flags.unicodeSets)

    const iSet = getIgnoreCaseFlags(flags)
    const iUnset = getCaseSensitiveFlags(flags)

    /** Whether the given character class element is case variant */
    function ccElementIsCaseVariant(
        e:
            | CharacterClassElement
            | CharacterSet
            | CharacterClass
            | StringAlternative
            | ExpressionCharacterClass["expression"],
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
                        return unicodeLike
                    case "property":
                        // just check for equality
                        return !toUnicodeSet(e, iSet).equals(
                            toUnicodeSet(e, iUnset),
                        )
                    default:
                        // all other character sets are case-invariant
                        return false
                }

            case "CharacterClass":
                if (!wholeCharacterClass) {
                    return e.elements.some(ccElementIsCaseVariant)
                }
                // just check for equality
                return !toUnicodeSet(e, iSet).equals(toUnicodeSet(e, iUnset))

            case "ExpressionCharacterClass":
                return ccElementIsCaseVariant(e.expression)

            case "ClassIntersection":
            case "ClassSubtraction":
                return !toUnicodeSet(e, iSet).equals(toUnicodeSet(e, iUnset))

            case "ClassStringDisjunction":
                if (!wholeCharacterClass) {
                    return e.alternatives.some(ccElementIsCaseVariant)
                }
                // just check for equality
                return !toUnicodeSet(e, iSet).equals(toUnicodeSet(e, iUnset))

            case "StringAlternative":
                return e.elements.some(ccElementIsCaseVariant)

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
                    return unicodeLike && d.kind === "word"

                case "Backreference": {
                    // we need to check whether the associated capturing group
                    // is case variant

                    const outside = [d.resolved]
                        .flat()
                        .filter(
                            (resolved) => !hasSomeDescendant(element, resolved),
                        )
                    if (outside.length === 0) {
                        // the capturing group is part of the root element, so
                        // we don't need to make an extra check
                        return false
                    }

                    return (
                        !isEmptyBackreference(d, flags) &&
                        outside.some((resolved) =>
                            isCaseVariant(resolved, flags),
                        )
                    )
                }

                case "Character":
                case "CharacterClassRange":
                case "CharacterSet":
                case "CharacterClass":
                case "ExpressionCharacterClass":
                case "ClassIntersection":
                case "ClassSubtraction":
                case "ClassStringDisjunction":
                case "StringAlternative":
                    return ccElementIsCaseVariant(d)

                default:
                    return false
            }
        },
        (d) => {
            // don't go into character classes and ranges
            return (
                d.type !== "CharacterClass" &&
                d.type !== "CharacterClassRange" &&
                d.type !== "ExpressionCharacterClass" &&
                d.type !== "ClassStringDisjunction"
            )
        },
    )
}
