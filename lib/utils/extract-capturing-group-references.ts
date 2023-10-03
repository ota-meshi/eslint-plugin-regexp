import type { Rule } from "eslint"
import type {
    ArrowFunctionExpression,
    CallExpression,
    Expression,
    FunctionExpression,
    Literal,
    MemberExpression,
    Pattern,
    RestElement,
} from "estree"
import type { ReadonlyFlags } from "regexp-ast-analysis"
import type { KnownMethodCall, PropertyReference } from "./ast-utils"
import {
    getParent,
    parseReplacements,
    getStaticValue,
    extractPropertyReferences,
    extractExpressionReferences,
    isKnownMethodCall,
} from "./ast-utils"
import { extractPropertyReferencesForPattern } from "./ast-utils/extract-property-references"
import { parseReplacementsForString } from "./replacements-utils"
import type { TypeTracker } from "./type-tracker"

export type UnknownUsage = {
    type: "UnknownUsage"
    node: Expression
    on?: "replace" | "replaceAll" | "matchAll"
}
export type WithoutRef = {
    type: "WithoutRef"
    node: Expression
    on:
        | "search"
        | "test"
        | "match"
        | "replace"
        | "replaceAll"
        | "matchAll"
        | "exec"
}
export type ArrayRef =
    | {
          type: "ArrayRef"
          kind: "index"
          ref: number | null /* null for unknown index access.  */
          prop: PropertyReference & { type: "member" | "destructuring" }
      }
    | {
          type: "ArrayRef"
          kind: "name"
          ref: string
          prop: PropertyReference & { type: "member" | "destructuring" }
      }
    | {
          type: "ArrayRef"
          kind: "name"
          ref: null /* null for unknown name access.  */
          prop: PropertyReference & { type: "unknown" | "iteration" }
      }
export type ReplacementRef =
    | {
          type: "ReplacementRef"
          kind: "index"
          ref: number
          range?: [number, number]
      }
    | {
          type: "ReplacementRef"
          kind: "name"
          ref: string
          range?: [number, number]
      }
export type ReplacerFunctionRef =
    | {
          type: "ReplacerFunctionRef"
          kind: "index"
          ref: number
          arg: Pattern
      }
    | {
          type: "ReplacerFunctionRef"
          kind: "name"
          ref: string
          prop: PropertyReference & { type: "member" | "destructuring" }
      }
    | {
          type: "ReplacerFunctionRef"
          kind: "name"
          ref: null /* null for unknown name access.  */
          prop: PropertyReference & { type: "unknown" | "iteration" }
          arg: null
      }
    | {
          type: "ReplacerFunctionRef"
          kind: "name"
          ref: null /* null for unknown name access.  */
          prop: null
          arg: Pattern
      }
    | {
          type: "ReplacerFunctionRef"
          kind: "unknown"
          ref: null /* null for unknown access.  */
          arg: Pattern
      }
export type Split = {
    type: "Split"
    node: CallExpression
}
export type UnknownRef =
    | {
          type: "UnknownRef"
          kind: "array"
          prop: PropertyReference & { type: "unknown" | "iteration" }
      }
    | {
          type: "UnknownRef"
          kind: "replacerFunction"
          arg: RestElement
      }
export type CapturingGroupReference =
    | ArrayRef
    | ReplacementRef
    | ReplacerFunctionRef
    | UnknownRef
    | WithoutRef
    | Split
    | UnknownUsage

type ExtractCapturingGroupReferencesContext = {
    flags: ReadonlyFlags
    countOfCapturingGroup: number
    context: Rule.RuleContext
    isString: (node: Expression) => boolean
}

