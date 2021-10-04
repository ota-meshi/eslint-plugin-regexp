import type { Rule } from "eslint"
import type * as TS from "typescript"
// eslint-disable-next-line @typescript-eslint/consistent-type-imports -- ignore
type TypeScript = typeof import("typescript")

/**
 * Get TypeScript tools
 */
export function getTypeScriptTools(
    context: Rule.RuleContext,
): {
    tsNodeMap: ReadonlyMap<unknown, TS.Node>
    checker: TS.TypeChecker
    usedTS: boolean
    hasFullTypeInformation: boolean
} {
    const ts = getTypeScript()
    const tsNodeMap: ReadonlyMap<unknown, TS.Node> =
        context.parserServices.esTreeNodeToTSNodeMap
    const checker: TS.TypeChecker =
        context.parserServices.program &&
        context.parserServices.program.getTypeChecker()
    const usedTS = Boolean(ts && tsNodeMap && checker)
    const hasFullTypeInformation =
        usedTS && context.parserServices.hasFullTypeInformation !== false

    return {
        tsNodeMap,
        checker,
        usedTS,
        hasFullTypeInformation,
    }
}

let cacheTypeScript: TypeScript | undefined
/**
 * Get TypeScript tools
 */
export function getTypeScript(): TypeScript | undefined {
    try {
        // eslint-disable-next-line @typescript-eslint/no-require-imports -- ignore
        return (cacheTypeScript ??= require("typescript"))
        // eslint-disable-next-line @typescript-eslint/no-explicit-any -- ignore
    } catch (e: any) {
        if (e.code === "MODULE_NOT_FOUND") {
            return undefined
        }
        throw e
    }
}

/**
 * Check if a given type is an array-like type or not.
 */
export function isArrayLikeObject(tsType: TS.Type): boolean {
    const ts = getTypeScript()!
    return (
        isObject(tsType) &&
        (tsType.objectFlags &
            (ts.ObjectFlags.ArrayLiteral |
                ts.ObjectFlags.EvolvingArray |
                ts.ObjectFlags.Tuple)) !==
            0
    )
}

/**
 * Check if a given type is an interface type or not.
 */
export function isClassOrInterface(
    tsType: TS.Type,
): tsType is TS.InterfaceType {
    const ts = getTypeScript()!
    return (
        isObject(tsType) &&
        (tsType.objectFlags & ts.ObjectFlags.ClassOrInterface) !== 0
    )
}

/**
 * Check if a given type is an object type or not.
 */
export function isObject(tsType: TS.Type): tsType is TS.ObjectType {
    const ts = getTypeScript()!
    return (tsType.flags & ts.TypeFlags.Object) !== 0
}

/**
 * Check if a given type is a reference type or not.
 */
export function isReferenceObject(tsType: TS.Type): tsType is TS.TypeReference {
    const ts = getTypeScript()!
    return (
        isObject(tsType) &&
        (tsType.objectFlags & ts.ObjectFlags.Reference) !== 0
    )
}

/**
 * Check if a given type is a union-or-intersection type or not.
 */
export function isUnionOrIntersection(
    tsType: TS.Type,
): tsType is TS.UnionOrIntersectionType {
    const ts = getTypeScript()!
    return (tsType.flags & ts.TypeFlags.UnionOrIntersection) !== 0
}
/**
 * Check if a given type is a type-parameter type or not.
 */
export function isTypeParameter(
    tsType: TS.Type,
): tsType is TS.UnionOrIntersectionType {
    const ts = getTypeScript()!
    return (tsType.flags & ts.TypeFlags.TypeParameter) !== 0
}

/**
 * Check if a given type is an any type or not.
 */
export function isAny(tsType: TS.Type): boolean {
    const ts = getTypeScript()!
    return (tsType.flags & ts.TypeFlags.Any) !== 0
}
/**
 * Check if a given type is an unknown type or not.
 */
export function isUnknown(tsType: TS.Type): boolean {
    const ts = getTypeScript()!
    return (tsType.flags & ts.TypeFlags.Unknown) !== 0
}
/**
 * Check if a given type is an string-like type or not.
 */
export function isStringLine(tsType: TS.Type): boolean {
    const ts = getTypeScript()!
    return (tsType.flags & ts.TypeFlags.StringLike) !== 0
}
/**
 * Check if a given type is an number-like type or not.
 */
export function isNumberLike(tsType: TS.Type): boolean {
    const ts = getTypeScript()!
    return (tsType.flags & ts.TypeFlags.NumberLike) !== 0
}
/**
 * Check if a given type is an boolean-like type or not.
 */
export function isBooleanLike(tsType: TS.Type): boolean {
    const ts = getTypeScript()!
    return (tsType.flags & ts.TypeFlags.BooleanLike) !== 0
}
/**
 * Check if a given type is an bigint-like type or not.
 */
export function isBigIntLike(tsType: TS.Type): boolean {
    const ts = getTypeScript()!
    return (tsType.flags & ts.TypeFlags.BigIntLike) !== 0
}
