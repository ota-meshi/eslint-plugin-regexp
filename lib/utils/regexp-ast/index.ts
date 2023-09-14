import type { RegExpLiteral, Pattern } from "@eslint-community/regexpp/ast"
import type { Rule } from "eslint"
import type { Expression } from "estree"
import {
    parseRegExpLiteral,
    RegExpParser,
    visitRegExpAST,
} from "@eslint-community/regexpp"
import { getStaticValue } from "../ast-utils"
import { JS } from "refa"
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
                    {
                        unicode: node.regex.flags.includes("u"),
                        unicodeSets: node.regex.flags.includes("v"),
                    },
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
            unicodeSets: flags.unicodeSets ?? false,
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
