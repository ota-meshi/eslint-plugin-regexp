import type { Rule } from "eslint"
import type { ClosestAncestor } from "regexp-ast-analysis"
import { getClosestAncestor } from "regexp-ast-analysis"
import type { Node, Quantifier } from "regexpp/ast"
import type { RegExpContext } from "."
import { quantToString } from "."
import type { CanSimplify } from "./regexp-ast/simplify-quantifier"

/**
 * Returns a fixer to simplify the given quantifier.
 */
export function fixSimplifyQuantifier(
    quantifier: Quantifier,
    result: CanSimplify,
    { fixReplaceNode }: RegExpContext,
): [replacement: string, fix: (fixer: Rule.RuleFixer) => Rule.Fix | null] {
    const ancestor = getClosestAncestorOfAll([
        quantifier,
        ...result.dependencies,
    ])

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

/**
 * Returns the closest ancestor of all given elements.
 */
function getClosestAncestorOfAll<T extends Node>(
    elements: readonly [T, ...T[]],
): ClosestAncestor<T, T> {
    let leftMost = elements[0]
    let rightMost = elements[0]
    for (const e of elements) {
        if (e.start < leftMost.start) leftMost = e
        if (e.end > rightMost.end) rightMost = e
    }
    return getClosestAncestor(leftMost, rightMost)
}
