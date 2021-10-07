import type { CharRange } from "refa"
import { visitRegExpAST, RegExpParser } from "regexpp"
import type {
    Character,
    CharacterClass,
    CharacterSet,
    Node,
    Pattern,
    Quantifier,
} from "regexpp/ast"
import type { RegExpVisitor } from "regexpp/visitor"
import type { RegExpContext } from "../utils"
import { createRule, defineRegexpVisitor } from "../utils"
import type { ReadonlyFlags } from "regexp-ast-analysis"
import {
    hasSomeDescendant,
    toCache,
    toCharSet,
    getFirstCharAfter,
} from "regexp-ast-analysis"

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
                if (/^\\(?![bfnrtv])[A-Za-z]$/u.test(node.raw)) {
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

const HIGH_SURROGATES: CharRange = { min: 0xd800, max: 0xdbff }
const LOW_SURROGATES: CharRange = { min: 0xdc00, max: 0xdfff }
const SURROGATES: CharRange = { min: 0xd800, max: 0xdfff }
const ASTRAL: CharRange = { min: 0x10000, max: 0x10ffff }

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

type CharLike = Character | CharacterClass | CharacterSet

/** Whether the given element is character-like element. */
function isChar(node: Node): node is CharLike {
    return (
        node.type === "Character" ||
        node.type === "CharacterClass" ||
        node.type === "CharacterSet"
    )
}

/**
 * Whether the given char-like accepts the same characters with and without
 * the u flag.
 */
function isCompatibleCharLike(
    char: CharLike,
    flags: ReadonlyFlags,
    uFlags: ReadonlyFlags,
): boolean {
    const cs = toCharSet(char, flags)
    if (!cs.isDisjointWith(SURROGATES)) {
        // If the character (class/set) contains high or low
        // surrogates, then we won't be able to guarantee that the
        // Unicode pattern will behave the same way.
        return false
    }

    const uCs = toCharSet(char, uFlags)

    // Compare the ranges.
    return rangeEqual(cs.ranges, uCs.ranges)
}

/**
 * Whether the given quantifier accepts the same characters with and without
 * the u flag.
 *
 * This will return `undefined` if the function cannot decide.
 */
function isCompatibleQuantifier(
    q: Quantifier,
    flags: ReadonlyFlags,
    uFlags: ReadonlyFlags,
): boolean | undefined {
    if (!isChar(q.element)) {
        return undefined
    }

    if (isCompatibleCharLike(q.element, flags, uFlags)) {
        // trivial
        return true
    }

    // A quantifier `n*` or `n+` is the same with and without the
    // u flag if all of the following conditions are true:
    //
    // 1. The UTF16 characters of the element contain all
    //    surrogates characters (U+D800-U+DFFF).
    // 2. The Unicode characters of the element contain all
    //    surrogates characters (U+D800-U+DFFF) and astral
    //    characters (U+10000-U+10FFFF).
    // 3. All non-surrogate and non-astral characters of the UTF16
    //    and Unicode characters of the element as the same.
    // 4. The first character before the quantifier is not a
    //    high surrogate (U+D800-U+DBFF).
    // 5. The first character after the quantifier is not a
    //    low surrogate (U+DC00-U+DFFF).

    if (q.min > 1 || q.max !== Infinity) {
        return undefined
    }

    const cs = toCharSet(q.element, flags)
    if (!cs.isSupersetOf(SURROGATES)) {
        // failed condition 1
        return false
    }

    const uCs = toCharSet(q.element, uFlags)
    if (!uCs.isSupersetOf(SURROGATES) || !uCs.isSupersetOf(ASTRAL)) {
        // failed condition 2
        return false
    }

    if (!rangeEqual(cs.ranges, uCs.without([ASTRAL]).ranges)) {
        // failed condition 3
        return false
    }

    const before = getFirstCharAfter(q, "rtl", flags).char
    if (!before.isDisjointWith(HIGH_SURROGATES)) {
        // failed condition 4
        return false
    }

    const after = getFirstCharAfter(q, "ltr", flags).char
    if (!after.isDisjointWith(LOW_SURROGATES)) {
        // failed condition 5
        return false
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

    const skip = new Set<Node>()

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

            if (isChar(n)) {
                return !isCompatibleCharLike(n, flags, uFlags)
            }

            if (n.type === "Quantifier") {
                const result = isCompatibleQuantifier(n, flags, uFlags)

                if (result !== undefined) {
                    skip.add(n)
                    return !result
                }
            }

            return false
        },
        (n) => {
            // Don't go into character classes, we already checked them.
            // We also don't want to go into elements, we explicitly skipped.
            return n.type !== "CharacterClass" && !skip.has(n)
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
