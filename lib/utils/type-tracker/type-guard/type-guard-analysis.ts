import type { Rule, SourceCode } from "eslint"
import type * as ES from "estree"
import { getParent, getStaticValue } from "../../ast-utils"
import type { TypeInfo } from "../type-data"
import {
    TypeUnionOrIntersection,
    STRING,
    NUMBER,
    BOOLEAN,
    BIGINT,
    UNKNOWN_FUNCTION,
    REGEXP,
    UNKNOWN_ARRAY,
    UNKNOWN_OBJECT,
    UNKNOWN_MAP,
    UNKNOWN_SET,
} from "../type-data"
import { findVariable, getPropertyName } from "../utils"
import type { CodePathContainer } from "./code-path-container"

const TYPE_STRING_TO_TYPE = new Map<unknown, TypeInfo>([
    ["string", STRING],
    ["number", NUMBER],
    ["boolean", BOOLEAN],
    ["bigint", BIGINT],
    ["undefined", "undefined"],
    ["function", UNKNOWN_FUNCTION],
])
const OBJECT_TO_TYPE = new Map<unknown, TypeInfo>([
    [String, STRING],
    [Number, NUMBER],
    [Boolean, BOOLEAN],
    [RegExp, REGEXP],
    [BigInt, BIGINT],
    [Array, UNKNOWN_ARRAY],
    [Object, UNKNOWN_OBJECT],
    [Function, UNKNOWN_FUNCTION],
    [Map, UNKNOWN_MAP],
    [Set, UNKNOWN_SET],
])

type TypeGuardExpressionData = {
    type: TypeInfo
    not: boolean
    unknownAlternate: boolean
    unknownConsequent: boolean
    node:
        | ES.BinaryExpression
        | ES.CallExpression
        | ES.UnaryExpression
        | ES.SwitchCase
}
export type TypeGuardData = {
    type: TypeInfo
    condition:
        | ES.IfStatement
        | ES.ConditionalExpression
        | ES.SwitchCase
        | ES.LogicalExpression
    consequent: (ES.Statement | ES.Expression)[]
    alternate: (ES.Statement | ES.Expression)[]
}

export class TypeGuardAnalysis {
    public readonly references: readonly (ES.Identifier | ES.MemberExpression)[]

    private readonly consequentBlockToTypeGuards = new Map<
        ES.Node,
        TypeGuardData[]
    >()

    private readonly alternateBlockToTypeGuards = new Map<
        ES.Node,
        TypeGuardData[]
    >()

    private readonly context: Rule.RuleContext

    private readonly codePathContainer: CodePathContainer

    public constructor(
        node: ES.Identifier | ES.MemberExpression,
        context: Rule.RuleContext,
        codePathContainer: CodePathContainer,
    ) {
        this.context = context
        this.codePathContainer = codePathContainer
        const references = (this.references = getReadReferences(node, context))
        const typeGuardExpressionDataList: TypeGuardExpressionData[] = []
        for (const ref of references) {
            typeGuardExpressionDataList.push(
                ...iterateTypeGuardExpressionData(ref, context),
            )
        }
        while (typeGuardExpressionDataList.length) {
            const typeGuardExpressionData = typeGuardExpressionDataList.pop()!
            const typeGuardData = getTypeGuardDataIfTypeGuard(
                typeGuardExpressionData,
                typeGuardExpressionDataList,
                context,
            )
            if (typeGuardData) {
                for (const consequent of typeGuardData.consequent) {
                    addToMap(
                        this.consequentBlockToTypeGuards,
                        consequent,
                        typeGuardData,
                    )
                }
                for (const alternate of typeGuardData.alternate) {
                    addToMap(
                        this.alternateBlockToTypeGuards,
                        alternate,
                        typeGuardData,
                    )
                }
            }
        }

        /** Add data to map */
        function addToMap<K, V>(map: Map<K, V[]>, key: K, value: V) {
            const values = map.get(key)
            if (values) {
                values.push(value)
            } else {
                map.set(key, [value])
            }
        }
    }

