/* eslint-disable eslint-comments/disable-enable-pair -- x */

import type { RegExpVisitor } from "@eslint-community/regexpp/visitor"
import type {
    Alternative,
    CapturingGroup,
    Element,
    Node,
    Quantifier,
} from "@eslint-community/regexpp/ast"
import type { RegExpContext } from "../utils"
import { createRule, defineRegexpVisitor, toCharSetSource } from "../utils"
import type { MatchingDirection, ReadonlyFlags } from "regexp-ast-analysis"
import {
    isPotentiallyZeroLength,
    invertMatchingDirection,
    getMatchingDirection,
    isEmpty,
    hasSomeDescendant,
    Chars,
    followPaths,
    toUnicodeSet,
} from "regexp-ast-analysis"
import { canSimplifyQuantifier } from "../utils/regexp-ast/simplify-quantifier"
import { fixSimplifyQuantifier } from "../utils/fix-simplify-quantifier"
import { joinEnglishList, mention } from "../utils/mention"
import { getParser } from "../utils/regexp-ast"
import { assertNever } from "../utils/util"
import { CharSet } from "refa"

/**
 * Returns an iterator that goes through all elements in the given array in
 * reverse order.
 */
function* iterReverse<T>(array: readonly T[]): Iterable<T> {
    for (let i = array.length - 1; i >= 0; i--) {
        yield array[i]
    }
}

/**
 * Returns all quantifiers that are always at the start of the given element.
 */
function* getStartQuantifiers(
    root: Element | Alternative | Alternative[],
    direction: MatchingDirection,
    flags: ReadonlyFlags,
): Iterable<Quantifier> {
    if (Array.isArray(root)) {
        for (const a of root) {
            yield* getStartQuantifiers(a, direction, flags)
        }
        return
    }

    switch (root.type) {
        case "Character":
        case "CharacterClass":
        case "CharacterSet":
        case "ExpressionCharacterClass":
        case "Backreference":
            // we can't go into terminals
            break
        case "Assertion":
            // for the purposes of checking the captured text of capturing
            // groups, we must not go into assertions
            break
        case "Alternative": {
            const elements =
                direction === "ltr" ? root.elements : iterReverse(root.elements)
            for (const e of elements) {
                if (isEmpty(e, flags)) continue
                yield* getStartQuantifiers(e, direction, flags)
                break
            }
            break
        }
        case "CapturingGroup":
            // there's no point in going into capturing groups for the purpose
            // of this rule
            break
        case "Group":
            yield* getStartQuantifiers(root.alternatives, direction, flags)
            break
        case "Quantifier":
            yield root
            if (root.max === 1) {
                yield* getStartQuantifiers(root.element, direction, flags)
            }
            break
        default:
            yield assertNever(root)
    }
}

/**
 * Returns whether the given node is or contains a capturing group.
 */
function hasCapturingGroup(node: Node): boolean {
    return hasSomeDescendant(node, (d) => d.type === "CapturingGroup")
}

type CharCache = WeakMap<Element | Alternative, CharSet>
const caches = new WeakMap<ReadonlyFlags, CharCache>()

function getCache(flags: ReadonlyFlags): CharCache {
    let cache = caches.get(flags)
    if (cache === undefined) {
        cache = new WeakMap()
        caches.set(flags, cache)
    }
    return cache
}

/**
 * Returns the largest character set such that `L(chars) ⊆ L(element)`.
 */
function getSingleRepeatedChar(
    element: Element | Alternative,
    flags: ReadonlyFlags,
    cache: CharCache = getCache(flags),
): CharSet {
    let value = cache.get(element)
    if (value === undefined) {
        value = uncachedGetSingleRepeatedChar(element, flags, cache)
        cache.set(element, value)
    }
    return value
}

/**
 * Returns the largest character set such that `L(chars) ⊆ L(element)`.
 */
