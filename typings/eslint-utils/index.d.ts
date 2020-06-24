import type * as ESTree from "estree"
import eslint from "eslint"

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

export namespace TYPES {
    type TraceKind = {
        [READ]?: boolean
        [CALL]?: boolean
        [CONSTRUCT]?: boolean
        [ESM]?: boolean
    }
    type TraceMap = {
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
        info: any
    }>
    public iterateCjsReferences(
        traceMap: TYPES.TraceMap,
    ): IterableIterator<{
        node: ESTree.Node
        path: string[]
        type: symbol
        info: any
    }>
    public iterateEsmReferences(
        traceMap: TYPES.TraceMap,
    ): IterableIterator<{
        node: ESTree.Node
        path: string[]
        type: symbol
        info: any
    }>
}

export const READ: unique symbol
export const CALL: unique symbol
export const CONSTRUCT: unique symbol
export const ESM: unique symbol
