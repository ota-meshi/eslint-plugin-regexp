import { parseRegExpLiteral, RegExpParser } from "@eslint-community/regexpp"
import type { RegExpLiteral, Pattern } from "@eslint-community/regexpp/ast"
import type { Rule } from "eslint"
import type { Expression } from "estree"
import { getStaticValue } from "../ast-utils"

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
