import type {
    FirstConsumedChar,
    MatchingDirection,
    ReadonlyFlags,
} from "regexp-ast-analysis"
import {
    FirstConsumedChars,
    getFirstConsumedChar,
    getFirstConsumedCharAfter,
} from "regexp-ast-analysis"
import type { Alternative, Element, Node } from "@eslint-community/regexpp/ast"
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