type ArrayMethodName = Exclude<keyof unknown[], "length" | symbol | number>
const WELL_KNOWN_ARRAY_METHODS: {
    [key in ArrayMethodName]: {
        // If specified, the method receives a function that iterates the element.
        // Specify an array with the index of the argument that receives the element.
        elementParameters?: number[]
        result?:
            | "element" // The method returns the element.
            | "array" // The method returns an array with some of the elements.]
            | "iterator" // The method returns an iterator with some of the elements.
    }
} = {
    toString: {},
    toLocaleString: {},
    pop: { result: "element" },
    push: {},
    concat: { result: "array" },
    join: {},
    reverse: { result: "array" },
    shift: { result: "element" },
    slice: { result: "array" },
    sort: { elementParameters: [0, 1], result: "array" },
    splice: { result: "array" },
    unshift: {},
    indexOf: {},
    lastIndexOf: {},
    every: { elementParameters: [0] },
    some: { elementParameters: [0] },
    forEach: { elementParameters: [0] },
    map: { elementParameters: [0] },
    filter: { elementParameters: [0], result: "array" },
    reduce: { elementParameters: [1] },
    reduceRight: { elementParameters: [1] },
    // ES2015
    find: { elementParameters: [0], result: "element" },
    findIndex: { elementParameters: [0] },
    fill: {},
    copyWithin: { result: "array" },
    entries: {},
    keys: {},
    values: { result: "iterator" },
    // ES2016
    includes: {},
    // ES2019
    flatMap: { elementParameters: [0] },
    flat: {},
    // ES2022
    at: { result: "element" },
    // ES2023
    findLast: { elementParameters: [0], result: "element" },
    findLastIndex: { elementParameters: [0] },
    toReversed: { result: "array" },
    toSorted: { elementParameters: [0, 1], result: "array" },
    toSpliced: { result: "array" },
    with: { result: "array" },
}

/**
 * Extracts the usage of the capturing group.
 */
export function* extractCapturingGroupReferences(
    node: Expression,
    flags: ReadonlyFlags,
    typeTracer: TypeTracker,
    countOfCapturingGroup: number,
    context: Rule.RuleContext,
    options: {
        strictTypes: boolean
    },
): Iterable<CapturingGroupReference> {
    const ctx: ExtractCapturingGroupReferencesContext = {
        flags,
        countOfCapturingGroup,
        context,
        isString: options.strictTypes
            ? (n) => typeTracer.isString(n)
            : (n) => typeTracer.maybeString(n),
    }
    for (const ref of extractExpressionReferences(node, context)) {
        if (ref.type === "argument") {
            yield* iterateForArgument(ref.callExpression, ref.node, ctx)
        } else if (ref.type === "member") {
            yield* iterateForMember(ref.memberExpression, ref.node, ctx)
        } else {
            yield {
                type: "UnknownUsage",
                node: ref.node,
            }
        }
    }
}

/** Iterate the capturing group references for given argument expression node. */
function* iterateForArgument(
    callExpression: CallExpression,
    argument: Expression,
    ctx: ExtractCapturingGroupReferencesContext,
): Iterable<CapturingGroupReference> {
    if (
        !isKnownMethodCall(callExpression, {
            match: 1,
            search: 1,
            replace: 2,
            replaceAll: 2,
            matchAll: 1,
            split: 1,
        })
    ) {
        return
    }
    if (callExpression.arguments[0] !== argument) {
        return
    }
    if (!ctx.isString(callExpression.callee.object)) {
        yield {
            type: "UnknownUsage",
            node: argument,
        }
        return
    }

    if (callExpression.callee.property.name === "match") {
        yield* iterateForStringMatch(callExpression, argument, ctx)
    } else if (callExpression.callee.property.name === "search") {
        yield {
            type: "WithoutRef",
            node: argument,
            on: "search",
        }
    } else if (
        callExpression.callee.property.name === "replace" ||
        callExpression.callee.property.name === "replaceAll"
    ) {
        yield* iterateForStringReplace(
            callExpression,
            argument,
            ctx,
            callExpression.callee.property.name,
        )
    } else if (callExpression.callee.property.name === "matchAll") {
        yield* iterateForStringMatchAll(callExpression, argument, ctx)
    } else if (callExpression.callee.property.name === "split") {
        yield {
            type: "Split",
            node: callExpression,
        }
    }
}

/** Iterate the capturing group references for given member expression node. */
function* iterateForMember(
    memberExpression: MemberExpression,
    object: Expression,
    ctx: ExtractCapturingGroupReferencesContext,
): Iterable<CapturingGroupReference> {
    const parent = getCallExpressionFromCalleeExpression(memberExpression)
    if (
        !parent ||
        !isKnownMethodCall(parent, {
            test: 1,
            exec: 1,
        })
    ) {
        return
    }
    if (parent.callee.property.name === "test") {
        yield {
            type: "WithoutRef",
            node: object,
            on: "test",
        }
    } else if (parent.callee.property.name === "exec") {
        yield* iterateForRegExpExec(parent, object, ctx)
    }
}

