import type { RegExpVisitor } from "regexpp/visitor"
import type { Alternative, Quantifier } from "regexpp/ast"
import type { RegExpContext } from "../utils"
import { createRule, defineRegexpVisitor } from "../utils"
import { UsageOfPattern } from "../utils/get-usage-of-pattern"

/**
 * Extract lazy end quantifiers
 */
function* extractLazyEndQuantifiers(
    alternatives: Alternative[],
): IterableIterator<Quantifier> {
    for (const { elements } of alternatives) {
        if (elements.length > 0) {
            const last = elements[elements.length - 1]
            switch (last.type) {
                case "Quantifier":
                    if (!last.greedy && last.min !== last.max) {
                        yield last
                    } else if (last.max === 1) {
                        const element = last.element
                        if (
                            element.type === "Group" ||
                            element.type === "CapturingGroup"
                        ) {
                            yield* extractLazyEndQuantifiers(
                                element.alternatives,
                            )
                        }
                    }
                    break

                case "CapturingGroup":
                case "Group":
                    yield* extractLazyEndQuantifiers(last.alternatives)
                    break

                default:
                    break
            }
        }
    }
}

export default createRule("no-lazy-ends", {
    meta: {
        docs: {
            description:
                "disallow lazy quantifiers at the end of an expression",
            category: "Possible Errors",
            // TODO Switch to recommended in the major version.
            // recommended: true,
            recommended: false,
            default: "warn",
        },
        schema: [
            {
                type: "object",
                properties: {
                    ignorePartial: { type: "boolean" },
                },
                additionalProperties: false,
            },
        ],
        messages: {
            uselessElement:
                "The quantifier and the quantified element can be removed because the quantifier is lazy and has a minimum of 0.",
            uselessQuantifier:
                "The quantifier can be removed because the quantifier is lazy and has a minimum of 1.",
            uselessRange:
                "The quantifier can be replaced with '{{{min}}}' because the quantifier is lazy and has a minimum of {{min}}.",
        },
        type: "problem",
    },
    create(context) {
        const ignorePartial = context.options[0]?.ignorePartial ?? true

        /**
         * Create visitor
         */
        function createVisitor({
            node,
            getRegexpLocation,
            getUsageOfPattern,
        }: RegExpContext): RegExpVisitor.Handlers {
            if (ignorePartial) {
                const usageOfPattern = getUsageOfPattern()
                if (
                    usageOfPattern === UsageOfPattern.partial ||
                    usageOfPattern === UsageOfPattern.mixed
                ) {
                    // ignore
                    return {}
                }
            }

            return {
                onPatternEnter(pNode) {
                    for (const lazy of extractLazyEndQuantifiers(
                        pNode.alternatives,
                    )) {
                        if (lazy.min === 0) {
                            context.report({
                                node,
                                loc: getRegexpLocation(lazy),
                                messageId: "uselessElement",
                            })
                        } else if (lazy.min === 1) {
                            context.report({
                                node,
                                loc: getRegexpLocation(lazy),
                                messageId: "uselessQuantifier",
                            })
                        } else {
                            context.report({
                                node,
                                loc: getRegexpLocation(lazy),
                                messageId: "uselessRange",
                                data: {
                                    min: String(lazy.min),
                                },
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