    public get _text(): string {
        // for debug
        return this.context.getSourceCode().text
    }

    /**
     * Gets the type of the given expression. The type is calculated by the type guard.
     */
    public getTypeGuardTypes(
        node: ES.Identifier | ES.MemberExpression,
    ): TypeInfo[] {
        const segment = this.codePathContainer.getExpressionSegment(node)
        if (segment) {
            // Parse consequent types
            const consequentTypes = this.getConsequentTypeGuardTypesFromSegment(
                segment,
                [],
            )
            // Parse alternate types
            const alternateTypes = this.getAlternateTypeGuardTypesFromSegment(
                segment,
                [],
            )
            if (consequentTypes.length === 0) {
                return alternateTypes
            }
            if (alternateTypes.length === 0) {
                return consequentTypes
            }
            return intersectTypes(consequentTypes, alternateTypes)
        }

        return []
    }

    private getConsequentTypeGuardTypesFromSegment(
        segment: Rule.CodePathSegment,
        segmentRoots: Rule.CodePathSegment[],
    ): TypeInfo[] {
        const types = this.getConsequentTypeGuardTypesFromSegmentBlock(segment)
        const prevTypes = this.getConsequentTypeGuardTypesFromPrevSegments(
            segment.prevSegments,
            [...segmentRoots, segment],
        )

        if (types.length === 0) {
            return prevTypes
        }
        if (prevTypes.length === 0) {
            return types
        }
        return intersectTypes(types, prevTypes)
    }

    private getConsequentTypeGuardTypesFromSegmentBlock(
        segment: Rule.CodePathSegment,
    ): TypeInfo[] {
        const types: TypeInfo[] = []
        const blocks = this.codePathContainer.getBlocks(segment)
        for (const block of blocks) {
            const consequentBlockTypeGuards = this.consequentBlockToTypeGuards.get(
                block,
            )
            if (consequentBlockTypeGuards) {
                types.push(...consequentBlockTypeGuards.map((g) => g.type))
            }
        }
        return types
    }

    private getConsequentTypeGuardTypesFromPrevSegments(
        prevSegments: Rule.CodePathSegment[],
        segmentRoots: Rule.CodePathSegment[],
    ): TypeInfo[] {
        let types: TypeInfo[] = []
        for (const prevSegment of prevSegments) {
            if (segmentRoots.includes(prevSegment)) {
                continue
            }
            const prevTypes = this.getConsequentTypeGuardTypesFromSegment(
                prevSegment,
                segmentRoots,
            )
            if (types.length === 0) {
                types = prevTypes
            } else {
                types = intersectTypes(types, prevTypes)
            }
            if (types.length === 0) {
                break
            }
        }
        return types
    }

    private getAlternateTypeGuardTypesFromSegment(
        segment: Rule.CodePathSegment,
        segmentRoots: Rule.CodePathSegment[],
    ): TypeInfo[] {
        let types: TypeInfo[] = []
        for (const prevSegment of segment.prevSegments) {
            if (segmentRoots.includes(prevSegment)) {
                continue
            }
            const prevTypes = this.getAlternateTypeGuardTypesFromPrevSegment(
                prevSegment,
                [...segmentRoots, segment],
            )
            if (types.length === 0) {
                types = prevTypes
            } else {
                types = intersectTypes(types, prevTypes)
            }
            if (types.length === 0) {
                break
            }
        }
        return types
    }

    private getAlternateTypeGuardTypesFromPrevSegment(
        prevSegment: Rule.CodePathSegment,
        segmentRoots: Rule.CodePathSegment[],
    ): TypeInfo[] {
        const checkedNext = new Set<Rule.CodePathSegment>()
        const nextSegments = prevSegment.nextSegments.filter(
            (next) => !segmentRoots.includes(next),
        )
        const types: TypeInfo[] = []
        while (nextSegments.length) {
            const next = nextSegments.shift()!
            if (checkedNext.has(next)) {
                continue
            }
            checkedNext.add(next)
            const blocks = this.codePathContainer.getBlocks(next)
            if (blocks.length === 0) {
                nextSegments.unshift(...next.nextSegments)
                continue
            }
            for (const block of blocks) {
                const alternateBlockTypeGuards = this.alternateBlockToTypeGuards.get(
                    block,
                )
                if (alternateBlockTypeGuards) {
                    types.push(...alternateBlockTypeGuards.map((g) => g.type))
                }
            }
        }
        types.push(
            ...this.getAlternateTypeGuardTypesFromSegment(
                prevSegment,
                segmentRoots,
            ),
        )
        return types
    }
}

