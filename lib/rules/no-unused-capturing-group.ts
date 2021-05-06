import type {
    ArrowFunctionExpression,
    CallExpression,
    Expression,
    FunctionExpression,
    MemberExpression,
    Node as ESTreeNode,
    Pattern,
    Property,
} from "estree"
import type { RegExpVisitor } from "regexpp/visitor"
import type { RegExpContext } from "../utils"
import { createRule, defineRegexpVisitor, compositingVisitors } from "../utils"
import type { KnownMethodCall } from "../utils/ast-utils"
import {
    findVariable,
    isKnownMethodCall,
    getStaticValue,
} from "../utils/ast-utils"
import { createTypeTracker } from "../utils/type-tracker"
import type { CapturingGroup } from "regexpp/ast"
import { parseReplacementsForString } from "../utils/replacements-utils"
import type { Rule } from "eslint"

class CapturingData {
    private readonly unused = new Set<CapturingGroup>()

    private readonly unusedNames = new Map<string, CapturingGroup[]>()

    private readonly indexToCapturingGroup = new Map<number, CapturingGroup>()

    public countOfCapturingGroup = 0

    public readonly regexpContext: RegExpContext

    private readonly state = {
        used: false,
        track: true,
    }

    public constructor(regexpContext: RegExpContext) {
        this.regexpContext = regexpContext
    }

    public getUnused(): {
        unusedCapturingGroups: Set<CapturingGroup>
        unusedNames: Set<CapturingGroup & { name: string }>
    } {
        const unusedCapturingGroups = new Set(this.unused)
        const unusedNames = new Set<CapturingGroup & { name: string }>()

        for (const cgNodes of this.unusedNames.values()) {
            for (const cgNode of cgNodes) {
                if (!unusedCapturingGroups.has(cgNode)) {
                    unusedNames.add(cgNode as never)
                }
            }
        }
        return {
            unusedCapturingGroups,
            unusedNames,
        }
    }

    public usedIndex(ref: number) {
        const cgNode = this.indexToCapturingGroup.get(ref)
        if (cgNode) {
            this.unused.delete(cgNode)
        }
    }

    public usedName(ref: string) {
        const cgNodes = this.unusedNames.get(ref)
        if (cgNodes) {
            this.unusedNames.delete(ref)
            for (const cgNode of cgNodes) {
                this.unused.delete(cgNode)
            }
        }
    }

    public usedAllNames() {
        for (const cgNodes of this.unusedNames.values()) {
            for (const cgNode of cgNodes) {
                this.unused.delete(cgNode)
            }
        }
        this.unusedNames.clear()
    }

    public usedAllUnnamed() {
        this.unused.clear()
    }

    public isAllUsed() {
        return !this.unused.size && !this.unusedNames.size
    }

    public markAsUsed() {
        this.state.used = true
    }

    public markAsCannotTrack() {
        this.state.track = false
    }

    public isNeedReport() {
        return this.state.used && this.state.track && !this.isAllUsed()
    }

    public visitor(): RegExpVisitor.Handlers {
        return {
            onCapturingGroupEnter: (cgNode) => {
                this.countOfCapturingGroup++

                if (!cgNode.references.length) {
                    this.unused.add(cgNode)
                    this.indexToCapturingGroup.set(
                        this.countOfCapturingGroup,
                        cgNode,
                    )
                }
                // used as reference
                else if (
                    cgNode.references.some((ref) => typeof ref.ref === "string")
                ) {
                    // reference name is used
                    return
                }

                if (cgNode.name) {
                    const array = this.unusedNames.get(cgNode.name)
                    if (array) {
                        array.push(cgNode)
                    } else {
                        this.unusedNames.set(cgNode.name, [cgNode])
                    }
                }
            },
        }
    }
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
         * Report for unused
         */
        function reportUnused(capturingData: CapturingData) {
            const { node, getRegexpLocation } = capturingData.regexpContext
            const {
                unusedCapturingGroups,
                unusedNames,
            } = capturingData.getUnused()
            for (const cgNode of unusedCapturingGroups) {
                context.report({
                    node,
                    loc: getRegexpLocation(cgNode),
                    messageId: cgNode.name
                        ? "unusedNamedCapturingGroup"
                        : "unusedCapturingGroup",
                    data: cgNode.name ? { name: cgNode.name } : {},
                })
            }
            for (const cgNode of unusedNames) {
                context.report({
                    node,
                    loc: getRegexpLocation(cgNode),
                    messageId: "unusedName",
                    data: { name: cgNode.name },
                })
            }
        }

        /** Verify for String.prototype.match() */
        function verifyForMatch(node: KnownMethodCall) {
            const capturingData = getCapturingData(node.arguments[0])
            if (capturingData == null || capturingData.isAllUsed()) {
                return
            }
            if (!typeTracer.isString(node.callee.object)) {
                capturingData.markAsCannotTrack()
                return
            }
            if (capturingData.regexpContext.flags.global) {
                // String.prototype.match() with g flag
                capturingData.markAsUsed()
            } else {
                capturingData.markAsUsed()
                verifyForExecResult(node, capturingData)
            }
        }

        /** Verify for String.prototype.search() */
        function verifyForSearch(node: KnownMethodCall) {
            const capturingData = getCapturingData(node.arguments[0])
            if (capturingData == null || capturingData.isAllUsed()) {
                return
            }
            if (!typeTracer.isString(node.callee.object)) {
                capturingData.markAsCannotTrack()
                return
            }
            // String.prototype.search()
            capturingData.markAsUsed()
        }

        /** Verify for RegExp.prototype.test() */
        function verifyForTest(node: KnownMethodCall) {
            const capturingData = getCapturingData(node.callee.object)
            if (capturingData == null || capturingData.isAllUsed()) {
                return
            }
            // RegExp.prototype.test()
            capturingData.markAsUsed()
        }

