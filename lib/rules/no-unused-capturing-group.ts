import type {
    ArrowFunctionExpression,
    CallExpression,
    Expression,
    FunctionExpression,
    Identifier,
    MemberExpression,
    NewExpression,
    RegExpLiteral,
} from "estree"
import type { RegExpVisitor } from "regexpp/visitor"
import { createRule, defineRegexpVisitor, getRegexpLocation } from "../utils"
import { isKnownMethodCall } from "../utils/ast-utils"
import { getStaticValue } from "eslint-utils"
import { createTypeTracker } from "../utils/type-tracker"
import type { CapturingGroup } from "regexpp/ast"
import { parseReplacementsForString } from "../utils/replacements-utils"

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
                    messageId ?? cgNode.name
                        ? "unusedNamedCapturingGroup"
                        : "unusedCapturingGroup",
                data: cgNode.name ? { name: cgNode.name } : {},
            })
        }

        /** Verify for String.prototype.match() */
        function verifyForMatch(node: KnownCall) {
            const capturingData = capturingDataMap.get(node.arguments[0])
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
                // TODO
            }
        }

        /** Verify for String.prototype.search() */
        function verifyForSearch(node: KnownCall) {
            const capturingData = capturingDataMap.get(node.arguments[0])
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
            const capturingData = capturingDataMap.get(node.callee.object)
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
            const capturingData = capturingDataMap.get(node.arguments[0])
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
            for (const cgNode of unusedCapturingGroups) {
                unusedNames.delete(cgNode.name!)
                report(cgNode, capturingData, null)
            }
            for (const cgNodes of unusedNames.values()) {
                for (const cgNode of cgNodes) {
                    report(cgNode, capturingData, "unusedName")
                }
            }
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

            for (const cgNode of unusedCapturingGroups) {
                unusedNames.delete(cgNode.name!)
                report(cgNode, capturingData, null)
            }
            for (const cgNodes of unusedNames.values()) {
                for (const cgNode of cgNodes) {
                    report(cgNode, capturingData, "unusedName")
                }
            }
        }

        /** Verify for RegExp.prototype.exec() */
        function verifyForExec(_node: KnownCall) {
            // TODO
        }

        /** Verify for String.prototype.matchAll() */
        function verifyForMatchAll(_node: KnownCall) {
            // TODO
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
