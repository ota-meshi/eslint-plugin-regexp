import {
    compositingVisitors,
    createRule,
    defineRegexpVisitor,
    FLAG_GLOBAL,
} from "../utils"
import type {
    CallExpression,
    Expression,
    Identifier,
    NewExpression,
    Node,
    RegExpLiteral,
    Statement,
} from "estree"
import type { KnownMethodCall } from "../utils/ast-utils"
import { findVariable, isKnownMethodCall } from "../utils/ast-utils"
import { createTypeTracker } from "../utils/type-tracker"

type CodePathStack = {
    codePathId: string
    upper: CodePathStack | null
    loopStack: Statement[]
}
type RegExpExpression = RegExpLiteral | NewExpression | CallExpression

/**
 * A key that identifies the code path and loop.
 * If there is a difference in this key between the definition location and the usage location,
 * it may have been used multiple times.
 */
type CodePathId = {
    codePathId: string
    loopNode: Statement | undefined
}

class GlobalRegExpData {
    public readonly defineNode: RegExpExpression

    private defineId?: CodePathId

    private readonly readNodes = new Map<
        Expression,
        {
            marked?: boolean
            usedInSearchOrSplit?: boolean
            usedInExecOrTest?: { id: CodePathId }
        }
    >()

    private readonly state = {
        used: false,
        track: true,
    }

    public constructor(defineNode: RegExpExpression) {
        this.defineNode = defineNode
    }

    public isNeedReport(): boolean {
        if (!this.readNodes.size) {
            // Unused variable
            return false
        }
        if (this.state.used) {
            // The global flag was used.
            return false
        }
        if (!this.state.track) {
            // There is expression node whose usage is unknown.
            return false
        }
        let countOfUsedInExecOrTest = 0
        for (const readData of this.readNodes.values()) {
            if (!readData.marked) {
                // There is expression node whose usage is unknown.
                return false
            }
            if (readData.usedInSearchOrSplit) {
                continue
            }
            if (readData.usedInExecOrTest) {
                if (!this.defineId) {
                    // The definition scope is unknown. Probably broken.
                    return false
                }
                if (
                    this.defineId.codePathId ===
                        readData.usedInExecOrTest.id.codePathId &&
                    this.defineId.loopNode ===
                        readData.usedInExecOrTest.id.loopNode
                ) {
                    countOfUsedInExecOrTest++
                    if (countOfUsedInExecOrTest > 1) {
                        // Multiple `exec` or `test` have been used.
                        return false
                    }
                    continue
                } else {
                    // Used `exec` or` test` in different scopes. It may be called multiple times.
                    return false
                }
            }
        }
        // Need to report
        return true
    }

    public pushReadNode(node: Expression) {
        this.readNodes.set(node, {})
    }

    public setDefineId(codePathId: string, loopNode: Statement | undefined) {
        this.defineId = { codePathId, loopNode }
    }

    public markAsUsedInSearchOrSplit(node: Expression) {
        const exprState = this.readNodes.get(node)
        if (exprState) {
            exprState.marked = true
            exprState.usedInSearchOrSplit = true
        }
    }

    public markAsUsedInExecOrTest(
        node: Expression,
        codePathId: string,
        loopNode: Statement | undefined,
    ) {
        const exprState = this.readNodes.get(node)
        if (exprState) {
            exprState.marked = true
            exprState.usedInExecOrTest = { id: { codePathId, loopNode } }
        }
    }

    public isUsed() {
        return this.state.used
    }

    public markAsUsed() {
        this.state.used = true
    }

    public markAsCannotTrack() {
        this.state.track = false
    }
}

/**
 * If the given expression node is assigned with a variable declaration, it returns the variable name node.
 */
function getVariableId(node: Expression) {
    const parent = getParent(node)
    if (
        !parent ||
        parent.type !== "VariableDeclarator" ||
        parent.init !== node ||
        parent.id.type !== "Identifier"
    ) {
        return null
    }
    const decl = getParent(parent)
    if (decl && decl.type === "VariableDeclaration" && decl.kind === "const") {
        return parent.id
    }
    return null
}

