import type { Rule, SourceCode } from "eslint"
import type { Expression, SourceLocation } from "estree"
import {
    getMatchingDirection,
    getFirstConsumedChar,
    getFirstCharAfter,
} from "regexp-ast-analysis"
import type { Quantifier } from "regexpp/ast"
import type { RegExpVisitor } from "regexpp/visitor"
import {
    createRule,
    defineRegexpVisitor,
    getRegexpLocation,
    getRegexpRange,
    parseFlags,
} from "../utils"

/**
 * Returns a fix that makes the given quantifier greedy.
 */
function makeGreedy(
    sourceCode: SourceCode,
    node: Expression,
    qNode: Quantifier,
) {
    return (fixer: Rule.RuleFixer): Rule.Fix | null => {
        const range = getRegexpRange(sourceCode, node, qNode)
        if (range == null) {
            return null
        }
        return fixer.removeRange([range[1] - 1, range[1]])
    }
}

/**
 * Returns the source location of the lazy modifier of the given quantifier.
 */
function getLazyLoc(
    sourceCode: SourceCode,
    node: Expression,
    qNode: Quantifier,
): SourceLocation {
    const offset = qNode.raw.length - 1
    return getRegexpLocation(sourceCode, node, qNode, [offset, offset + 1])
}

export default createRule("no-useless-non-greedy", {
    meta: {
        docs: {
            description: "disallow unnecessarily non-greedy quantifiers",
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
        const sourceCode = context.getSourceCode()

        /**
         * Create visitor
         * @param node
         */
        function createVisitor(
            node: Expression,
            _pattern: string,
            flagsStr: string,
        ): RegExpVisitor.Handlers {
            const flags = parseFlags(flagsStr)

            return {
                onQuantifierEnter(qNode) {
                    if (qNode.greedy) {
                        return
                    }

                    if (qNode.min === qNode.max) {
                        // a constant lazy quantifier (e.g. /a{2}?/)

                        context.report({
                            node,
                            loc: getLazyLoc(sourceCode, node, qNode),
                            messageId: "constant",
                            fix: makeGreedy(sourceCode, node, qNode),
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
                                loc: getLazyLoc(sourceCode, node, qNode),
                                messageId: "possessive",
                                fix: makeGreedy(sourceCode, node, qNode),
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
