import type { Rule } from "eslint"
import type { SourceLocation } from "estree"
import {
    getMatchingDirection,
    getFirstConsumedChar,
    getFirstCharAfter,
} from "regexp-ast-analysis"
import type { Quantifier } from "regexpp/ast"
import type { RegExpVisitor } from "regexpp/visitor"
import type { RegExpContext } from "../utils"
import { createRule, defineRegexpVisitor } from "../utils"

/**
 * Returns a fix that makes the given quantifier greedy.
 */
function makeGreedy({ patternSource }: RegExpContext, qNode: Quantifier) {
    return (fixer: Rule.RuleFixer): Rule.Fix | null => {
        if (qNode.greedy) {
            return null
        }

        const range = patternSource?.getReplaceRange({
            start: qNode.end - 1,
            end: qNode.end,
        })
        if (!range) {
            return null
        }
        return range.remove(fixer)
    }
}

/**
 * Returns the source location of the lazy modifier of the given quantifier.
 */
function getLazyLoc(
    { getRegexpLocation }: RegExpContext,
    qNode: Quantifier,
): SourceLocation {
    const offset = qNode.raw.length - 1
    return getRegexpLocation(qNode, [offset, offset + 1])
}

export default createRule("no-useless-lazy", {
    meta: {
        docs: {
            description: "disallow unnecessarily non-greedy quantifiers",
            category: "Best Practices",
            // TODO In the major version
            // recommended: true,
            recommended: false,
        },
        fixable: "code",
        schema: [],
        messages: {
            constant: "Unexpected non-greedy constant quantifier.",
            possessive:
                "Unexpected non-greedy constant quantifier. The quantifier is effectively possessive, so it doesn't matter whether it is greedy or not.",
        },
        type: "suggestion", // "problem",
    },
    create(context) {
        /**
         * Create visitor
         */
        function createVisitor(
            regexpContext: RegExpContext,
        ): RegExpVisitor.Handlers {
            const { node, flags } = regexpContext
            return {
                onQuantifierEnter(qNode) {
                    if (qNode.greedy) {
                        return
                    }

                    if (qNode.min === qNode.max) {
                        // a constant lazy quantifier (e.g. /a{2}?/)

                        context.report({
                            node,
                            loc: getLazyLoc(regexpContext, qNode),
                            messageId: "constant",
                            fix: makeGreedy(regexpContext, qNode),
                        })
                        return
                    }

                    // This is more tricky.
                    // The basic idea here is that if the first character of the
                    // quantified element and the first character of whatever
                    // comes after the quantifier are always different, then the
                    // lazy modifier doesn't matter.
                    // E.g. /a+?b+/ == /a+b+/

                    const matchingDir = getMatchingDirection(qNode)
                    const firstChar = getFirstConsumedChar(
                        qNode,
                        matchingDir,
                        flags,
                    )
                    if (!firstChar.empty) {
                        const after = getFirstCharAfter(
                            qNode,
                            matchingDir,
                            flags,
                        )
                        if (
                            !after.edge &&
                            firstChar.char.isDisjointWith(after.char)
                        ) {
                            context.report({
                                node,
                                loc: getLazyLoc(regexpContext, qNode),
                                messageId: "possessive",
                                fix: makeGreedy(regexpContext, qNode),
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