/** Iterate the capturing group references for String.prototype.match(). */
function* iterateForStringMatch(
    node: KnownMethodCall,
    argument: Expression,
    ctx: ExtractCapturingGroupReferencesContext,
): Iterable<CapturingGroupReference> {
    if (ctx.flags.global) {
        // String.prototype.match() with g flag
        yield {
            type: "WithoutRef",
            node: argument,
            on: "match",
        }
    } else {
        // String.prototype.match() without g flag
        let useRet = false
        for (const ref of iterateForExecResult(node, ctx)) {
            useRet = true
            yield ref
        }
        if (!useRet) {
            yield {
                type: "WithoutRef",
                node: argument,
                on: "match",
            }
        }
    }
}

/** Iterate the capturing group references for String.prototype.replace() and String.prototype.replaceAll(). */
function* iterateForStringReplace(
    node: KnownMethodCall,
    argument: Expression,
    ctx: ExtractCapturingGroupReferencesContext,
    on: "replace" | "replaceAll",
): Iterable<CapturingGroupReference> {
    const replacementNode = node.arguments[1]
    if (
        replacementNode.type === "FunctionExpression" ||
        replacementNode.type === "ArrowFunctionExpression"
    ) {
        // replacer function
        yield* iterateForReplacerFunction(replacementNode, argument, on, ctx)
    } else {
        const replacement = node.arguments[1]
        if (!replacement) {
            yield {
                type: "UnknownUsage",
                node: argument,
                on,
            }
            return
        }
        if (replacement.type === "Literal") {
            yield* verifyForReplaceReplacementLiteral(
                replacement,
                argument,
                on,
                ctx,
            )
        } else {
            const evaluated = getStaticValue(ctx.context, replacement)
            if (!evaluated || typeof evaluated.value !== "string") {
                yield {
                    type: "UnknownUsage",
                    node: argument,
                    on,
                }
                return
            }
            yield* verifyForReplaceReplacement(evaluated.value, argument, on)
        }
    }
}

/** Iterate the capturing group references for String.prototype.matchAll(). */
function* iterateForStringMatchAll(
    node: CallExpression,
    argument: Expression,
    ctx: ExtractCapturingGroupReferencesContext,
): Iterable<CapturingGroupReference> {
    let useRet = false
    for (const iterationRef of extractPropertyReferences(node, ctx.context)) {
        if (!iterationRef.extractPropertyReferences) {
            useRet = true
            yield {
                type: "UnknownUsage",
                node: argument,
                on: "matchAll",
            }
            return
        }
        if (hasNameRef(iterationRef)) {
            if (
                iterationRef.type === "member" &&
                isWellKnownArrayMethodName(iterationRef.name)
            ) {
                const call = getCallExpressionFromCalleeExpression(
                    iterationRef.node,
                )
                if (call) {
                    for (const cgRef of iterateForArrayMethodOfStringMatchAll(
                        call,
                        iterationRef.name,
                        argument,
                        ctx,
                    )) {
                        useRet = true
                        yield cgRef
                        if (cgRef.type === "UnknownRef") {
                            return
                        }
                    }
                }
                continue
            }
            if (Number.isNaN(Number(iterationRef.name))) {
                // Not aimed to iteration.
                continue
            }
        }
        for (const ref of iterationRef.extractPropertyReferences()) {
            for (const cgRef of iterateForRegExpMatchArrayReference(ref)) {
                useRet = true
                yield cgRef
                if (cgRef.type === "UnknownRef") {
                    return
                }
            }
        }
    }
    if (!useRet) {
        yield {
            type: "WithoutRef",
            node: argument,
            on: "matchAll",
        }
    }
}

/** Iterate the capturing group references for RegExp.prototype.exec() . */
function* iterateForRegExpExec(
    node: KnownMethodCall,
    object: Expression,
    ctx: ExtractCapturingGroupReferencesContext,
): Iterable<CapturingGroupReference> {
    let useRet = false
    for (const ref of iterateForExecResult(node, ctx)) {
        useRet = true
        yield ref
    }
    if (!useRet) {
        yield {
            type: "WithoutRef",
            node: object,
            on: "exec",
        }
    }
}