function uncachedGetSingleRepeatedChar(
    element: Element | Alternative,
    flags: ReadonlyFlags,
    cache: CharCache,
): CharSet {
    switch (element.type) {
        case "Alternative": {
            let total: CharSet | undefined = undefined
            for (const e of element.elements) {
                const c = getSingleRepeatedChar(e, flags, cache)
                if (total === undefined) {
                    total = c
                } else {
                    total = total.intersect(c)
                }
                if (total.isEmpty) return total
            }
            return total ?? Chars.empty(flags)
        }

        case "Assertion":
            return Chars.empty(flags)

        case "Backreference":
            // backreferences are too complex to be worth it to handle here
            return Chars.empty(flags)

        case "Character":
        case "CharacterClass":
        case "CharacterSet":
        case "ExpressionCharacterClass": {
            const set = toUnicodeSet(element, flags)
            if (set.accept.isEmpty) {
                return set.chars
            }

            // this is pretty much the same as a list of alternatives, so we do the
            // same thing as for Groups and Alternatives.
            return set.wordSets
                .map((wordSet): CharSet => {
                    let total: CharSet | undefined = undefined
                    for (const c of wordSet) {
                        if (total === undefined) {
                            total = c
                        } else {
                            total = total.intersect(c)
                        }
                        if (total.isEmpty) return total
                    }
                    return total ?? Chars.empty(flags)
                })
                .reduce((a, b) => a.union(b))
        }

        case "CapturingGroup":
        case "Group":
            return element.alternatives
                .map((a) => getSingleRepeatedChar(a, flags, cache))
                .reduce((a, b) => a.union(b))

        case "Quantifier":
            if (element.max === 0) return Chars.empty(flags)
            return getSingleRepeatedChar(element.element, flags, cache)

        default:
            return assertNever(element)
    }
}

interface TradingQuantifier {
    quant: Quantifier
    quantRepeatedChar: CharSet
    intersection: CharSet
}

/**
 * Yields all non-constant (min != max) quantifiers that trade characters with
 * the given start quantifiers.
 */
function getTradingQuantifiersAfter(
    start: Quantifier,
    startChar: CharSet,
    direction: MatchingDirection,
    flags: ReadonlyFlags,
): Iterable<TradingQuantifier> {
    const results: TradingQuantifier[] = []

    followPaths<CharSet>(
        start,
        "next",
        startChar,
        {
            join(states) {
                return CharSet.empty(startChar.maximum).union(...states)
            },
            continueAfter(_, state) {
                return !state.isEmpty
            },
            continueInto(element, state) {
                return element.type !== "Assertion" && !state.isEmpty
            },
            leave(element, state) {
                switch (element.type) {
                    case "Assertion":
                    case "Backreference":
                    case "Character":
                    case "CharacterClass":
                    case "CharacterSet":
                    case "ExpressionCharacterClass":
                        return state.intersect(
                            getSingleRepeatedChar(element, flags),
                        )

                    case "CapturingGroup":
                    case "Group":
                    case "Quantifier":
                        return state

                    default:
                        return assertNever(element)
                }
            },
            enter(element, state) {
                if (
                    element.type === "Quantifier" &&
                    element.min !== element.max
                ) {
                    const qChar = getSingleRepeatedChar(element, flags)
                    const intersection = qChar.intersect(state)
                    if (!intersection.isEmpty) {
                        results.push({
                            quant: element,
                            quantRepeatedChar: qChar,
                            intersection,
                        })
                    }
                }

                return state
            },
        },
        direction,
    )

    return results
}

