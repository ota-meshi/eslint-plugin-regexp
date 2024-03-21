import { visitRegExpAST } from "@eslint-community/regexpp"
import type {
    Alternative,
    CapturingGroup,
    Element,
    Node,
    Pattern,
    RegExpLiteral,
} from "@eslint-community/regexpp/ast"
import type {
    FirstConsumedChar,
    MatchingDirection,
    ReadonlyFlags,
} from "regexp-ast-analysis"
import {
    FirstConsumedChars,
    getFirstConsumedChar,
    getFirstConsumedCharAfter,
    hasSomeDescendant,
} from "regexp-ast-analysis"

export type ShortCircuit = (aNode: Node, bNode: Node) => boolean | null

/**
 * This operations is equal to:
 *
 * ```
 * concat(
 *     getFirstConsumedChar(element, direction, flags),
 *     getFirstConsumedCharAfter(element, direction, flags),
 * )
 * ```
 */
export function getFirstConsumedCharPlusAfter(
    element: Element | Alternative,
    direction: MatchingDirection,
    flags: ReadonlyFlags,
): FirstConsumedChar {
    const consumed = getFirstConsumedChar(element, direction, flags)

    if (!consumed.empty) {
        return consumed
    }

    return FirstConsumedChars.concat(
        [consumed, getFirstConsumedCharAfter(element, direction, flags)],
        flags,
    )
}

export interface CapturingGroups {
    groups: CapturingGroup[]
    names: Set<string>
    count: number
}

/**
 * Extract capturing group data
 */
export function extractCaptures(
    pattern: RegExpLiteral | Pattern,
): CapturingGroups {
    const groups: CapturingGroup[] = []
    visitRegExpAST(pattern, {
        onCapturingGroupEnter(group) {
            groups.push(group)
        },
    })

    // visitRegExpAST given no guarantees in which order nodes are visited.
    // Sort the list to guarantee order.
    groups.sort((a, b) => a.start - b.start)

    const names = new Set<string>()
    for (const group of groups) {
        if (group.name !== null) {
            names.add(group.name)
        }
    }

    return { groups, names, count: groups.length }
}

/**
 * Returns whether the given node is or contains a capturing group.
 */
export function hasCapturingGroup(node: Node): boolean {
    return hasSomeDescendant(node, (d) => d.type === "CapturingGroup")
}