/** Iterate the capturing group references for RegExp.prototype.exec() and String.prototype.match() result */
function* iterateForExecResult(
    node: KnownMethodCall,
    ctx: ExtractCapturingGroupReferencesContext,
): Iterable<CapturingGroupReference> {
    for (const ref of extractPropertyReferences(node, ctx.context)) {
        for (const cgRef of iterateForRegExpMatchArrayReference(ref)) {
            yield cgRef
            if (cgRef.type === "UnknownRef") {
                return
            }
        }
    }
}

/** Iterate the capturing group references for String.prototype.replace(regexp, "str") and String.prototype.replaceAll(regexp, "str") */
function* verifyForReplaceReplacementLiteral(
    substr: Literal,
    argument: Expression,
    on: "replace" | "replaceAll",
    ctx: ExtractCapturingGroupReferencesContext,
): Iterable<CapturingGroupReference> {
    let useReplacement = false
    for (const replacement of parseReplacements(ctx.context, substr)) {
        if (replacement.type === "ReferenceElement") {
            useReplacement = true
            if (typeof replacement.ref === "number") {
                yield {
                    type: "ReplacementRef",
                    kind: "index",
                    ref: replacement.ref,
                    range: replacement.range,
                }
            } else {
                yield {
                    type: "ReplacementRef",
                    kind: "name",
                    ref: replacement.ref,
                    range: replacement.range,
                }
            }
        }
    }
    if (!useReplacement) {
        yield {
            type: "WithoutRef",
            node: argument,
            on,
        }
    }
}

/** Iterate the capturing group references for String.prototype.replace(regexp, str) and String.prototype.replaceAll(regexp, str) */
function* verifyForReplaceReplacement(
    substr: string,
    argument: Expression,
    on: "replace" | "replaceAll",
): Iterable<CapturingGroupReference> {
    let useReplacement = false
    for (const replacement of parseReplacementsForString(substr)) {
        if (replacement.type === "ReferenceElement") {
            useReplacement = true
            if (typeof replacement.ref === "number") {
                yield {
                    type: "ReplacementRef",
                    kind: "index",
                    ref: replacement.ref,
                }
            } else {
                yield {
                    type: "ReplacementRef",
                    kind: "name",
                    ref: replacement.ref,
                }
            }
        }
    }
    if (!useReplacement) {
        yield {
            type: "WithoutRef",
            node: argument,
            on,
        }
    }
}

/** Iterate the capturing group references for String.prototype.replace(regexp, fn) and String.prototype.replaceAll(regexp, fn) */
function* iterateForReplacerFunction(
    replacementNode: FunctionExpression | ArrowFunctionExpression,
    argument: Expression,
    on: "replace" | "replaceAll",
    ctx: ExtractCapturingGroupReferencesContext,
): Iterable<CapturingGroupReference> {
    if (
        replacementNode.params.length < 2 &&
        !replacementNode.params.some((arg) => arg.type === "RestElement")
    ) {
        yield {
            type: "WithoutRef",
            node: argument,
            on,
        }
        return
    }
    for (let index = 0; index < replacementNode.params.length; index++) {
        const arg = replacementNode.params[index]
        if (arg.type === "RestElement") {
            yield {
                type: "UnknownRef",
                kind: "replacerFunction",
                arg,
            }
            return
        }
        if (index === 0) {
            continue
        } else if (index <= ctx.countOfCapturingGroup) {
            yield {
                type: "ReplacerFunctionRef",
                kind: "index",
                ref: index,
                arg,
            }
        } else if (ctx.countOfCapturingGroup + 3 === index) {
            if (arg.type === "Identifier" || arg.type === "ObjectPattern") {
                for (const ref of extractPropertyReferencesForPattern(
                    arg,
                    ctx.context,
                )) {
                    if (hasNameRef(ref)) {
                        yield {
                            type: "ReplacerFunctionRef",
                            kind: "name",
                            ref: ref.name,
                            prop: ref,
                        }
                    } else {
                        yield {
                            type: "ReplacerFunctionRef",
                            kind: "name",
                            ref: null,
                            prop: ref,
                            arg: null,
                        }
                    }
                }
            } else {
                yield {
                    type: "ReplacerFunctionRef",
                    kind: "name",
                    ref: null,
                    arg,
                    prop: null,
                }
            }
        }
    }
}