export default createRule("no-misleading-capturing-group", {
    meta: {
        docs: {
            description:
                "disallow capturing groups that do not behave as one would expect",
            category: "Possible Errors",
            recommended: true,
        },
        hasSuggestions: true,
        schema: [
            {
                type: "object",
                properties: {
                    reportBacktrackingEnds: { type: "boolean" },
                },
                additionalProperties: false,
            },
        ],
        messages: {
            removeQuant:
                "{{quant}} can be removed because it is already included by {{cause}}." +
                " This makes the capturing group misleading, because it actually captures less text than its pattern suggests.",
            replaceQuant:
                "{{quant}} can be replaced with {{fix}} because of {{cause}}." +
                " This makes the capturing group misleading, because it actually captures less text than its pattern suggests.",
            suggestionRemove: "Remove {{quant}}.",
            suggestionReplace: "Replace {{quant}} with {{fix}}.",

            nonAtomic:
                "The quantifier {{quant}} is not atomic for the characters {{chars}}, so it might capture fewer characters than expected. This makes the capturing group misleading, because the quantifier will capture fewer characters than its pattern suggests in some edge cases.",
            suggestionNonAtomic:
                "Make the quantifier atomic by adding {{fix}}. Careful! This is going to change the behavior of the regex in some edge cases.",

            trading:
                "The quantifier {{quant}} can exchange characters ({{chars}}) with {{other}}. This makes the capturing group misleading, because the quantifier will capture fewer characters than its pattern suggests.",
        },
        type: "problem",
    },
    create(context) {
        const reportBacktrackingEnds =
            context.options[0]?.reportBacktrackingEnds ?? true

        function createVisitor(
            regexpContext: RegExpContext,
        ): RegExpVisitor.Handlers {
            const { node, flags, getRegexpLocation } = regexpContext

            const parser = getParser(regexpContext)

            /**
             * Reports all quantifiers at the start of the given capturing
             * groups that can be simplified.
             */
            function reportStartQuantifiers(
                capturingGroup: CapturingGroup,
            ): void {
                const direction = getMatchingDirection(capturingGroup)
                const startQuantifiers = getStartQuantifiers(
                    capturingGroup.alternatives,
                    direction,
                    flags,
                )

                for (const quantifier of startQuantifiers) {
                    const result = canSimplifyQuantifier(
                        quantifier,
                        flags,
                        parser,
                    )
                    if (!result.canSimplify) return

                    const cause = joinEnglishList(
                        result.dependencies.map((d) => mention(d)),
                    )

                    const [replacement, fix] = fixSimplifyQuantifier(
                        quantifier,
                        result,
                        regexpContext,
                    )

                    if (quantifier.min === 0) {
                        const removesCapturingGroup =
                            hasCapturingGroup(quantifier)

                        context.report({
                            node,
                            loc: getRegexpLocation(quantifier),
                            messageId: "removeQuant",
                            data: {
                                quant: mention(quantifier),
                                cause,
                            },
                            suggest: removesCapturingGroup
                                ? undefined
                                : [
                                      {
                                          messageId: "suggestionRemove",
                                          data: {
                                              quant: mention(quantifier),
                                          },
                                          fix,
                                      },
                                  ],
                        })
                    } else {
                        context.report({
                            node,
                            loc: getRegexpLocation(quantifier),
                            messageId: "replaceQuant",
                            data: {
                                quant: mention(quantifier),
                                fix: mention(replacement),
                                cause,
                            },
                            suggest: [
                                {
                                    messageId: "suggestionReplace",
                                    data: {
                                        quant: mention(quantifier),
                                        fix: mention(replacement),
                                    },
                                    fix,
                                },
                            ],
                        })
                    }
                }
            }

            /**
             * Quantifiers at the end of the a capturing groups that can
             * exchange characters with another quantifier outside the capturing group.
             */
            function reportTradingEndQuantifiers(
                capturingGroup: CapturingGroup,
            ): void {
                const direction = getMatchingDirection(capturingGroup)
                const endQuantifiers = getStartQuantifiers(
                    capturingGroup.alternatives,
                    invertMatchingDirection(direction),
                    flags,
                )

                for (const quantifier of endQuantifiers) {
                    if (!quantifier.greedy) {
                        // lazy quantifiers aren't misleading here
                        continue
                    }
                    if (quantifier.min === quantifier.max) {
                        continue
                    }

                    const qChar = getSingleRepeatedChar(quantifier, flags)
                    if (qChar.isEmpty) {
                        // we can only check for single-characters
                        continue
                    }

                    for (const trader of getTradingQuantifiersAfter(
                        quantifier,
                        qChar,
                        direction,
                        flags,
                    )) {
                        // we now found a quantifier that we can exchange characters with.
                        if (hasSomeDescendant(capturingGroup, trader.quant)) {
                            // the other quantifier must be outside the capturing group
                            continue
                        }
                        if (
                            trader.quant.min >= 1 &&
                            !isPotentiallyZeroLength(
                                trader.quant.element,
                                flags,
                            )
                        )
                            context.report({
                                node,
                                loc: getRegexpLocation(quantifier),
                                messageId: "trading",
                                data: {
                                    quant: mention(quantifier),
                                    other: mention(trader.quant),
                                    chars: toCharSetSource(
                                        trader.intersection,
                                        flags,
                                    ),
                                },
                            })
                    }
                }
            }

            return {
                onCapturingGroupLeave(capturingGroup) {
                    reportStartQuantifiers(capturingGroup)
                    if (reportBacktrackingEnds) {
                        reportTradingEndQuantifiers(capturingGroup)
                    }
                },
            }
        }

        return defineRegexpVisitor(context, {
            createVisitor,
        })
    },
})
