import type {
    ArrowFunctionExpression,
    CallExpression,
    Expression,
    FunctionExpression,
    Identifier,
    MemberExpression,
    NewExpression,
    RegExpLiteral,
    Node as ESTreeNode,
    Pattern,
    Property,
} from "estree"
import type { RegExpVisitor } from "regexpp/visitor"
import { createRule, defineRegexpVisitor, getRegexpLocation } from "../utils"
import { findVariable, isKnownMethodCall } from "../utils/ast-utils"
import { getStaticValue } from "eslint-utils"
import { createTypeTracker } from "../utils/type-tracker"
import type { CapturingGroup } from "regexpp/ast"
import { parseReplacementsForString } from "../utils/replacements-utils"
import type { Rule } from "eslint"

type CapturingData = {
    unused: Set<CapturingGroup>
    unusedIndexes: Map<number, CapturingGroup>
    unusedNames: Map<string, CapturingGroup[]>
    count: number
    node: Expression
    flags: string
}
type KnownCall = CallExpression & {
    callee: MemberExpression & { object: Expression; property: Identifier }
    arguments: Expression[]
}

/**
 * Get property from given node
 */
function getProperty(node: MemberExpression | Property): null | string {
    if (node.type === "MemberExpression") {
        if (node.computed) {
            if (node.property.type === "Literal") {
                if (
                    typeof node.property.value === "string" ||
                    typeof node.property.value === "number"
                )
                    return String(node.property.value)
            }
        } else if (node.property.type === "Identifier") {
            return node.property.name
        }
        return null
    }
    if (node.type === "Property") {
        if (node.computed) {
            if (node.key.type === "Literal") {
                if (
                    typeof node.key.value === "string" ||
                    typeof node.key.value === "number"
                )
                    return String(node.key.value)
            }
        } else if (node.key.type === "Identifier") {
            return node.key.name
        }
        return null
    }
    return null
}

type UsedReference = {
    ref: string
    node: Expression | Pattern
    getSubReferences: () => UsedReference[] | null
}

/**
 * Extract used references
 */
function extractUsedReferencesFromPattern(
    node: Pattern,
    context: Rule.RuleContext,
): UsedReference[] | null {
    const references: UsedReference[] = []

    if (node.type === "ArrayPattern") {
        for (let index = 0; index < node.elements.length; index++) {
            const element = node.elements[index]
            if (!element) {
                continue
            }
            if (element.type === "RestElement") {
                return null
            }
            references.push({
                ref: String(index),
                node: element,
                getSubReferences: () =>
                    extractUsedReferencesFromPattern(element, context),
            })
        }
        return references
    }
    if (node.type === "ObjectPattern") {
        for (const prop of node.properties) {
            if (prop.type === "RestElement") {
                return null
            }
            const property = getProperty(prop)
            if (property == null) return null
            references.push({
                ref: property,
                node: prop.value,
                getSubReferences: () =>
                    extractUsedReferencesFromPattern(prop.value, context),
            })
        }
        return references
    }
    if (node.type === "AssignmentPattern") {
        return extractUsedReferencesFromPattern(node.left, context)
    }
    if (node.type === "Identifier") {
        // Track vars
        const variable = findVariable(context, node)
        if (!variable) {
            return null
        }
        for (const reference of variable.references) {
            if (reference.isRead()) {
                const res = extractUsedReferencesFromExpression(
                    reference.identifier,
                    context,
                )
                if (res == null) {
                    return null
                }
                references.push(...res)
            }
        }
        return references
    }

    return null
}

/**
 * Extract used references
 */
function extractUsedReferencesFromExpression(
    node: Expression,
    context: Rule.RuleContext,
): UsedReference[] | null {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- ignore
    const parent: ESTreeNode = (node as any).parent
    if (parent.type === "MemberExpression") {
        if (parent.object !== node) {
            return null
        }
        const property = getProperty(parent)
        if (property == null) return null
        return [
            {
                ref: property,
                node: parent,
                getSubReferences: () =>
                    extractUsedReferencesFromExpression(parent, context),
            },
        ]
    } else if (parent.type === "AssignmentExpression") {
        if (parent.right !== node || parent.operator !== "=") {
            return null
        }
        return extractUsedReferencesFromPattern(parent.left, context)
    } else if (parent.type === "VariableDeclarator") {
        if (parent.init !== node) {
            return null
        }
        return extractUsedReferencesFromPattern(parent.id, context)
    }
    return null
}

