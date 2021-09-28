import type {
    ArrowFunctionExpression,
    CallExpression,
    Expression,
    FunctionExpression,
} from "estree"
import type { RegExpVisitor } from "regexpp/visitor"
import type { RegExpContext } from "../utils"
import { createRule, defineRegexpVisitor, compositingVisitors } from "../utils"
import type { KnownMethodCall, PropertyReference } from "../utils/ast-utils"
import {
    isKnownMethodCall,
    getStaticValue,
    extractExpressionReferences,
    extractPropertyReferences,
} from "../utils/ast-utils"
import { createTypeTracker } from "../utils/type-tracker"
import type { CapturingGroup, Pattern } from "regexpp/ast"
import { parseReplacementsForString } from "../utils/replacements-utils"
import { getCapturingGroupNumber } from "regexp-ast-analysis"
import { visitRegExpAST } from "regexpp"

type MethodKind =
    | "match"
    | "matchAll"
    | "search"
    | "test"
    | "replace"
    | "replaceAll"
    | "exec"
    | "split"

class CapturingData {
    private readonly unused = new Set<CapturingGroup>()

    private readonly unusedNames = new Map<string, CapturingGroup[]>()

    private readonly indexToCapturingGroup = new Map<number, CapturingGroup>()

    public countOfCapturingGroup = 0

    public readonly regexpContext: RegExpContext