        /** Verify for String.prototype.replace() and String.prototype.replaceAll() */
        function verifyForReplace(node: KnownMethodCall) {
            const capturingData = getCapturingData(node.arguments[0])
            if (capturingData == null || capturingData.isAllUsed()) {
                return
            }
            if (!typeTracer.isString(node.callee.object)) {
                capturingData.markAsCannotTrack()
                return
            }
            const replacementNode = node.arguments[1]
            if (
                replacementNode.type === "FunctionExpression" ||
                replacementNode.type === "ArrowFunctionExpression"
            ) {
                capturingData.markAsUsed()
                verifyForReplaceFunction(replacementNode, capturingData)
            } else {
                const evaluated = getStaticValue(context, node.arguments[1])
                if (!evaluated || typeof evaluated.value !== "string") {
                    capturingData.markAsCannotTrack()
                    return
                }
                capturingData.markAsUsed()
                verifyForReplacePattern(evaluated.value, capturingData)
            }
        }

        /** Verify for String.prototype.replace(regexp, pattern) and String.prototype.replaceAll(regexp, pattern) */
        function verifyForReplacePattern(
            replacementPattern: string,
            capturingData: CapturingData,
        ) {
            for (const replacement of parseReplacementsForString(
                replacementPattern,
            )) {
                if (replacement.type === "ReferenceElement") {
                    if (typeof replacement.ref === "number") {
                        capturingData.usedIndex(replacement.ref)
                    } else {
                        capturingData.usedName(replacement.ref)
                    }
                }
            }
        }

        /** Verify for String.prototype.replace(regexp, fn) and String.prototype.replaceAll(regexp, fn) */
        function verifyForReplaceFunction(
            replacementNode: FunctionExpression | ArrowFunctionExpression,
            capturingData: CapturingData,
        ) {
            for (
                let index = 0;
                index < replacementNode.params.length;
                index++
            ) {
                const arg = replacementNode.params[index]
                if (arg.type === "RestElement") {
                    capturingData.markAsCannotTrack()
                    return
                }
                if (index === 0) {
                    continue
                } else if (index <= capturingData.countOfCapturingGroup) {
                    capturingData.usedIndex(index)
                } else if (capturingData.countOfCapturingGroup + 3 <= index) {
                    // used as name
                    capturingData.usedAllNames()
                }
            }
        }

        /** Verify for RegExp.prototype.exec() */
        function verifyForExec(node: KnownMethodCall) {
            const capturingData = getCapturingData(node.callee.object)
            if (capturingData == null || capturingData.isAllUsed()) {
                return
            }
            capturingData.markAsUsed()
            verifyForExecResult(node, capturingData)
        }

        /** Verify for RegExp.prototype.exec() and String.prototype.match() result */
        function verifyForExecResult(
            node: KnownMethodCall,
            capturingData: CapturingData,
        ) {
            const refs = extractUsedReferencesFromExpression(node, context)
            if (refs == null) {
                capturingData.markAsCannotTrack()
                return
            }
            for (const ref of refs) {
                if (ref.ref === "groups") {
                    const sub = ref.getSubReferences()
                    if (sub == null) {
                        // unknown used as name
                        capturingData.usedAllNames()
                    } else {
                        for (const namedRef of sub) {
                            capturingData.usedName(namedRef.ref)
                        }
                    }
                } else {
                    capturingData.usedIndex(Number(ref.ref))
                }
            }
        }

        /** Verify for String.prototype.matchAll() */
        function verifyForMatchAll(node: KnownMethodCall) {
            const capturingData = getCapturingData(node.arguments[0])
            if (capturingData == null || capturingData.isAllUsed()) {
                return
            }
            if (!typeTracer.isString(node.callee.object)) {
                capturingData.markAsCannotTrack()
                return
            }
            capturingData.markAsUsed()
            const refs = extractUsedReferencesForIteration(node)
            if (refs == null) {
                capturingData.markAsCannotTrack()
                return
            }
            for (const ref of refs) {
                if (ref.ref === "groups") {
                    const sub = ref.getSubReferences()
                    if (sub == null) {
                        // unknown used as name
                        capturingData.usedAllNames()
                    } else {
                        for (const namedRef of sub) {
                            capturingData.usedName(namedRef.ref)
                        }
                    }
                } else {
                    capturingData.usedIndex(Number(ref.ref))
                }
            }

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

        /** Verify for String.prototype.split() */
        function verifyForSplit(node: KnownMethodCall) {
            const capturingData = getCapturingData(node.arguments[0])
            if (capturingData == null || capturingData.isAllUsed()) {
                return
            }
            if (!typeTracer.isString(node.callee.object)) {
                capturingData.markAsCannotTrack()
                return
            }
            capturingData.markAsUsed()
            capturingData.usedAllUnnamed()
        }

        /**
         * Create RegExp visitor
         */
        function createVisitor(
            regexpContext: RegExpContext,
        ): RegExpVisitor.Handlers {
            const { regexpNode } = regexpContext
            const capturingData = new CapturingData(regexpContext)
            capturingDataMap.set(regexpNode, capturingData)
            return capturingData.visitor()
        }

        return compositingVisitors(
            defineRegexpVisitor(context, {
                createVisitor,
            }),
            {
                "Program:exit"() {
                    for (const capturingData of capturingDataMap.values()) {
                        if (capturingData.isNeedReport()) {
                            reportUnused(capturingData)
                        }
                    }
                },
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
                            split: 1,
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
                    } else if (node.callee.property.name === "split") {
                        verifyForSplit(node)
                    }
                },
            },
        )
    },
})
