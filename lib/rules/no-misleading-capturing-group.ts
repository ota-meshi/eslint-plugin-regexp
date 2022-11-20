import type { RegExpVisitor } from "regexpp/visitor"
import type { Alternative, Element, Node, Quantifier } from "regexpp/ast"
import type { RegExpContext } from "../utils"
import { createRule, defineRegexpVisitor } from "../utils"
import type { MatchingDirection } from "regexp-ast-analysis"
import {
    getMatchingDirection,
    isEmpty,
    hasSomeDescendant,
} from "regexp-ast-analysis"
import { canSimplifyQuantifier } from "../utils/regexp-ast/simplify-quantifier"
import { fixSimplifyQuantifier } from "../utils/fix-simplify-quantifier"
import { joinEnglishList, mention } from "../utils/mention"
import { getParser } from "../utils/regexp-ast"

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
            suggestionReplace: "replace {{quant}} with {{fix}}.",
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
            const { node, flags, getRegexpLocation } = regexpContext

            const parser = getParser(regexpContext)

            return {
                onCapturingGroupLeave(capturingGroup) {
                    const direction = getMatchingDirection(capturingGroup)

                    for (const quantifier of getStartQuantifiers(
                        capturingGroup.alternatives,
                        direction,
                    )) {
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
                },
            }
        }

        return defineRegexpVisitor(context, {
            createVisitor,
        })
    },
})
