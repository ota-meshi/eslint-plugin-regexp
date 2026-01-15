import type { AST, SourceCode } from "eslint"
import type * as ESTree from "estree"
import {
    getStringValueRange,
    isRegexpLiteral,
    isStringLiteral,
} from "./utils.ts"

export function getFlagsRange(flagsNode: ESTree.RegExpLiteral): AST.Range
export function getFlagsRange(
    flagsNode: ESTree.Expression | null,
): AST.Range | null
/**
 * Creates source range of the flags of the given regexp node
 * @param flagsNode The expression that contributes the flags.
 */
export function getFlagsRange(
    flagsNode: ESTree.Expression | null,
): AST.Range | null {
    if (!flagsNode) {
        return null
    }

    if (isRegexpLiteral(flagsNode)) {
        return [
            flagsNode.range![1] - flagsNode.regex.flags.length,
            flagsNode.range![1],
        ]
    }
    if (isStringLiteral(flagsNode)) {
        return [flagsNode.range![0] + 1, flagsNode.range![1] - 1]
    }

    return null
}

/**
 * Creates SourceLocation of the flags of the given regexp node
 * @param sourceCode The ESLint source code instance.
 * @param regexpNode The node to report.
 */
export function getFlagsLocation(
    sourceCode: SourceCode,
    regexpNode: ESTree.CallExpression | ESTree.RegExpLiteral,
    flagsNode: ESTree.Expression | null,
): AST.SourceLocation {
    const range = getFlagsRange(flagsNode)
    if (range == null) {
        return flagsNode?.loc ?? regexpNode.loc!
    }

    if (range[0] === range[1]) {
        range[0]--
    }

    return {
        start: sourceCode.getLocFromIndex(range[0]),
        end: sourceCode.getLocFromIndex(range[1]),
    }
}

/**
 * Creates source range of the given flag in the given flags node
 * @param flagsNode The expression that contributes the flags.
 */
export function getFlagRange(
    sourceCode: SourceCode,
    flagsNode: ESTree.Expression | null,
    flag: string,
): AST.Range | null {
    if (!flagsNode || !flag) {
        return null
    }

    if (isRegexpLiteral(flagsNode)) {
        const index = flagsNode.regex.flags.indexOf(flag)
        if (index === -1) {
            return null
        }
        const start = flagsNode.range![1] - flagsNode.regex.flags.length + index
        return [start, start + 1]
    }
    if (isStringLiteral(flagsNode)) {
        const index = flagsNode.value.indexOf(flag)
        if (index === -1) {
            return null
        }
        return getStringValueRange(sourceCode, flagsNode, index, index + 1)
    }

    return null
}

/**
 * Creates source location of the given flag in the given flags node
 * @param flagsNode The expression that contributes the flags.
 */
export function getFlagLocation(
    sourceCode: SourceCode,
    regexpNode: ESTree.CallExpression | ESTree.RegExpLiteral,
    flagsNode: ESTree.Expression | null,
    flag: string,
): AST.SourceLocation {
    const range = getFlagRange(sourceCode, flagsNode, flag)
    if (range == null) {
        return flagsNode?.loc ?? regexpNode.loc!
    }
    return {
        start: sourceCode.getLocFromIndex(range[0]),
        end: sourceCode.getLocFromIndex(range[1]),
    }
}
