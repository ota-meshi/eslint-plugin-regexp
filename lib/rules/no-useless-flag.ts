import {
    compositingVisitors,
    createRule,
    defineRegexpVisitor,
    FLAG_DOTALL,
    FLAG_GLOBAL,
    FLAG_IGNORECASE,
    FLAG_MULTILINE,
    parseFlags,
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
import { findVariable, isKnownMethodCall, getParent } from "../utils/ast-utils"
import { createTypeTracker } from "../utils/type-tracker"
import type { RuleListener } from "../types"
import type { Rule } from "eslint"
import { toCharSet } from "regexp-ast-analysis"

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

/**
 * Gets the location for reporting the flag.
 */
function getFlagLocation(
    context: Rule.RuleContext,
    node: RegExpExpression,
    flag: "i" | "m" | "s" | "g",
) {
    const sourceCode = context.getSourceCode()
    if (node.type === "Literal") {
        const flagIndex =
            node.range![1] -
            node.regex.flags.length +
            node.regex.flags.indexOf(flag)
        return {
            start: sourceCode.getLocFromIndex(flagIndex),
            end: sourceCode.getLocFromIndex(flagIndex + 1),
        }
    }
    return node.arguments[1].loc!
}

/**
 * Returns a fixer that removes the given flag.
 */
function fixRemoveFlag(
    fixer: Rule.RuleFixer,
    node: RegExpExpression,
    flag: "i" | "m" | "s" | "g",
) {
    if (node.type === "Literal") {
        const flagIndex =
            node.range![1] -
            node.regex.flags.length +
            node.regex.flags.indexOf(flag)
        return fixer.removeRange([flagIndex, flagIndex + 1])
    }
    return null
}

/**
 * Create visitor for verify unnecessary i flag
 */
function createUselessIgnoreCaseFlagVisitor(context: Rule.RuleContext) {
    return defineRegexpVisitor(context, {
        createVisitor(
            _node: Expression,
            _pattern: string,
            flagsStr: string,
            regexpNode: RegExpLiteral | NewExpression | CallExpression,
        ) {
            if (!flagsStr.includes(FLAG_IGNORECASE)) {
                return {}
            }

            const flags = parseFlags(flagsStr)
            const flagsNoI = { ...flags, ignoreCase: false }

            let unnecessary = true
            return {
                onAssertionEnter(aNode) {
                    if (unnecessary) {
                        if (aNode.kind === "word" && flags.unicode) {
                            // \b is defined similarly to \w.
                            // same reason as for \w
                            unnecessary = false
                        }
                    }
                },
                onCharacterEnter(cNode) {
                    if (unnecessary) {
                        // all characters only accept themselves except if they
                        // are case sensitive
                        if (toCharSet(cNode, flags).size > 1) {
                            unnecessary = false
                        }
                    }
                },
                onCharacterSetEnter(cNode) {
                    if (unnecessary) {
                        if (cNode.kind === "word" && flags.unicode) {
                            // \w is defined as [0-9A-Za-z_] and this character
                            // class is case invariant in UTF16 (non-Unicode)
                            // mode. However, Unicode mode changes however
                            // ignore case works and this causes `/\w/u` and
                            // `/\w/iu` to accept different characters,
                            unnecessary = false
                        }
                        if (cNode.kind === "property") {
                            const caseInsensitive = toCharSet(cNode, flags)
                            const caseSensitive = toCharSet(cNode, flagsNoI)

                            if (!caseInsensitive.equals(caseSensitive)) {
                                unnecessary = false
                            }
                        }
                    }
                },
                onPatternLeave() {
                    if (unnecessary) {
                        context.report({
                            node: regexpNode,
                            loc: getFlagLocation(context, regexpNode, "i"),
                            messageId: "uselessIgnoreCaseFlag",
                            fix(fixer) {
                                return fixRemoveFlag(fixer, regexpNode, "i")
                            },
                        })
                    }
                },
            }
        },
    })
}

/**
 * Create visitor for verify unnecessary m flag
 */
function createUselessMultilineFlagVisitor(context: Rule.RuleContext) {
    return defineRegexpVisitor(context, {
        createVisitor(
            _node: Expression,
            _pattern: string,
            flags: string,
            regexpNode: RegExpLiteral | NewExpression | CallExpression,
        ) {
            if (!flags.includes(FLAG_MULTILINE)) {
                return {}
            }
            let unnecessary = true
            return {
                onAssertionEnter(node) {
                    if (node.kind === "start" || node.kind === "end") {
                        unnecessary = false
                    }
                },
                onPatternLeave() {
                    if (unnecessary) {
                        context.report({
                            node: regexpNode,
                            loc: getFlagLocation(context, regexpNode, "m"),
                            messageId: "uselessMultilineFlag",
                            fix(fixer) {
                                return fixRemoveFlag(fixer, regexpNode, "m")
                            },
                        })
                    }
                },
            }
        },
    })
}

/**
 * Create visitor for verify unnecessary s flag
 */
function createUselessDotAllFlagVisitor(context: Rule.RuleContext) {
    return defineRegexpVisitor(context, {
        createVisitor(
            _node: Expression,
            _pattern: string,
            flags: string,
            regexpNode: RegExpLiteral | NewExpression | CallExpression,
        ) {
            if (!flags.includes(FLAG_DOTALL)) {
                return {}
            }
            let unnecessary = true
            return {
                onCharacterSetEnter(node) {
                    if (node.kind === "any") {
                        unnecessary = false
                    }
                },
                onPatternLeave() {
                    if (unnecessary) {
                        context.report({
                            node: regexpNode,
                            loc: getFlagLocation(context, regexpNode, "s"),
                            messageId: "uselessDotAllFlag",
                            fix(fixer) {
                                return fixRemoveFlag(fixer, regexpNode, "s")
                            },
                        })
                    }
                },
            }
        },
    })
}

/**
 * Create visitor for verify unnecessary g flag
 */
function createUselessGlobalFlagVisitor(context: Rule.RuleContext) {
    const typeTracer = createTypeTracker(context)

    let stack: CodePathStack | null = null

    const globalRegExpMap = new Map<Node, GlobalRegExpData>()
    const globalRegExpList: GlobalRegExpData[] = []

    /**
     * Report for useless global flag
     */
    function reportUselessGlobalFlag(globalRegExp: GlobalRegExpData) {
        const node = globalRegExp.defineNode
        context.report({
            node,
            loc: getFlagLocation(context, node, "g"),
            messageId: "uselessGlobalFlag",
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
                        reportUselessGlobalFlag(globalRegExp)
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
                globalRegExp.setDefineId(stack.codePathId, stack.loopStack[0])
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
                    const globalRegExp = globalRegExpMap.get(node.arguments[0])
                    globalRegExp?.markAsUsed()
                }
            },
        },
    )
}

