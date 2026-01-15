import type {
    CharacterClass,
    CharacterClassElement,
    Node,
    StringAlternative,
} from "@eslint-community/regexpp/ast"
import type { RegExpVisitor } from "@eslint-community/regexpp/visitor"
import type { Rule } from "eslint"
import { CharSet, JS } from "refa"
import { Chars, toUnicodeSet } from "regexp-ast-analysis"
import type {
    PatternSource,
    PatternRange,
} from "../utils/ast-utils/pattern-source.ts"
import { UsageOfPattern } from "../utils/get-usage-of-pattern.ts"
import type { RegExpContext } from "../utils/index.ts"
import { createRule, defineRegexpVisitor } from "../utils/index.ts"
import { mention } from "../utils/mention.ts"
import { getIgnoreCaseFlags, isCaseVariant } from "../utils/regexp-ast/index.ts"
import { cachedFn } from "../utils/util.ts"

type FlatClassElement = CharacterClassElement | StringAlternative

const ELEMENT_ORDER: Record<FlatClassElement["type"], number> = {
    Character: 1,
    CharacterClassRange: 2,
    CharacterSet: 3,
    CharacterClass: 4,
    ExpressionCharacterClass: 5,
    ClassStringDisjunction: 6,
    StringAlternative: 7,
}

/**
 * Finds all character class elements that do not contribute to the whole.
 */
function findUseless(
    elements: readonly FlatClassElement[],
    getChars: (e: FlatClassElement) => JS.UnicodeSet,
    other: JS.UnicodeSet,
): Set<FlatClassElement> {
    const get = cachedFn(getChars)

    // When searching for useless elements, we want to first
    // search for useless characters, then useless ranges, and
    // finally useless sets.

    const sortedElements = [...elements]
        .reverse()
        .sort((a, b) => ELEMENT_ORDER[a.type] - ELEMENT_ORDER[b.type])

    const useless = new Set<FlatClassElement>()

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
 * Removes all the given nodes from the given pattern.
 */
function removeAll(
    fixer: Rule.RuleFixer,
    patternSource: PatternSource,
    nodes: readonly Node[],
) {
    // we abuse CharSet to merge adjacent and overlapping ranges
    const charSet = CharSet.empty(Number.MAX_SAFE_INTEGER).union(
        nodes.map((n) => {
            let min = n.start
            let max = n.end - 1

            if (n.type === "StringAlternative") {
                const parent = n.parent
                if (
                    parent.alternatives.length === 1 ||
                    parent.alternatives.every((a) => nodes.includes(a))
                ) {
                    // we have to remove the whole disjunction
                    min = parent.start
                    max = parent.end - 1
                } else {
                    const isFirst = parent.alternatives.at(0) === n
                    if (isFirst) {
                        max++
                    } else {
                        min--
                    }
                }
            }

            return { min, max }
        }),
    )
    const sorted = charSet.ranges.map(
        ({ min, max }): PatternRange => ({ start: min, end: max + 1 }),
    )

    let pattern = patternSource.value
    let removed = 0
    for (const { start, end } of sorted) {
        pattern =
            pattern.slice(0, start - removed) + pattern.slice(end - removed)
        removed += end - start
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

/**
 * Adds the `i` flag to the given flags string.
 */
function getIgnoreCaseFlagsString(flags: string): string {
    if (flags.includes("i")) {
        return flags
    }

    // keep flags sorted
    for (let i = 0; i < flags.length; i++) {
        if (flags[i] > "i") {
            return `${flags.slice(0, i)}i${flags.slice(i)}`
        }
    }
    return `${flags}i`
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

            const uselessElements: FlatClassElement[] = []
            const ccs: CharacterClass[] = []

            return {
                onCharacterClassEnter(ccNode) {
                    const elements = ccNode.elements.flatMap(
                        (e: CharacterClassElement): FlatClassElement[] => {
                            if (e.type === "ClassStringDisjunction") {
                                return e.alternatives
                            }
                            return [e]
                        },
                    )
                    const invariantElement = elements.filter(
                        (e) => !isCaseVariant(e, flags),
                    )
                    if (invariantElement.length === elements.length) {
                        // all elements are case invariant
                        return
                    }

                    const empty = JS.UnicodeSet.empty(Chars.maxChar(flags))
                    const invariant = empty.union(
                        ...invariantElement.map((e) => toUnicodeSet(e, flags)),
                    )

                    let variantElements = without(
                        elements,
                        new Set(invariantElement),
                    )

                    // find all elements that are useless even without
                    // the i flag
                    const alwaysUseless = findUseless(
                        variantElements,
                        (e) => toUnicodeSet(e, flags),
                        invariant,
                    )

                    // remove useless elements
                    variantElements = without(variantElements, alwaysUseless)

                    // find useless elements
                    const iFlags = getIgnoreCaseFlags(flags)
                    const useless = findUseless(
                        variantElements,
                        (e) => toUnicodeSet(e, iFlags),
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
                                getIgnoreCaseFlagsString(flagsString),
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
