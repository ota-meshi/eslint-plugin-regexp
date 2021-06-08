import type {
    ArrowFunctionExpression,
    CallExpression,
    Expression,
    FunctionExpression,
} from "estree"
import type { RegExpVisitor } from "regexpp/visitor"
import type { RegExpContext } from "../utils"
import { createRule, defineRegexpVisitor, compositingVisitors } from "../utils"
import type { KnownMethodCall } from "../utils/ast-utils"
import {
    isKnownMethodCall,
    getStaticValue,
    extractExpressionReferences,
    extractPropertyReferences,
} from "../utils/ast-utils"
import { createTypeTracker } from "../utils/type-tracker"
import type { CapturingGroup } from "regexpp/ast"
import { parseReplacementsForString } from "../utils/replacements-utils"

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

export default createRule("no-unused-capturing-group", {
    meta: {
        docs: {
            description: "disallow unused capturing group",
            category: "Best Practices",
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
            const capturingData = capturingDataMap.get(node.arguments[0])
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
            const capturingData = capturingDataMap.get(node.arguments[0])
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
            const capturingData = capturingDataMap.get(node.callee.object)
            if (capturingData == null || capturingData.isAllUsed()) {
                return
            }
            // RegExp.prototype.test()
            capturingData.markAsUsed()
        }

        /** Verify for String.prototype.replace() and String.prototype.replaceAll() */
        function verifyForReplace(node: KnownMethodCall) {
            const capturingData = capturingDataMap.get(node.arguments[0])
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
            const capturingData = capturingDataMap.get(node.callee.object)
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
            for (const ref of extractPropertyReferences(node, context)) {
                if (ref.type === "destructuring" || ref.type === "member") {
                    if (ref.ref === "groups") {
                        for (const namedRef of ref.references()) {
                            if (
                                namedRef.type === "destructuring" ||
                                namedRef.type === "member"
                            ) {
                                capturingData.usedName(namedRef.ref)
                            } else {
                                // unknown used as name
                                capturingData.usedAllNames()
                            }
                        }
                    } else {
                        capturingData.usedIndex(Number(ref.ref))
                    }
                } else {
                    capturingData.markAsCannotTrack()
                    return
                }
            }
        }

        /** Verify for String.prototype.matchAll() */
        function verifyForMatchAll(node: KnownMethodCall) {
            const capturingData = capturingDataMap.get(node.arguments[0])
            if (capturingData == null || capturingData.isAllUsed()) {
                return
            }
            if (!typeTracer.isString(node.callee.object)) {
                capturingData.markAsCannotTrack()
                return
            }
            capturingData.markAsUsed()
            for (const iterationRef of extractPropertyReferences(
                node,
                context,
            )) {
                if (iterationRef.type !== "iteration") {
                    capturingData.markAsCannotTrack()
                    return
                }
                for (const ref of iterationRef.references()) {
                    if (ref.type === "destructuring" || ref.type === "member") {
                        if (ref.ref === "groups") {
                            for (const namedRef of ref.references()) {
                                if (
                                    namedRef.type === "destructuring" ||
                                    namedRef.type === "member"
                                ) {
                                    capturingData.usedName(namedRef.ref)
                                } else {
                                    // unknown used as name
                                    capturingData.usedAllNames()
                                }
                            }
                        } else {
                            capturingData.usedIndex(Number(ref.ref))
                        }
                    } else {
                        capturingData.markAsCannotTrack()
                        return
                    }
                }
            }
        }

        /** Verify for String.prototype.split() */
        function verifyForSplit(node: KnownMethodCall) {
            const capturingData = capturingDataMap.get(node.arguments[0])
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
            for (const ref of extractExpressionReferences(
                regexpNode,
                context,
            )) {
                if (ref.type === "argument" || ref.type === "member") {
                    capturingDataMap.set(ref.node, capturingData)
                } else {
                    capturingData.markAsCannotTrack()
                }
            }
            return capturingData.visitor()
        }

        return compositingVisitors(
            defineRegexpVisitor(context, {
                createVisitor,
            }),
            {
                "Program:exit"() {
                    for (const capturingData of new Set(
                        capturingDataMap.values(),
                    )) {
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