export default createRule("no-unused-capturing-group", {
    meta: {
        docs: {
            description: "disallow unused capturing group",
            recommended: false,
        },
        schema: [],
        messages: {
            unusedCapturingGroup: "Capturing group is defined but never used.",
            unusedNamedCapturingGroup:
                "'{{name}}' capturing group is defined but never used.",
            unusedName:
                "'{{name}}' is defined for capturing group, but it name is never used.",
        },
        type: "suggestion", // "problem",
    },
    create(context) {
        const typeTracer = createTypeTracker(context)
        const sourceCode = context.getSourceCode()
        const capturingDataMap = new Map<Expression, CapturingData>()

        /**
         * Get CapturingData
         */
        function getCapturingData(node: Expression): CapturingData | null {
            const re = capturingDataMap.get(node)
            if (re) {
                return re
            }
            if (node.type === "Identifier") {
                const variable = findVariable(context, node)
                if (variable && variable.defs.length === 1) {
                    const def = variable.defs[0]
                    if (
                        def.type === "Variable" &&
                        def.parent.kind === "const" &&
                        def.node.init
                    ) {
                        return getCapturingData(def.node.init)
                    }
                }
            }

            return null
        }

        /**
         * Report
         */
        function report(
            cgNode: CapturingGroup,
            data: CapturingData,
            messageId: null | "unusedName",
        ) {
            context.report({
                node: data.node,
                loc: getRegexpLocation(sourceCode, data.node, cgNode),
                messageId:
                    messageId ??
                    (cgNode.name
                        ? "unusedNamedCapturingGroup"
                        : "unusedCapturingGroup"),
                data: cgNode.name ? { name: cgNode.name } : {},
            })
        }

        /**
         * Report for unused
         */
        function reportUnused(
            capturingData: CapturingData,
            unusedCapturingGroups: Set<CapturingGroup>,
            unusedNames: Map<string, CapturingGroup[]>,
        ) {
            for (const cgNode of unusedCapturingGroups) {
                report(cgNode, capturingData, null)
            }
            for (const cgNodes of unusedNames.values()) {
                for (const cgNode of cgNodes) {
                    if (unusedCapturingGroups.has(cgNode)) {
                        continue
                    }
                    report(cgNode, capturingData, "unusedName")
                }
            }
        }

        /** Verify for String.prototype.match() */
        function verifyForMatch(node: KnownCall) {
            const capturingData = getCapturingData(node.arguments[0])
            if (capturingData == null || !capturingData.unused.size) {
                return
            }
            if (!typeTracer.isString(node.callee.object)) {
                return
            }
            if (capturingData.flags.includes("g")) {
                // String.prototype.match() with g flag
                for (const cgNode of capturingData.unused) {
                    report(cgNode, capturingData, null)
                }
            } else {
                verifyForExecResult(node, capturingData)
            }
        }

        /** Verify for String.prototype.search() */
        function verifyForSearch(node: KnownCall) {
            const capturingData = getCapturingData(node.arguments[0])
            if (capturingData == null || !capturingData.unused.size) {
                return
            }
            if (!typeTracer.isString(node.callee.object)) {
                return
            }
            // String.prototype.search()
            for (const cgNode of capturingData.unused) {
                report(cgNode, capturingData, null)
            }
        }

        /** Verify for RegExp.prototype.test() */
        function verifyForTest(node: KnownCall) {
            const capturingData = getCapturingData(node.callee.object)
            if (capturingData == null || !capturingData.unused.size) {
                return
            }
            if (!typeTracer.isString(node.arguments[0])) {
                return
            }
            // RegExp.prototype.test()
            for (const cgNode of capturingData.unused) {
                report(cgNode, capturingData, null)
            }
        }

        /** Verify for String.prototype.replace() and String.prototype.replaceAll() */
        function verifyForReplace(node: KnownCall) {
            const capturingData = getCapturingData(node.arguments[0])
            if (capturingData == null || !capturingData.unused.size) {
                return
            }
            if (!typeTracer.isString(node.callee.object)) {
                return
            }
            const replacementNode = node.arguments[1]
            if (
                replacementNode.type === "FunctionExpression" ||
                replacementNode.type === "ArrowFunctionExpression"
            ) {
                verifyForReplaceFunction(replacementNode, capturingData)
            } else {
                const evaluated = getStaticValue(
                    node.arguments[1],
                    context.getScope(),
                )
                if (!evaluated || typeof evaluated.value !== "string") {
                    return
                }
                verifyForReplacePattern(evaluated.value, capturingData)
            }
        }

        /** Verify for String.prototype.replace(regexp, pattern) and String.prototype.replaceAll(regexp, pattern) */
        function verifyForReplacePattern(
            replacementPattern: string,
            capturingData: CapturingData,
        ) {
            const unusedCapturingGroups = new Set(capturingData.unused)
            const unusedNames = new Map(capturingData.unusedNames)
            for (const replacement of parseReplacementsForString(
                replacementPattern,
            )) {
                if (replacement.type === "ReferenceElement") {
                    if (typeof replacement.ref === "number") {
                        const cgNode = capturingData.unusedIndexes.get(
                            replacement.ref,
                        )
                        if (cgNode) {
                            unusedCapturingGroups.delete(cgNode)
                        }
                    } else {
                        const cgNodes = unusedNames.get(replacement.ref)
                        if (cgNodes) {
                            unusedNames.delete(replacement.ref)
                            for (const cgNode of cgNodes) {
                                unusedCapturingGroups.delete(cgNode)
                            }
                        }
                    }
                }
            }
            reportUnused(capturingData, unusedCapturingGroups, unusedNames)
        }

        /** Verify for String.prototype.replace(regexp, fn) and String.prototype.replaceAll(regexp, fn) */
        function verifyForReplaceFunction(
            replacementNode: FunctionExpression | ArrowFunctionExpression,
            capturingData: CapturingData,
        ) {
            const unusedCapturingGroups = new Set(capturingData.unused)
            const unusedNames = new Map(capturingData.unusedNames)

            for (
                let index = 0;
                index < replacementNode.params.length;
                index++
            ) {
                const arg = replacementNode.params[index]
                if (arg.type === "RestElement") {
                    return
                }
                if (index === 0) {
                    continue
                } else if (index <= capturingData.count) {
                    const cgNode = capturingData.unusedIndexes.get(index)
                    if (cgNode) {
                        unusedCapturingGroups.delete(cgNode)
                    }
                } else if (capturingData.count + 3 <= index) {
                    // used as name
                    for (const cgNodes of unusedNames.values()) {
                        for (const cgNode of cgNodes) {
                            unusedCapturingGroups.delete(cgNode)
                        }
                    }
                    unusedNames.clear()
                }
            }
            reportUnused(capturingData, unusedCapturingGroups, unusedNames)
        }

        /** Verify for RegExp.prototype.exec() */
        function verifyForExec(node: KnownCall) {
            const capturingData = getCapturingData(node.callee.object)
            if (capturingData == null || !capturingData.unused.size) {
                return
            }
            if (!typeTracer.isString(node.arguments[0])) {
                return
            }
            verifyForExecResult(node, capturingData)
        }

        /** Verify for RegExp.prototype.exec() and String.prototype.match() result */
        function verifyForExecResult(
            node: KnownCall,
            capturingData: CapturingData,
        ) {
            const refs = extractUsedReferencesFromExpression(node, context)
            if (refs == null) {
                return
            }
            const unusedCapturingGroups = new Set(capturingData.unused)
            const unusedNames = new Map(capturingData.unusedNames)
            for (const ref of refs) {
                if (ref.ref === "groups") {
                    const sub = ref.getSubReferences()
                    if (sub == null) {
                        // unknown used as name
                        for (const cgNodes of unusedNames.values()) {
                            for (const cgNode of cgNodes) {
                                unusedCapturingGroups.delete(cgNode)
                            }
                        }
                        unusedNames.clear()
                    } else {
                        for (const namedRef of sub) {
                            const cgNodes = unusedNames.get(namedRef.ref)
                            if (cgNodes) {
                                unusedNames.delete(namedRef.ref)
                                for (const cgNode of cgNodes) {
                                    unusedCapturingGroups.delete(cgNode)
                                }
                            }
                        }
                    }
                } else {
                    const cgNode = capturingData.unusedIndexes.get(
                        Number(ref.ref),
                    )
                    if (cgNode) {
                        unusedCapturingGroups.delete(cgNode)
                    }
                }
            }
            reportUnused(capturingData, unusedCapturingGroups, unusedNames)
        }

        /** Verify for String.prototype.matchAll() */
        function verifyForMatchAll(node: KnownCall) {
            const capturingData = getCapturingData(node.arguments[0])
            if (capturingData == null || !capturingData.unused.size) {
                return
            }
            if (!typeTracer.isString(node.callee.object)) {
                return
            }
            const refs = extractUsedReferencesForIteration(node)
            if (refs == null) {
                return
            }
            const unusedCapturingGroups = new Set(capturingData.unused)
            const unusedNames = new Map(capturingData.unusedNames)
            for (const ref of refs) {
                if (ref.ref === "groups") {
                    const sub = ref.getSubReferences()
                    if (sub == null) {
                        // unknown used as name
                        for (const cgNodes of unusedNames.values()) {
                            for (const cgNode of cgNodes) {
                                unusedCapturingGroups.delete(cgNode)
                            }
                        }
                        unusedNames.clear()
                    } else {
                        for (const namedRef of sub) {
                            const cgNodes = unusedNames.get(namedRef.ref)
                            if (cgNodes) {
                                unusedNames.delete(namedRef.ref)
                                for (const cgNode of cgNodes) {
                                    unusedCapturingGroups.delete(cgNode)
                                }
                            }
                        }
                    }
                } else {
                    const cgNode = capturingData.unusedIndexes.get(
                        Number(ref.ref),
                    )
                    if (cgNode) {
                        unusedCapturingGroups.delete(cgNode)
                    }
                }
            }
            reportUnused(capturingData, unusedCapturingGroups, unusedNames)

            /**
             * Extract used references
             */
            function extractUsedReferencesForIteration(
                expr: Expression,
            ): UsedReference[] | null {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any -- ignore
                const parent: ESTreeNode = (expr as any).parent
                if (parent.type === "AssignmentExpression") {
                    if (parent.right !== expr || parent.operator !== "=") {
                        return null
                    }
                    return extractUsedReferencesForIdIteration(parent.left)
                } else if (parent.type === "VariableDeclarator") {
                    if (parent.init !== expr) {
                        return null
                    }
                    return extractUsedReferencesForIdIteration(parent.id)
                } else if (parent.type === "ForOfStatement") {
                    if (parent.right !== expr) {
                        return null
                    }
                    let left = parent.left
                    if (left.type === "VariableDeclaration") {
                        left = left.declarations[0].id
                    }
                    return extractUsedReferencesFromPattern(left, context)
                }

                return null
            }

            /**
             * Extract used references
             */
            function extractUsedReferencesForIdIteration(
                ptn: Pattern,
            ): UsedReference[] | null {
                if (ptn.type === "Identifier") {
                    const references = []
                    // Track vars
                    const variable = findVariable(context, ptn)
                    if (!variable) {
                        return null
                    }
                    for (const reference of variable.references) {
                        if (reference.isRead()) {
                            const resForId = extractUsedReferencesForIteration(
                                reference.identifier,
                            )
                            if (resForId == null) {
                                return null
                            }
                            references.push(...resForId)
                        }
                    }
                    return references
                }

                return null
            }
        }

        /**
         * Create RegExp visitor
         * @param node
         */
        function createVisitor(
            node: Expression,
            _pattern: string,
            flags: string,
            regexpNode: RegExpLiteral | NewExpression | CallExpression,
        ): RegExpVisitor.Handlers {
            const capturingData: CapturingData = {
                unused: new Set(),
                unusedIndexes: new Map(),
                unusedNames: new Map(),
                count: 0,
                flags,
                node,
            }
            capturingDataMap.set(regexpNode, capturingData)
            return {
                onCapturingGroupEnter(cgNode) {
                    capturingData.count++

                    if (!cgNode.references.length) {
                        capturingData.unused.add(cgNode)
                        capturingData.unusedIndexes.set(
                            capturingData.count,
                            cgNode,
                        )
                    }
                    // used as reference
                    else if (
                        cgNode.references.some(
                            (ref) => typeof ref.ref === "string",
                        )
                    ) {
                        // reference name is used
                        return
                    }

                    if (cgNode.name) {
                        const array = capturingData.unusedNames.get(cgNode.name)
                        if (array) {
                            array.push(cgNode)
                        } else {
                            capturingData.unusedNames.set(cgNode.name, [cgNode])
                        }
                    }
                },
            }
        }

        return {
            ...defineRegexpVisitor(context, {
                createVisitor,
            }),
            "CallExpression:exit"(node: CallExpression) {
                if (
                    !isKnownMethodCall(node, {
                        match: 1,
                        test: 1,
                        search: 1,
                        replace: 2,
                        replaceAll: 2,
                        matchAll: 1,
                        exec: 1,
                    })
                ) {
                    return
                }
                if (node.callee.property.name === "match") {
                    verifyForMatch(node)
                } else if (node.callee.property.name === "test") {
                    verifyForTest(node)
                } else if (node.callee.property.name === "search") {
                    verifyForSearch(node)
                } else if (
                    node.callee.property.name === "replace" ||
                    node.callee.property.name === "replaceAll"
                ) {
                    verifyForReplace(node)
                } else if (node.callee.property.name === "exec") {
                    verifyForExec(node)
                } else if (node.callee.property.name === "matchAll") {
                    verifyForMatchAll(node)
                }
            },
        }
    },
})