/** Gets intersect types */
function intersectTypes(a: TypeInfo[], b: TypeInfo[]) {
    const result: TypeInfo[] = []
    for (const aType of a) {
        for (const bType of b) {
            const type = intersectType(aType, bType)
            if (type) {
                result.push(type)
                break
            }
        }
    }
    return result
}

/** Gets intersect type */
function intersectType(a: TypeInfo, b: TypeInfo) {
    if (a === b) {
        return a
    }
    if (typeof a === "string" || typeof b === "string") {
        return null
    }
    return a.intersect(b)
}

/* eslint-disable complexity -- X( */
/** Gets the read references from give node */
function getReadReferences(
    /* eslint-enable complexity -- X( */
    node: ES.Identifier | ES.MemberExpression,
    context: Rule.RuleContext,
): (ES.Identifier | ES.MemberExpression)[] {
    if (node.type === "Identifier") {
        return getReadReferencesFromIdentifier(node, context)
    }
    let target: ES.Expression | ES.Super = node
    const pathNames = []
    while (
        target.type !== "Identifier" &&
        target.type !== "ThisExpression" &&
        target.type !== "Super"
    ) {
        if (target.type === "ChainExpression") {
            target = target.expression
        } else if (target.type === "MemberExpression") {
            const name = getPropertyName(context, target)
            if (name === null) {
                return []
            }
            pathNames.unshift(name)
            target = target.object
        } else {
            return []
        }
    }
    let rootReferences
    if (target.type === "ThisExpression" || target.type === "Super") {
        rootReferences = getThisReferences(target, context)
    } else {
        rootReferences = getReadReferencesFromIdentifier(target, context)
    }
    const references: ES.MemberExpression[] = []
    for (const ref of rootReferences) {
        const paths = [...pathNames]
        let child:
            | ES.ThisExpression
            | ES.Identifier
            | ES.Super
            | ES.MemberExpression
            | ES.ChainExpression = ref
        let parent = getParent(child)
        while (parent) {
            if (parent.type === "MemberExpression") {
                if (parent.object !== child) {
                    break
                }
                const name = getPropertyName(context, parent)
                if (paths[0] !== name) {
                    break
                }
                paths.shift()
                if (paths.length === 0) {
                    break
                }
            } else if (parent.type !== "ChainExpression") {
                break
            }
            child = parent
            parent = getParent(child)
        }
        if (
            parent &&
            parent.type === "MemberExpression" &&
            paths.length === 0
        ) {
            references.push(parent)
        }
    }
    return references
}

/** Gets the read references from give identifier node */
function getReadReferencesFromIdentifier(
    node: ES.Identifier,
    context: Rule.RuleContext,
): ES.Identifier[] {
    const variable = findVariable(context, node)
    return (variable
        ? variable.references.filter((ref) => ref.isRead())
        : context
              .getSourceCode()
              .scopeManager.globalScope?.through.filter(
                  (t) => t.identifier.name === node.name && t.isRead(),
              ) ?? []
    ).map((ref) => ref.identifier)
}

