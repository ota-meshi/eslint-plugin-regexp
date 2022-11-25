import type { RegExpLiteral, Pattern, Element, Alternative } from "regexpp/ast"
import type { Rule } from "eslint"
import type { Expression } from "estree"
import { parseRegExpLiteral, RegExpParser, visitRegExpAST } from "regexpp"
import { getStaticValue } from "../ast-utils"
import { JS } from "refa"
import type { CharRange, CharSet } from "refa"
import type { ReadonlyFlags } from "regexp-ast-analysis"
import {
    Chars,
    hasSomeDescendant,
    isEmptyBackreference,
    toCharSet,
} from "regexp-ast-analysis"
import type { RegExpContext } from ".."
export { getFirstConsumedCharPlusAfter } from "./common"
export type { ShortCircuit } from "./common"
export * from "./is-covered"
export * from "./is-equals"

const parser = new RegExpParser()
/**
 * Get Reg Exp node from given expression node
 */
export function getRegExpNodeFromExpression(
    node: Expression,
    context: Rule.RuleContext,
): RegExpLiteral | Pattern | null {
    if (node.type === "Literal") {
        if ("regex" in node && node.regex) {
            try {
                return parser.parsePattern(
                    node.regex.pattern,
                    0,
                    node.regex.pattern.length,
                    node.regex.flags.includes("u"),
                )
            } catch {
                return null
            }
        }
        return null
    }
    const evaluated = getStaticValue(context, node)
    if (!evaluated || !(evaluated.value instanceof RegExp)) {
        return null
    }
    try {
        return parseRegExpLiteral(evaluated.value)
    } catch {
        return null
    }
}

/**
 * Extract capturing group data
 */
export function extractCaptures(patternNode: RegExpLiteral | Pattern): {
    names: Set<string>
    count: number
} {
    let count = 0
    const names = new Set<string>()
    visitRegExpAST(patternNode, {
        onCapturingGroupEnter(cgNode) {
            count++
            if (cgNode.name != null) {
                names.add(cgNode.name)
            }
        },
    })

    return { count, names }
}

export interface PossiblyConsumedChar {
    char: CharSet
    /**
     * Whether `char` is exact.
     *
     * If `false`, then `char` is only guaranteed to be a superset of the
     * actually possible characters.
     */
    exact: boolean
}

/**
 * Returns the union of all characters that can possibly be consumed by the
 * given element.
 */
export function getPossiblyConsumedChar(
    element: Element | Pattern | Alternative,
    flags: ReadonlyFlags,
): PossiblyConsumedChar {
    const ranges: CharRange[] = []
    let exact = true

    // we misuse hasSomeDescendant to iterate all relevant elements
    hasSomeDescendant(
        element,
        (d) => {
            if (
                d.type === "Character" ||
                d.type === "CharacterClass" ||
                d.type === "CharacterSet"
            ) {
                const c = toCharSet(d, flags)
                ranges.push(...c.ranges)
                exact = exact && !c.isEmpty
            } else if (d.type === "Backreference" && !isEmptyBackreference(d)) {
                const c = getPossiblyConsumedChar(d.resolved, flags)
                ranges.push(...c.char.ranges)
                exact = exact && c.exact && c.char.size < 2
            }

            // always continue to the next element
            return false
        },
        // don't go into assertions
        (d) => {
            if (d.type === "CharacterClass") {
                return false
            }
            if (d.type === "Assertion") {
                exact = false
                return false
            }
            return true
        },
    )

    const char = Chars.empty(flags).union(ranges)

    return { char, exact }
}

/**
 * Create a `JS.RegexppAst` object as required by refa's `JS.Parser.fromAst`
 * method and `ParsedLiteral` interface of the scslre library.
 */
export function getJSRegexppAst(
    context: RegExpContext,
    ignoreSticky = false,
): JS.RegexppAst {
    const { flags, flagsString, patternAst } = context

    return {
        pattern: patternAst,
        flags: {
            type: "Flags",
            raw: flagsString ?? "",
            parent: null,
            start: NaN,
            end: NaN,
            dotAll: flags.dotAll ?? false,
            global: flags.global ?? false,
            hasIndices: flags.hasIndices ?? false,
            ignoreCase: flags.ignoreCase ?? false,
            multiline: flags.multiline ?? false,
            sticky: !ignoreSticky && (flags.sticky ?? false),
            unicode: flags.unicode ?? false,
        },
    }
}

const parserCache = new WeakMap<RegExpContext, JS.Parser>()

/**
 * Returns a `JS.Parser` for the given regex context.
 */
export function getParser(context: RegExpContext): JS.Parser {
    let cached = parserCache.get(context)
    if (cached === undefined) {
        cached = JS.Parser.fromAst(getJSRegexppAst(context))
        parserCache.set(context, cached)
    }
    return cached
}
