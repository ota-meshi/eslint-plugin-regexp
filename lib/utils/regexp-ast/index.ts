import type { RegExpLiteral, Pattern } from "regexpp/ast"
import type { Rule } from "eslint"
import type { Expression } from "estree"
import { parseRegExpLiteral, RegExpParser, visitRegExpAST } from "regexpp"
import { getStaticValue } from "eslint-utils"
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
    const evaluated = getStaticValue(node, context.getScope())
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