/** Extract `this` or `super` references */
function getThisReferences(
    node: ES.ThisExpression | ES.Super,
    context: Rule.RuleContext,
): (ES.ThisExpression | ES.Super)[] {
    let parent = getParent(node)
    while (parent && !isFunctionOrProgram(parent)) {
        parent = getParent(parent)
    }
    const blocks = !parent
        ? []
        : Array.isArray(parent.body)
        ? parent.body
        : [parent.body]

    const results: (ES.ThisExpression | ES.Super)[] = []
    const visitorKeys = context.getSourceCode().visitorKeys || {}
    for (const block of blocks) {
        traverseBlocks(block, visitorKeys, {
            enterNode(n) {
                if (n.type === node.type) {
                    results.push(n)
                }
            },
        })
    }
    return results
}

/**
 * Traverse inside a given block. However, it does not traverse inside the function.
 */
function traverseBlocks(
    node: ES.Node | null,
    visitorKeys: SourceCode.VisitorKeys,
    visitor: {
        enterNode?: (node: ES.Node) => void
        leaveNode?: (node: ES.Node) => void
    },
) {
    const enter =
        visitor.enterNode ??
        (() => {
            /* noop */
        })
    const leave =
        visitor.leaveNode ??
        (() => {
            /* noop */
        })
    traverse(node)

    /** traverse */
    function traverse(n: ES.Node | null) {
        if (!n) {
            return
        }
        enter(n)
        const keys = visitorKeys[n.type] ?? []
        for (const key of keys) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any -- ignore
            const val = (n as any)[key]
            for (const child of Array.isArray(val) ? val : [val]) {
                traverse(child)
            }
        }

        leave(n)
    }
}

/** Checks whether given node is function */
function isFunctionOrProgram(node: ES.Node): node is ES.Function | ES.Program {
    return (
        node.type === "FunctionDeclaration" ||
        node.type === "FunctionExpression" ||
        node.type === "ArrowFunctionExpression" ||
        node.type === "Program"
    )
}

/* eslint-disable complexity -- X( */
/**
 * Iterates the type guard expression data if the given identifier is used for a type guard.
 */
function* iterateTypeGuardExpressionData(
    /* eslint-enable complexity -- X( */
    expr: ES.Identifier | ES.MemberExpression,
    context: Rule.RuleContext,
): Iterable<TypeGuardExpressionData> {
    let node: ES.Identifier | ES.MemberExpression | ES.ChainExpression = expr
    let parent = getParent(node)
    while (parent && parent.type === "ChainExpression") {
        node = parent
        parent = getParent(node)
    }
    if (!parent) {
        return
    }

    if (parent.type === "UnaryExpression") {
        // check for `if (typeof expr === 'string')`
        if (parent.operator !== "typeof" || !parent.prefix) {
            return
        }
        const pp = getParent(parent)
        if (isEqualsBinaryExpression(pp)) {
            const typeNode = pp.left === parent ? pp.right : pp.left
            yield* iterateTypeGuardExpressionDataFromExpression(
                pp,
                context,
                false,
                () => {
                    const typeString = getStaticValue(context, typeNode)
                    return TYPE_STRING_TO_TYPE.get(typeString?.value)
                },
            )
        } else if (pp?.type === "SwitchStatement") {
            yield* iterateTypeGuardExpressionDataFromSwitch(
                pp,
                false,
                (test) => {
                    const typeString = getStaticValue(context, test)
                    return TYPE_STRING_TO_TYPE.get(typeString?.value)
                },
            )
        }
    } else if (parent.type === "BinaryExpression") {
        if (parent.operator === "instanceof") {
            // check for `if (expr instanceof RegExp)`
            if (parent.left !== node) {
                return
            }
            const value = parent.right
            yield* iterateTypeGuardExpressionDataFromExpression(
                parent,
                context,
                false,
                () => {
                    const typeValue = getStaticValue(context, value)
                    return OBJECT_TO_TYPE.get(typeValue?.value)
                },
            )
        } else if (isEqualsBinaryExpression(parent)) {
            // check for `if (expr === 'str')`
            const value = parent.left === node ? parent.right : parent.left
            yield* iterateTypeGuardExpressionDataFromExpression(
                parent,
                context,
                true,
                () => {
                    const typeValue = getStaticValue(context, value)
                    return TYPE_STRING_TO_TYPE.get(
                        typeValue && typeof typeValue.value,
                    )
                },
            )
        }
    } else if (parent.type === "CallExpression") {
        // check for `if (Array.isArray(expr)`
        if (!parent.arguments.includes(node)) {
            return
        }
        const member = parent.callee
        yield* iterateTypeGuardExpressionDataFromExpression(
            parent,
            context,
            false,
            () => {
                if (
                    member.type !== "MemberExpression" ||
                    getPropertyName(context, member) !== "isArray"
                ) {
                    return null
                }
                if (getStaticValue(context, member.object)?.value !== Array) {
                    return null
                }
                return UNKNOWN_ARRAY
            },
        )
    } else if (parent.type === "SwitchStatement") {
        yield* iterateTypeGuardExpressionDataFromSwitch(
            parent,
            true,
            (test) => {
                const typeValue = getStaticValue(context, test)
                return TYPE_STRING_TO_TYPE.get(
                    typeValue && typeof typeValue.value,
                )
            },
        )
    }
}