export default createRule("no-unused-global-flag", {
    meta: {
        docs: {
            description: "disallow unused global flag",
            recommended: false,
        },
        schema: [],
        messages: {
            unusedGlobalFlag:
                "'g' flag has been set, but not using global testing.",
        },
        type: "suggestion", // "problem",
    },
    create(context) {
        const typeTracer = createTypeTracker(context)
        const sourceCode = context.getSourceCode()

        let stack: CodePathStack | null = null

        const globalRegExpMap = new Map<Node, GlobalRegExpData>()
        const globalRegExpList: GlobalRegExpData[] = []

        /**
         * Report for unused
         */
        function reportUnused(globalRegExp: GlobalRegExpData) {
            const node = globalRegExp.defineNode
            let loc
            if (node.type === "Literal") {
                const gIndex =
                    node.range![1] -
                    node.regex.flags.length +
                    node.regex.flags.indexOf("g")
                loc = {
                    start: sourceCode.getLocFromIndex(gIndex),
                    end: sourceCode.getLocFromIndex(gIndex + 1),
                }
            } else {
                loc = node.arguments[1].loc!
            }
            context.report({
                node,
                loc,
                messageId: "unusedGlobalFlag",
            })
        }

        /**
         * Extract read references
         */
        function extractReadReferences(node: Identifier): Identifier[] {
            const references: Identifier[] = []
            const variable = findVariable(context, node)
            if (!variable) {
                return references
            }
            for (const reference of variable.references) {
                if (reference.isRead()) {
                    const id = getVariableId(reference.identifier)
                    if (id) {
                        references.push(...extractReadReferences(id))
                    } else {
                        references.push(reference.identifier)
                    }
                }
            }

            return references
        }

        /** Verify for String.prototype.search() or String.prototype.split() */
        function verifyForSearchOrSplit(node: KnownMethodCall) {
            const globalRegExp = globalRegExpMap.get(node.arguments[0])
            if (globalRegExp == null || globalRegExp.isUsed()) {
                return
            }
            if (!typeTracer.isString(node.callee.object)) {
                globalRegExp.markAsCannotTrack()
                return
            }
            // String.prototype.search() or String.prototype.split()
            globalRegExp.markAsUsedInSearchOrSplit(node.arguments[0])
        }

        /** Verify for RegExp.prototype.test() */
        function verifyForExecOrTest(node: KnownMethodCall) {
            const globalRegExp = globalRegExpMap.get(node.callee.object)
            if (globalRegExp == null || globalRegExp.isUsed()) {
                return
            }
            // RegExp.prototype.test()
            globalRegExp.markAsUsedInExecOrTest(
                node.callee.object,
                stack!.codePathId,
                stack!.loopStack[0],
            )
        }

        return compositingVisitors(
            defineRegexpVisitor(context, {
                createVisitor(
                    _node: Expression,
                    _pattern: string,
                    flags: string,
                    regexpNode: RegExpLiteral | NewExpression | CallExpression,
                ) {
                    if (flags.includes(FLAG_GLOBAL)) {
                        const globalRegExp = new GlobalRegExpData(regexpNode)
                        globalRegExpList.push(globalRegExp)
                        globalRegExpMap.set(regexpNode, globalRegExp)
                        const id = getVariableId(regexpNode)
                        if (id) {
                            const readReferences = extractReadReferences(id)
                            for (const ref of readReferences) {
                                globalRegExpMap.set(ref, globalRegExp)
                                globalRegExp.pushReadNode(ref)
                            }
                        } else {
                            globalRegExp.pushReadNode(regexpNode)
                        }
                    }
                    return {} // not visit RegExpNodes
                },
            }),
            {
                "Program:exit"() {
                    for (const globalRegExp of globalRegExpList) {
                        if (globalRegExp.isNeedReport()) {
                            reportUnused(globalRegExp)
                        }
                    }
                },
                onCodePathStart(codePath) {
                    stack = {
                        codePathId: codePath.id,
                        upper: stack,
                        loopStack: [],
                    }
                },
                onCodePathEnd() {
                    stack = stack?.upper ?? null
                },

                // Stacks the scope of the loop statement. e.g. `for ( target )`
                ["WhileStatement, DoWhileStatement, ForStatement, ForInStatement, ForOfStatement, " +
                // Stacks the scope of statement inside the loop statement. e.g. `for (;;) { target }`
                ":matches(WhileStatement, DoWhileStatement, ForStatement, ForInStatement, ForOfStatement) > :statement"](
                    node: Statement,
                ) {
                    stack?.loopStack.unshift(node)
                },

                ["WhileStatement, DoWhileStatement, ForStatement, ForInStatement, ForOfStatement, " +
                ":matches(WhileStatement, DoWhileStatement, ForStatement, ForInStatement, ForOfStatement) > :statement" +
                ":exit"]() {
                    stack?.loopStack.shift()
                },
                "Literal, NewExpression, CallExpression:exit"(node: Node) {
                    if (!stack) {
                        return
                    }
                    const globalRegExp = globalRegExpMap.get(node)
                    if (!globalRegExp || globalRegExp.defineNode !== node) {
                        return
                    }
                    globalRegExp.setDefineId(
                        stack.codePathId,
                        stack.loopStack[0],
                    )
                },
                "CallExpression:exit"(node: CallExpression) {
                    if (!stack) {
                        return
                    }
                    if (
                        !isKnownMethodCall(node, {
                            // marked as unused
                            search: 1,
                            split: 1,

                            // If called only once, it will be marked as unused.
                            test: 1,
                            exec: 1,

                            // marked as used
                            match: 1,
                            matchAll: 1,
                            replace: 2,
                            replaceAll: 2,
                        })
                    ) {
                        return
                    }
                    if (
                        node.callee.property.name === "search" ||
                        node.callee.property.name === "split"
                    ) {
                        verifyForSearchOrSplit(node)
                    } else if (
                        node.callee.property.name === "test" ||
                        node.callee.property.name === "exec"
                    ) {
                        verifyForExecOrTest(node)
                    } else if (
                        node.callee.property.name === "match" ||
                        node.callee.property.name === "matchAll" ||
                        node.callee.property.name === "replace" ||
                        node.callee.property.name === "replaceAll"
                    ) {
                        const globalRegExp = globalRegExpMap.get(
                            node.arguments[0],
                        )
                        globalRegExp?.markAsUsed()
                    }
                },
            },
        )
    },
})

/** Get a parent node */
function getParent<E extends Node>(node: Node | null): E | null {
    if (!node) {
        return null
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- ignore
    return (node as any).parent
}
