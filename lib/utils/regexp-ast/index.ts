import type { RegExpLiteral, Pattern, Element, Alternative } from "regexpp/ast"
import type { Rule } from "eslint"
import type { Expression } from "estree"
import { parseRegExpLiteral, RegExpParser, visitRegExpAST } from "regexpp"
import { getStaticValue } from "../ast-utils"
import type { CharRange, CharSet } from "refa"
import {
    Chars,
    hasSomeDescendant,
    isEmptyBackreference,
} from "regexp-ast-analysis"
import type { RegExpContext } from ".."
export { ShortCircuit } from "./common"
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
export function extractCaptures(
    patternNode: RegExpLiteral | Pattern,
): { names: Set<string>; count: number } {
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
    context: RegExpContext,
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
                const c = context.toCharSet(d)
                ranges.push(...c.ranges)
                exact = exact && !c.isEmpty
            } else if (d.type === "Backreference" && !isEmptyBackreference(d)) {
                const c = getPossiblyConsumedChar(d.resolved, context)
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

    const char = Chars.empty(context.flags).union(ranges)

    return { char, exact }
}