/**
 * Iterates the type guard expression data from given node
 */
function* iterateTypeGuardExpressionDataFromExpression(
    node: ES.BinaryExpression | ES.CallExpression,
    context: Rule.RuleContext,
    startUnknownAlternate: boolean,
    getType: () => TypeInfo | null | undefined,
): Iterable<TypeGuardExpressionData> {
    let not =
        node.type === "BinaryExpression" &&
        (node.operator === "!==" || node.operator === "!=")
    let unknownAlternate = startUnknownAlternate
    let unknownConsequent = false
    let target:
        | ES.BinaryExpression
        | ES.CallExpression
        | ES.UnaryExpression = node
    let parent = getParent(target)
    while (parent) {
        if (
            isCondition(parent) ||
            (parent.type === "LogicalExpression" &&
                (parent.operator === "&&" || parent.operator === "||"))
        ) {
            const type = getType()
            if (type) {
                yield {
                    type,
                    not,
                    unknownAlternate,
                    unknownConsequent,
                    node: target,
                }
            }
            return
        }
        if (parent.type === "UnaryExpression") {
            if (!parent.prefix || parent.operator !== "!") {
                return
            }
            not = !not

            const wk: boolean = unknownConsequent
            unknownConsequent = unknownAlternate
            unknownAlternate = wk
        } else if (parent.type === "CallExpression") {
            if (
                !parent.arguments.includes(target) ||
                getStaticValue(context, parent.callee)?.value !== Boolean
            ) {
                return
            }
        } else {
            return
        }
        target = parent
        parent = getParent(target)
    }
}

/**
 * Iterates the type guard expression data from the given switch statement.
 */
function* iterateTypeGuardExpressionDataFromSwitch(
    statement: ES.SwitchStatement,
    unknownAlternate: boolean,
    getTestType: (test: ES.Expression) => TypeInfo | null | undefined,
): Iterable<TypeGuardExpressionData> {
    for (const condition of statement.cases) {
        if (condition.test) {
            const type = getTestType(condition.test)
            if (type) {
                yield {
                    type,
                    not: false,
                    unknownAlternate,
                    unknownConsequent: false,
                    node: condition,
                }
            }
        }
    }
}

/* eslint-disable complexity -- X( */
/**
 * Gets the type guard data if the given expression data is used for a type guard.
 */
