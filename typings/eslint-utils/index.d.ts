import type * as ESTree from "estree"
import type eslint from "eslint"

export function findVariable(
    initialScope: eslint.Scope.Scope,
    nameOrNode: ESTree.Identifier | string,
): eslint.Scope.Variable

export function isParenthesized(
    num: number,
    node: ESTree.Node,
    sourceCode: eslint.SourceCode,
): boolean
export function isParenthesized(
    node: ESTree.Node,
    sourceCode: eslint.SourceCode,
): boolean

export function getStringIfConstant(
    node: ESTree.Node,
    initialScope: eslint.Scope.Scope,
): string | null

export const READ: unique symbol,
    CALL: unique symbol,
    CONSTRUCT: unique symbol,
    ESM: unique symbol

export namespace TYPES {
    type TraceKind = {
        [READ]?: boolean
        [CALL]?: boolean
        [CONSTRUCT]?: boolean
        [ESM]?: boolean
    }
    type TraceMap = {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars -- :(
        [key: string]: TraceKind & TraceMap
    }
}

export class ReferenceTracker {
    public constructor(
        globalScope: eslint.Scope.Scope,
        options?: {
            mode?: "legacy" | "strict"
            globalObjectNames?: ("global" | "globalThis" | "self" | "window")[]
        },
    )

    public iterateGlobalReferences(
        traceMap: TYPES.TraceMap,
    ): IterableIterator<{
        node: ESTree.Node
        path: string[]
        type: symbol
        info: unknown
    }>

    public iterateCjsReferences(
        traceMap: TYPES.TraceMap,
    ): IterableIterator<{
        node: ESTree.Node
        path: string[]
        type: symbol
        info: unknown
    }>

    public iterateEsmReferences(
        traceMap: TYPES.TraceMap,
    ): IterableIterator<{
        node: ESTree.Node
        path: string[]
        type: symbol
        info: unknown
    }>
}
