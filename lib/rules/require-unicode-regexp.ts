import type { CharRange } from "refa"
import { visitRegExpAST, RegExpParser } from "regexpp"
import type { Pattern } from "regexpp/ast"
import type { RegExpVisitor } from "regexpp/visitor"
import type { RegExpContext } from "../utils"
import { createRule, defineRegexpVisitor } from "../utils"
import { hasSomeDescendant, toCache, toCharSet } from "regexp-ast-analysis"

const UTF16_MAX = 0xffff

/**
 * Returns whether the given pattern is compatible with unicode-mode on a
 * syntactical level. So means that:
 *
 * 1. The raw regex is syntactically valid with the u flag.
 * 2. The regex is parsed the same way (*).
 *
 * (*) Unicode mode parses surrogates as one character while non-Unicode mode
 * parses the pair as two separate code points. We will ignore this difference.
 * We will also ignore the sematic differences between escape sequences and
 * so on.
 *
 * @returns `false` or the parsed Unicode pattern
 */
function isSyntacticallyCompatible(pattern: Pattern): false | Pattern {
    const INCOMPATIBLE = {}

    // See whether it's syntactically valid

    let uPattern
    try {
        uPattern = new RegExpParser().parsePattern(
            pattern.raw,
            undefined,
            undefined,
            true,
        )
    } catch (error) {
        return false
    }

    // See whether it's parsed the same way

    // We will try to find constructs in the non-Unicode regex that we know
    // will either result in a syntax error or a different construct. Since
    // we already checked for syntax errors, we know that it's the second
    // option.

    // There is another construct that get interpreted differently: Surrogates.
    // We want to make sure that no surrogate is a quantified element or
    // character class element.

    try {
        visitRegExpAST(pattern, {
            onCharacterEnter(node) {
                if (/^\\(?![bfnrtv])[A-Za-z]$/.test(node.raw)) {
                    // All cool Unicode feature are behind escapes like \p.
                    throw INCOMPATIBLE
                }
            },
        })

        // See no-misleading-character-class for more details
        visitRegExpAST(uPattern, {
            onCharacterEnter(node) {
                if (
                    node.value > UTF16_MAX &&
                    (node.parent.type === "CharacterClass" ||
                        node.parent.type === "CharacterClassRange")
                ) {
                    // /[😃]/ != /[😃]/u
                    throw INCOMPATIBLE
                }
            },
            onQuantifierEnter(node) {
                if (
                    node.element.type === "Character" &&
                    node.element.value > UTF16_MAX
                ) {
                    // /😃+/ != /😃+/u
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

    return uPattern
}

const SURROGATES: CharRange = { min: 0xd800, max: 0xdfff }

/** Returns whether the two given ranges are equal. */
function rangeEqual(a: readonly CharRange[], b: readonly CharRange[]): boolean {
    if (a.length !== b.length) {
        return false
    }
    for (let i = 0; i < a.length; i++) {
        const x = a[i]
        const y = b[i]
        if (x.min !== y.min || x.max !== y.max) {
            return false
        }
    }
    return true
}

/**
 * Returns whether the regex would keep its behaviour if the u flag were to be
 * added.
 */
function isSemanticallyCompatible(
    regexpContext: RegExpContext,
    uPattern: Pattern,
): boolean {
    const surrogatePositions = new Set<number>()
    visitRegExpAST(uPattern, {
        onCharacterEnter(node) {
            if (node.value > UTF16_MAX) {
                for (let i = node.start; i < node.end; i++) {
                    surrogatePositions.add(i)
                }
            }
        },
    })

    const pattern = regexpContext.patternAst
    const flags = regexpContext.flags
    const uFlags = toCache({ ...flags, unicode: true })

    return !hasSomeDescendant(
        pattern,
        (n) => {
            // The goal is find something that is will change when adding the
            // Unicode flag.

            // Surrogates don't change
            if (n.type === "Character" && surrogatePositions.has(n.start)) {
                return false
            }

            if (
                n.type === "Assertion" &&
                n.kind === "word" &&
                flags.ignoreCase
            ) {
                // The case canonicalization in Unicode mode is different which
                // causes `\b` and `\B` to accept/reject a few more characters.
                return true
            }

            if (
                n.type === "Character" ||
                n.type === "CharacterClass" ||
                n.type === "CharacterSet"
            ) {
                const cs = toCharSet(n, flags)
                if (!cs.isDisjointWith(SURROGATES)) {
                    // If the character (class/set) contains high or low
                    // surrogates, then we won't be able to guarantee that the
                    // Unicode pattern will behave the same way.
                    return true
                }

                // Compare the ranges.
                return !rangeEqual(cs.ranges, toCharSet(n, uFlags).ranges)
            }

            return false
        },
        (n) => {
            // Don't go into character classes, we already checked them
            return n.type !== "CharacterClass"
        },
    )
}

/**
 * Returns whether the regex would keep its behaviour if the u flag were to be
 * added.
 */
function isCompatible(regexpContext: RegExpContext): boolean {
    const uPattern = isSyntacticallyCompatible(regexpContext.patternAst)
    if (!uPattern) {
        return false
    }

    return isSemanticallyCompatible(regexpContext, uPattern)
}

export default createRule("require-unicode-regexp", {
    meta: {
        docs: {
            description: "enforce the use of the `u` flag",
            category: "Best Practices",
            recommended: false,
        },
        schema: [],
        fixable: "code",
        messages: {
            require: "Use the 'u' flag.",
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

            if (!flags.unicode) {
                context.report({
                    node,
                    loc: getFlagsLocation(),
                    messageId: "require",
                    fix: fixReplaceFlags(() => {
                        if (!isCompatible(regexpContext)) {
                            return null
                        }
                        return `${flagsString}u`
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