/** Iterate the capturing group references for RegExpMatchArray reference. */
function* iterateForRegExpMatchArrayReference(
    ref: PropertyReference,
): Iterable<CapturingGroupReference> {
    if (hasNameRef(ref)) {
        if (ref.name === "groups") {
            for (const namedRef of ref.extractPropertyReferences()) {
                yield getNamedArrayRef(namedRef)
            }
        } else {
            if (
                ref.name === "input" ||
                ref.name === "index" ||
                ref.name === "indices"
            ) {
                return
            }
            yield getIndexArrayRef(ref)
        }
    } else {
        yield {
            type: "UnknownRef",
            kind: "array",
            prop: ref,
        }
    }
}

/** Iterate the capturing group references for Array method of String.prototype.matchAll(). */
function* iterateForArrayMethodOfStringMatchAll(
    node: CallExpression,
    methodsName: ArrayMethodName,
    argument: Expression,
    ctx: ExtractCapturingGroupReferencesContext,
): Iterable<CapturingGroupReference> {
    const arrayMethod = WELL_KNOWN_ARRAY_METHODS[methodsName]
    if (
        arrayMethod.elementParameters &&
        node.arguments[0] &&
        (node.arguments[0].type === "FunctionExpression" ||
            node.arguments[0].type === "ArrowFunctionExpression")
    ) {
        const fnNode = node.arguments[0]
        for (const index of arrayMethod.elementParameters) {
            const param = fnNode.params[index]
            if (param) {
                for (const ref of extractPropertyReferencesForPattern(
                    param,
                    ctx.context,
                )) {
                    yield* iterateForRegExpMatchArrayReference(ref)
                }
            }
        }
    }
    if (arrayMethod.result) {
        if (arrayMethod.result === "element") {
            for (const ref of extractPropertyReferences(node, ctx.context)) {
                yield* iterateForRegExpMatchArrayReference(ref)
            }
        } else if (
            arrayMethod.result === "array" ||
            arrayMethod.result === "iterator"
        ) {
            yield* iterateForStringMatchAll(node, argument, ctx)
        }
    }
}

/** Checks whether the given reference is a named reference. */
function hasNameRef(
    ref: PropertyReference,
): ref is PropertyReference & { type: "member" | "destructuring" } {
    return ref.type === "destructuring" || ref.type === "member"
}

/** Get the index array ref from PropertyReference */
function getIndexArrayRef(
    ref: PropertyReference & { type: "member" | "destructuring" },
): CapturingGroupReference {
    const numRef = Number(ref.name)
    if (Number.isFinite(numRef)) {
        return {
            type: "ArrayRef",
            kind: "index",
            ref: numRef,
            prop: ref,
        }
    }
    return {
        type: "ArrayRef",
        kind: "index",
        ref: null,
        prop: ref,
    }
}

/** Get the named array ref from PropertyReference */
function getNamedArrayRef(
    namedRef: PropertyReference,
): CapturingGroupReference {
    if (hasNameRef(namedRef)) {
        return {
            type: "ArrayRef",
            kind: "name",
            ref: namedRef.name,
            prop: namedRef,
        }
    }
    // unknown used as name
    return {
        type: "ArrayRef",
        kind: "name",
        ref: null,
        prop: namedRef,
    }
}

/** Gets the CallExpression from the given callee node. */
function getCallExpressionFromCalleeExpression(
    expression: Expression,
): CallExpression | null {
    const parent = getParent(expression)
    if (
        !parent ||
        parent.type !== "CallExpression" ||
        parent.callee !== expression
    ) {
        return null
    }
    return parent
}

/** Checks whether the given name is a well known array method name. */
function isWellKnownArrayMethodName(name: string): name is ArrayMethodName {
    return Boolean(WELL_KNOWN_ARRAY_METHODS[name as ArrayMethodName])
}
