import type { CharSet } from "refa"
import { Chars, toCharSet } from "regexp-ast-analysis"
import type {
    CharacterClass,
    CharacterClassElement,
} from "@eslint-community/regexpp/ast"
import type { RegExpVisitor } from "@eslint-community/regexpp/visitor"
import type { RegExpContext } from "../utils"
import { createRule, defineRegexpVisitor } from "../utils"
import {
    getIgnoreCaseFlags,
    isCaseVariant,
} from "../utils/regexp-ast/case-variation"
import { mention } from "../utils/mention"
import type {
    PatternSource,
    PatternRange,
} from "../utils/ast-utils/pattern-source"
import type { Rule } from "eslint"
import { UsageOfPattern } from "../utils/get-usage-of-pattern"

// FIXME: TS Error
// @ts-expect-error -- FIXME
const ELEMENT_ORDER: Record<CharacterClassElement["type"], number> = {
    Character: 1,
    CharacterClassRange: 2,
    CharacterSet: 3,
}

/**
 * Finds all character class elements that do not contribute to the whole.
 */
function findUseless(
    elements: readonly CharacterClassElement[],
    getCharSet: (e: CharacterClassElement) => CharSet,
    other: CharSet,
): Set<CharacterClassElement> {
    const cache = new Map<CharacterClassElement, CharSet>()

    /** A cached version of `getCharSet` */
    function get(e: CharacterClassElement): CharSet {
        let cached = cache.get(e)
        if (cached === undefined) {
            cached = getCharSet(e)
            cache.set(e, cached)
        }
        return cached
    }

    // When searching for useless elements, we want to first
    // search for useless characters, then useless ranges, and
    // finally useless sets.

    const sortedElements = [...elements]
        .reverse()
        .sort((a, b) => ELEMENT_ORDER[a.type] - ELEMENT_ORDER[b.type])

    const useless = new Set<CharacterClassElement>()

    for (const e of sortedElements) {
        const cs = get(e)
        if (cs.isSubsetOf(other)) {
            useless.add(e)
            continue
        }

        // the total of all other elements
        const otherElements = elements.filter((o) => o !== e && !useless.has(o))
        const total = other.union(...otherElements.map(get))
        if (cs.isSubsetOf(total)) {
            useless.add(e)
            continue
        }
    }

    return useless
}

/** Returns all elements not in the given set */
function without<T>(iter: Iterable<T>, set: ReadonlySet<T>): T[] {
    const result: T[] = []
    for (const item of iter) {
        if (!set.has(item)) {
            result.push(item)
        }
    }
    return result
}

/**
 * Removes all the given ranges from the given pattern.
 *
 * This assumes that all ranges are disjoint
 */
function removeAll(
    fixer: Rule.RuleFixer,
    patternSource: PatternSource,
    ranges: readonly PatternRange[],
) {
    const sorted = [...ranges].sort((a, b) => b.start - a.start)
    let pattern = patternSource.value

    for (const { start, end } of sorted) {
        pattern = pattern.slice(0, start) + pattern.slice(end)
    }

    const range = patternSource.getReplaceRange({
        start: 0,
        end: patternSource.value.length,
    })
    if (range) {
        return range.replace(fixer, pattern)
    }
    return null
}

export default createRule("use-ignore-case", {
    meta: {
        docs: {
            description: "use the `i` flag if it simplifies the pattern",
            category: "Best Practices",
            recommended: true,
        },
        fixable: "code",
        schema: [],
        messages: {
            unexpected:
                "The character class(es) {{ classes }} can be simplified using the `i` flag.",
        },
        type: "suggestion",
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
                flags,
                ownsFlags,
                flagsString,
                patternAst,
                patternSource,
                getUsageOfPattern,
                getFlagsLocation,
                fixReplaceFlags,
            } = regexpContext

            if (!ownsFlags || flagsString === null) {
                // It's not (statically) fixable
                return {}
            }
            if (flags.ignoreCase) {
                // We can't suggest the i flag if it's already used
                return {}
            }
            if (getUsageOfPattern() === UsageOfPattern.partial) {
                // Adding flags to partial patterns isn't a good idea
                return {}
            }
            if (isCaseVariant(patternAst, flags)) {
                // We can't add the i flag
                return {}
            }

            const uselessElements: CharacterClassElement[] = []
            const ccs: CharacterClass[] = []

            return {
                onCharacterClassEnter(ccNode) {
                    const invariantElement = ccNode.elements.filter(
                        (e) => !isCaseVariant(e, flags),
                    )
                    if (invariantElement.length === ccNode.elements.length) {
                        // all elements are case invariant
                        return
                    }

                    const invariant = Chars.empty(flags).union(
                        // FIXME: TS Error
                        // @ts-expect-error -- FIXME
                        ...invariantElement.map((e) => toCharSet(e, flags)),
                    )

                    let variantElements = without(
                        ccNode.elements,
                        new Set(invariantElement),
                    )

                    // find all elements that are useless even without
                    // the i flag
                    const alwaysUseless = findUseless(
                        variantElements,
                        // FIXME: TS Error
                        // @ts-expect-error -- FIXME
                        (e) => toCharSet(e, flags),
                        invariant,
                    )

                    // remove useless elements
                    variantElements = without(variantElements, alwaysUseless)

                    // find useless elements
                    const iFlags = getIgnoreCaseFlags(flags)
                    const useless = findUseless(
                        variantElements,
                        // FIXME: TS Error
                        // @ts-expect-error -- FIXME
                        (e) => toCharSet(e, iFlags),
                        invariant,
                    )

                    uselessElements.push(...useless)
                    ccs.push(ccNode)
                },

                onPatternLeave() {
                    if (uselessElements.length === 0) {
                        return
                    }

                    context.report({
                        node,
                        loc: getFlagsLocation(),
                        messageId: "unexpected",
                        data: {
                            classes: ccs.map((cc) => mention(cc)).join(", "),
                        },
                        fix(fixer) {
                            const patternFix = removeAll(
                                fixer,
                                patternSource,
                                uselessElements,
                            )
                            if (!patternFix) {
                                return null
                            }

                            const flagsFix = fixReplaceFlags(
                                `${flagsString}i`,
                                false,
                            )(fixer)
                            if (!flagsFix) {
                                return null
                            }

                            const fix = [patternFix]
                            if (Array.isArray(flagsFix)) {
                                fix.push(...flagsFix)
                            } else {
                                fix.push(flagsFix)
                            }

                            return fix
                        },
                    })
                },
            }
        }

        return defineRegexpVisitor(context, {
            createVisitor,
        })
    },
})
