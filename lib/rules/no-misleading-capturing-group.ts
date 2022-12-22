import type { RegExpVisitor } from "regexpp/visitor"
import type {
    Alternative,
    CapturingGroup,
    Element,
    Node,
    Quantifier,
} from "regexpp/ast"
import type { RegExpContext } from "../utils"
import { createRule, defineRegexpVisitor, toCharSetSource } from "../utils"
import type { MatchingDirection, ReadonlyFlags } from "regexp-ast-analysis"
import {
    getFirstConsumedCharAfter,
    invertMatchingDirection,
    getMatchingDirection,
    isEmpty,
    hasSomeDescendant,
    Chars,
    toCharSet,
} from "regexp-ast-analysis"
import { canSimplifyQuantifier } from "../utils/regexp-ast/simplify-quantifier"
import { fixSimplifyQuantifier } from "../utils/fix-simplify-quantifier"
import { joinEnglishList, mention } from "../utils/mention"
import { getParser } from "../utils/regexp-ast"
import type { CharSet } from "refa"

/**
 * Throws if called.
 */
function assertNever(value: never): never {
    throw new Error(`Invalid value: ${value}`)
}

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
): Iterable<Quantifier> {
    if (Array.isArray(root)) {
        for (const a of root) {
            yield* getStartQuantifiers(a, direction)
        }
        return
    }

    switch (root.type) {
        case "Character":
        case "CharacterClass":
        case "CharacterSet":
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
                if (isEmpty(e)) continue
                yield* getStartQuantifiers(e, direction)
                break
            }
            break
        }
        case "CapturingGroup":
            // there's no point in going into capturing groups for the purpose
            // of this rule
            break
        case "Group":
            yield* getStartQuantifiers(root.alternatives, direction)
            break
        case "Quantifier":
            yield root
            if (root.max === 1) {
                yield* getStartQuantifiers(root.element, direction)
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

/**
 * Returns the largest character set such that `L(chars) ⊆ L(element)`.
 */
function getSingleRepeatedChar(
    element: Element | Alternative,
    flags: ReadonlyFlags,
): CharSet {
    switch (element.type) {
        case "Alternative": {
            let total: CharSet | undefined = undefined
            for (const e of element.elements) {
                const c = getSingleRepeatedChar(e, flags)
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
            return toCharSet(element, flags)

        case "CapturingGroup":
        case "Group":
            return element.alternatives
                .map((a) => getSingleRepeatedChar(a, flags))
                .reduce((a, b) => a.union(b))

        case "Quantifier":
            if (element.max === 0) return Chars.empty(flags)
            return getSingleRepeatedChar(element.element, flags)

        default:
            return assertNever(element)
    }
}

export default createRule("no-misleading-capturing-group", {
    meta: {
        docs: {
            description:
                "disallow capturing groups that do not behave as one would expect",
            category: "Possible Errors",
            // TODO Switch to recommended in the major version.
            // recommended: true,
            recommended: false,
        },
        hasSuggestions: true,
        schema: [],
        messages: {
            removeQuant:
                "{{quant}} can be removed because it is already included by {{cause}}." +
                " This makes the capturing group misleading because it actually captures less text than its pattern suggests.",
            replaceQuant:
                "{{quant}} can be replaced with {{fix}} because of {{cause}}." +
                " This makes the capturing group misleading because it actually captures less text than its pattern suggests.",
            suggestionRemove: "Remove {{quant}}.",
            suggestionReplace: "Replace {{quant}} with {{fix}}.",
            nonAtomic:
                "The quantifier {{quant}} is not atomic for the characters {{chars}}, so it might capture fewer characters than expected. This makes the capturing group misleading because the quantifier will capture fewer characters than its pattern suggests in some edge cases.",
            suggestionNonAtomic:
                "Make the quantifier atomic by adding {{fix}}. Careful! This is going to change the behavior of the regex in some edge cases.",
        },
        type: "problem",
    },
    create(context) {
        /**
         * Create visitor
         */
        function createVisitor(
            regexpContext: RegExpContext,
        ): RegExpVisitor.Handlers {
            const { node, flags, getRegexpLocation, fixReplaceNode } =
                regexpContext

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
             * Quantifiers at the end of the a capturing groups might be
             * non-atomic which can be misleading.
             */
            function reportNonAtomicEndQuantifiers(
                capturingGroup: CapturingGroup,
            ): void {
                const direction = getMatchingDirection(capturingGroup)
                const endQuantifiers = getStartQuantifiers(
                    capturingGroup.alternatives,
                    invertMatchingDirection(direction),
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

                    const next = getFirstConsumedCharAfter(
                        quantifier,
                        direction,
                        flags,
                    )
                    if (next.empty) {
                        // we need a next char
                        continue
                    }
                    if (!next.exact) {
                        // a superset is not sufficient
                        continue
                    }

                    const nonAtomic = qChar.intersect(next.char)
                    if (nonAtomic.isEmpty) {
                        // the quantifier is atomic
                        continue
                    }

                    const nonAtomicSource = toCharSetSource(nonAtomic, flags)
                    const fix =
                        direction === "ltr"
                            ? `(?!${nonAtomicSource})`
                            : `(?<!${nonAtomicSource})`

                    context.report({
                        node,
                        loc: getRegexpLocation(quantifier),
                        messageId: "nonAtomic",
                        data: {
                            quant: mention(quantifier),
                            chars: mention(nonAtomicSource),
                        },
                        suggest: [
                            {
                                messageId: "suggestionNonAtomic",
                                data: {
                                    fix,
                                },
                                fix: fixReplaceNode(
                                    quantifier,
                                    direction === "ltr"
                                        ? quantifier.raw + fix
                                        : fix + quantifier.raw,
                                ),
                            },
                        ],
                    })
                }
            }

            return {
                onCapturingGroupLeave(capturingGroup) {
                    reportStartQuantifiers(capturingGroup)
                    reportNonAtomicEndQuantifiers(capturingGroup)
                },
            }
        }

        return defineRegexpVisitor(context, {
            createVisitor,
        })
    },
})
