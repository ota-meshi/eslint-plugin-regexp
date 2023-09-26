import type { RegExpVisitor } from "@eslint-community/regexpp/visitor"
import type { RegExpContext } from "../utils"
import { createRule, defineRegexpVisitor } from "../utils"
import { RegExpParser, visitRegExpAST } from "@eslint-community/regexpp"
import { toUnicodeSet } from "regexp-ast-analysis"
import { RESERVED_DOUBLE_PUNCTUATOR_PATTERN } from "../utils/unicode-set"

/**
 * Returns whether the regex would keep its behavior if the v flag were to be
 * added.
 */
function isCompatible(regexpContext: RegExpContext): boolean {
    const INCOMPATIBLE = {}

    const { flags, patternAst, pattern } = regexpContext

    try {
        const flagsWithV = { ...flags, unicodeSets: true, unicode: false }
        visitRegExpAST(patternAst, {
            onCharacterClassEnter(node) {
                const us = toUnicodeSet(node, flags)
                const vus = toUnicodeSet(
                    { ...node, unicodeSets: true },
                    flagsWithV,
                )
                if (!us.equals(vus)) {
                    throw INCOMPATIBLE
                }
                if (RESERVED_DOUBLE_PUNCTUATOR_PATTERN.test(node.raw)) {
                    throw INCOMPATIBLE
                }
            },
        })
    } catch (error) {
        if (error === INCOMPATIBLE) {
            return false
        }
        // just rethrow
        throw error
    }

    try {
        // The `v` flag has more strict escape characters.
        // To check whether it can be converted to a pattern with the `v` flag,
        // parse the pattern with the `v` flag and check for errors.
        new RegExpParser().parsePattern(pattern, undefined, undefined, {
            unicodeSets: true,
        })
    } catch (_error) {
        return false
    }

    return true
}

export default createRule("require-unicode-sets-regexp", {
    meta: {
        docs: {
            description: "enforce the use of the `v` flag",
            category: "Best Practices",
            recommended: false,
        },
        schema: [],
        fixable: "code",
        messages: {
            require: "Use the 'v' flag.",
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
                flagsString,
                getFlagsLocation,
                fixReplaceFlags,
            } = regexpContext

            if (flagsString === null) {
                // This means that there are flags (probably) but we were
                // unable to evaluate them.
                return {}
            }

            if (!flags.unicodeSets) {
                context.report({
                    node,
                    loc: getFlagsLocation(),
                    messageId: "require",
                    fix: fixReplaceFlags(() => {
                        if (
                            // Only patterns with the u flag are auto-fixed.
                            // When migrating from legacy, first add the `u` flag with the `require-unicode-regexp` rule.
                            !flags.unicode ||
                            !isCompatible(regexpContext)
                        ) {
                            return null
                        }
                        return `${flagsString.replace(/u/gu, "")}v`
                    }),
                })
            }

            return {}
        }

        return defineRegexpVisitor(context, {
            createVisitor,
        })
    },
})