    private readonly state = {
        usedMethods: new Map<MethodKind, KnownMethodCall[]>(),
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

    public markAsUsed(kind: MethodKind, node: KnownMethodCall) {
        const list = this.state.usedMethods.get(kind)
        if (list) {
            list.push(node)
        } else {
            this.state.usedMethods.set(kind, [node])
        }
    }

    public markAsCannotTrack() {
        this.state.track = false
    }

    public isNeedReport() {
        return (
            this.state.usedMethods.size && this.state.track && !this.isAllUsed()
        )
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

    /**
     * Returns `true` if used only in `replace` or `replaceAll` method with replacer function.
     *
     * e.g.
     * "foo".replace(/regex/, function(foo) {
     *   return foo + foo
     * })
     */
    public isOnlyUsedReplaceWithFunction() {
        for (const [kind, nodes] of this.state.usedMethods) {
            if (kind !== "replace" && kind !== "replaceAll") {
                return false
            }

            // Check if the argument is only replacer function.
            for (const node of nodes) {
                const argNode = node.arguments[1]
                if (!argNode) {
                    return false
                }
                if (
                    argNode.type !== "FunctionExpression" &&
                    argNode.type !== "ArrowFunctionExpression"
                ) {
                    return false
                }
            }
        }
        return true
    }
}

/**
 * Returns an identifier for the given capturing group.
 *
 * This is either the name of the group or its number.
 */
function getCapturingGroupIdentifier(group: CapturingGroup): string {
    if (group.name) {
        return `'${group.name}'`
    }
    return `number ${getCapturingGroupNumber(group)}`
}

/** Returns a list of all capturing groups in the order of their numbers. */
function getAllCapturingGroups(pattern: Pattern): CapturingGroup[] {
    const groups: CapturingGroup[] = []

    visitRegExpAST(pattern, {
        onCapturingGroupEnter(group) {
            groups.push(group)
        },
    })

    // visitRegExpAST given no guarantees in which order nodes are visited.
    // Sort the list to guarantee order.
    groups.sort((a, b) => a.start - b.start)

    return groups
}

export default createRule("no-unused-capturing-group", {
    meta: {
        docs: {
            description: "disallow unused capturing group",
            category: "Best Practices",
            recommended: true,
        },
        fixable: "code",
        schema: [
            {
                type: "object",
                properties: {
                    fixable: { type: "boolean" },
                    ignoreUnusedNameWhenReplaceWithFunction: {
                        type: "boolean",
                    },
                },
                additionalProperties: false,
            },
        ],
        messages: {
            unusedCapturingGroup:
                "Capturing group {{identifier}} is defined but never used.",
            unusedName:
                "Capturing group {{identifier}} has a name, but its name is never used.",

            // suggestions
            makeNonCapturing: "Making this a non-capturing group.",
            removeName: "Remove the unused name.",
        },
        type: "suggestion", // "problem",
        hasSuggestions: true,
    },
    create(context) {
        const fixable: boolean = context.options[0]?.fixable ?? false
        const ignoreUnusedNameWhenReplaceWithFunction: boolean =
            context.options[0]?.ignoreUnusedNameWhenReplaceWithFunction ?? true

        const typeTracer = createTypeTracker(context)
        const capturingDataMap = new Map<Expression, CapturingData>()

        /**
         * Report for unused
         */
        function reportUnused(capturingData: CapturingData) {
            const {
                node,
                getRegexpLocation,
                fixReplaceNode,
                patternAst,
            } = capturingData.regexpContext
            const {
                unusedCapturingGroups,
                unusedNames,
            } = capturingData.getUnused()

            const fixableGroups = new Set<CapturingGroup>()
            for (const group of getAllCapturingGroups(patternAst).reverse()) {
                if (unusedCapturingGroups.has(group)) {
                    fixableGroups.add(group)
                } else {
                    break
                }
            }

            for (const cgNode of unusedCapturingGroups) {
                const fix = fixableGroups.has(cgNode)
                    ? fixReplaceNode(
                          cgNode,
                          cgNode.raw.replace(/^\((?:\?<[^<>]+>)?/, "(?:"),
                      )
                    : null

                context.report({
                    node,
                    loc: getRegexpLocation(cgNode),
                    messageId: "unusedCapturingGroup",
                    data: { identifier: getCapturingGroupIdentifier(cgNode) },
                    fix: fixable ? fix : null,
                    suggest: fix
                        ? [{ messageId: "makeNonCapturing", fix }]
                        : null,
                })
            }

            if (
                ignoreUnusedNameWhenReplaceWithFunction &&
                capturingData.isOnlyUsedReplaceWithFunction()
            ) {
                return
            }

            for (const cgNode of unusedNames) {
                const fix = fixReplaceNode(
                    cgNode,
                    cgNode.raw.replace(/^\(\?<[^<>]+>/, "("),
                )

                context.report({
                    node,
                    loc: getRegexpLocation(cgNode),
                    messageId: "unusedName",
                    data: { identifier: getCapturingGroupIdentifier(cgNode) },
                    fix: fixable ? fix : null,
                    suggest: [{ messageId: "removeName", fix }],
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
                capturingData.markAsUsed("match", node)
            } else {
                capturingData.markAsUsed("match", node)
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
            capturingData.markAsUsed("search", node)
        }

        /** Verify for RegExp.prototype.test() */
        function verifyForTest(node: KnownMethodCall) {
            const capturingData = capturingDataMap.get(node.callee.object)
            if (capturingData == null || capturingData.isAllUsed()) {
                return
            }
            // RegExp.prototype.test()
            capturingData.markAsUsed("test", node)
        }

        /** Verify for String.prototype.replace() and String.prototype.replaceAll() */
        function verifyForReplace(
            node: KnownMethodCall,
            kind: "replace" | "replaceAll",
        ) {
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
                capturingData.markAsUsed(kind, node)
                verifyForReplaceFunction(replacementNode, capturingData)
            } else {
                const evaluated = getStaticValue(context, node.arguments[1])
                if (!evaluated || typeof evaluated.value !== "string") {
                    capturingData.markAsCannotTrack()
                    return
                }
                capturingData.markAsUsed(kind, node)
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
            capturingData.markAsUsed("exec", node)
            verifyForExecResult(node, capturingData)
        }

        /** Verify for RegExp.prototype.exec() and String.prototype.match() result */
        function verifyForExecResult(
            node: KnownMethodCall,
            capturingData: CapturingData,
        ) {
            for (const ref of extractPropertyReferences(node, context)) {
                if (hasNameRef(ref)) {
                    if (ref.name === "groups") {
                        for (const namedRef of ref.extractPropertyReferences()) {
                            if (hasNameRef(namedRef)) {
                                capturingData.usedName(namedRef.name)
                            } else {
                                // unknown used as name
                                capturingData.usedAllNames()
                            }
                        }
                    } else {
                        capturingData.usedIndex(Number(ref.name))
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
            capturingData.markAsUsed("matchAll", node)
            for (const iterationRef of extractPropertyReferences(
                node,
                context,
            )) {
                if (!iterationRef.extractPropertyReferences) {
                    capturingData.markAsCannotTrack()
                    return
                }
                if (hasNameRef(iterationRef)) {
                    if (Number.isNaN(Number(iterationRef.name))) {
                        // Not aimed to iteration.
                        continue
                    }
                }
                for (const ref of iterationRef.extractPropertyReferences()) {
                    if (hasNameRef(ref)) {
                        if (ref.name === "groups") {
                            for (const namedRef of ref.extractPropertyReferences()) {
                                if (hasNameRef(namedRef)) {
                                    capturingData.usedName(namedRef.name)
                                } else {
                                    // unknown used as name
                                    capturingData.usedAllNames()
                                }
                            }
                        } else {
                            capturingData.usedIndex(Number(ref.name))
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
            capturingData.markAsUsed("split", node)
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
                        verifyForReplace(node, node.callee.property.name)
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

/** Checks whether the given reference is a named reference. */
function hasNameRef(
    ref: PropertyReference,
): ref is PropertyReference & { type: "member" | "destructuring" } {
    return ref.type === "destructuring" || ref.type === "member"
}
