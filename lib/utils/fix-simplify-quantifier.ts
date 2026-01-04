import type { Quantifier } from "@eslint-community/regexpp/ast"
import type { Rule } from "eslint"
import { getClosestAncestor } from "regexp-ast-analysis"
import type { RegExpContext } from "./index.ts"
import { quantToString } from "./regexp-ast/index.ts"
import type { CanSimplify } from "./regexp-ast/index.ts"

/**
 * Returns a fixer to simplify the given quantifier.
 */
export function fixSimplifyQuantifier(
    quantifier: Quantifier,
    result: CanSimplify,
    { fixReplaceNode }: RegExpContext,
): [replacement: string, fix: (fixer: Rule.RuleFixer) => Rule.Fix | null] {
    const ancestor = getClosestAncestor(quantifier, ...result.dependencies)

    let replacement: string
    if (quantifier.min === 0) {
        replacement = ""
    } else if (quantifier.min === 1) {
        replacement = quantifier.element.raw
    } else {
        replacement =
            quantifier.element.raw +
            quantToString({
                min: quantifier.min,
                max: quantifier.min,
                greedy: true,
            })
    }

    return [
        replacement,
        fixReplaceNode(ancestor, () => {
            return (
                ancestor.raw.slice(0, quantifier.start - ancestor.start) +
                replacement +
                ancestor.raw.slice(quantifier.end - ancestor.start)
            )
        }),
    ]
}