export default createRule("no-useless-flag", {
    meta: {
        docs: {
            description: "disallow unnecessary regex flags",
            // TODO Switch to recommended in the major version.
            // recommended: true,
            recommended: false,
            default: "warn",
        },
        fixable: "code",
        schema: [
            {
                type: "object",
                properties: {
                    ignore: {
                        type: "array",
                        items: {
                            enum: ["i", "m", "s", "g"],
                        },
                        uniqueItems: true,
                    },
                },
                additionalProperties: false,
            },
        ],
        messages: {
            uselessIgnoreCaseFlag:
                "The 'i' flag is unnecessary because the pattern only contains case-invariant characters.",
            uselessMultilineFlag:
                "The 'm' flag is unnecessary because the pattern does not contain start (^) or end ($) assertions.",
            uselessDotAllFlag:
                "The 's' flag is unnecessary because the pattern does not contain dots (.).",
            uselessGlobalFlag:
                "The 'g' flag is unnecessary because not using global testing.",
        },
        type: "suggestion", // "problem",
    },
    create(context) {
        const ignore = new Set<"i" | "m" | "s" | "g">(
            context.options[0]?.ignore ?? [],
        )

        let visitor: RuleListener = {}
        if (!ignore.has("i")) {
            visitor = compositingVisitors(
                visitor,
                createUselessIgnoreCaseFlagVisitor(context),
            )
        }
        if (!ignore.has("m")) {
            visitor = compositingVisitors(
                visitor,
                createUselessMultilineFlagVisitor(context),
            )
        }
        if (!ignore.has("s")) {
            visitor = compositingVisitors(
                visitor,
                createUselessDotAllFlagVisitor(context),
            )
        }
        if (!ignore.has("g")) {
            visitor = compositingVisitors(
                visitor,
                createUselessGlobalFlagVisitor(context),
            )
        }
        return visitor
    },
})