function getTypeGuardDataIfTypeGuard(
    /* eslint-enable complexity -- X( */
    targetData: TypeGuardExpressionData,
    typeGuardExpressionDataList: TypeGuardExpressionData[],
    context: Rule.RuleContext,
): TypeGuardData | null {
    if (targetData.node.type === "SwitchCase") {
        return {
            type: targetData.type,
            condition: targetData.node,
            consequent: targetData.node.consequent,
            alternate: [],
        }
    }
    let type = targetData.type
    let not = targetData.not
    let unknownAlternate = targetData.unknownAlternate
    let unknownConsequent = targetData.unknownConsequent
    let target: ES.Node = targetData.node
    let parent = getParent(target)
    while (parent) {
        if (isCondition(parent)) {
            if (not) {
                // if (typeof a !== 'string') { /* not str path */ alternate; a } else { /* str path */ consequent; a }
                return {
                    type,
                    consequent:
                        !unknownConsequent && parent.alternate
                            ? [parent.alternate]
                            : [],
                    alternate: [parent.consequent],
                    condition: parent,
                }
            }

            // if (typeof a === 'string') { /* str path */ consequent; a } else { /* not str path */ alternate; a }
            return {
                type,
                consequent: [parent.consequent],
                alternate: [],
                condition: parent,
            }
        }
        if (parent.type === "UnaryExpression") {
            if (!parent.prefix || parent.operator !== "!") {
                return null
            }
            not = !not

            const wk: boolean = unknownConsequent
            unknownConsequent = unknownAlternate
            unknownAlternate = wk
        } else if (parent.type === "CallExpression") {
            if (
                !parent.arguments.includes(target) ||
                getStaticValue(context, parent.callee)?.value !== Boolean
            ) {
                return null
            }
        } else if (parent.type === "LogicalExpression") {
            if (parent.operator === "&&") {
                if (not) {
                    // if (typeof a !== 'string' && /* not str path */ other) { a } else { /* unknown path */ a }
                    // if (other && typeof a !== 'string') { /* not str path */ a } else { /* unknown path */ a }
                    return null
                }
                if (parent.left === target) {
                    // if (typeof a === 'string' && /* str path */ consequent) { a } else { /* not str path */ alternate; a } a
                    return {
                        type,
                        consequent: [parent.right],
                        alternate: [],
                        condition: parent,
                    }
                }

                // if (other && typeof a === 'string') { /* str path */ a } else { /* unknown path */ a }
                unknownAlternate = true
                if (unknownConsequent) {
                    return null
                }
            } else if (parent.operator === "||") {
                if (not) {
                    if (parent.left === target) {
                        // if (typeof a !== 'string' || /* str path */ a) { } else { /* unknown path */ a }
                        return {
                            type,
                            consequent: [parent.right],
                            alternate: [],
                            condition: parent,
                        }
                    }

                    // if (other || typeof a !== 'string') { /* not str path */ a } else { /* str path */ a }
                    unknownConsequent = true
                    if (unknownAlternate) {
                        return null
                    }
                } else {
                    const pair = getAndRemove(
                        parent.left === target ? parent.right : parent.left,
                    )
                    if (pair && !pair.not) {
                        const selfType = type
                        type = TypeUnionOrIntersection.buildType(function* () {
                            yield selfType
                            yield pair.type
                        })!
                    } else {
                        // if (typeof a === 'string' || /* not str path */ other) { a } else { /* unknown path */ a }
                        // if (other || typeof a === 'string') { /* unknown path */ a } else { /* unknown path */ a }
                        return null
                    }
                }
            } else {
                return null
            }
        } else {
            return null
        }
        target = parent
        parent = getParent(target)
    }
    return null

    /** Get data and remove data */
    function getAndRemove(e: ES.Expression) {
        for (
            let index = 0;
            index < typeGuardExpressionDataList.length;
            index++
        ) {
            const element = typeGuardExpressionDataList[index]
            if (element.node === e) {
                typeGuardExpressionDataList.splice(index, 1)
                return element
            }
        }
        return null
    }
}

/** Checks whether given node is condition */
function isCondition(
    node: ES.Node | null,
): node is ES.IfStatement | ES.ConditionalExpression {
    return Boolean(
        node &&
            (node.type === "IfStatement" ||
                node.type === "ConditionalExpression"),
    )
}

/** Checks whether given node is equals binary expression */
function isEqualsBinaryExpression(
    node: ES.Node | null,
): node is ES.BinaryExpression & { operator: "===" | "==" | "!==" | "!=" } {
    return Boolean(
        node &&
            node.type === "BinaryExpression" &&
            (node.operator === "===" ||
                node.operator === "==" ||
                node.operator === "!==" ||
                node.operator === "!="),
    )
}
