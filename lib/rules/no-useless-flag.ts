import type { RegExpContext } from "../utils"
import { compositingVisitors, createRule, defineRegexpVisitor } from "../utils"
import type {
    CallExpression,
    Expression,
    NewExpression,
    Node,
    RegExpLiteral,
    Statement,
} from "estree"
import type { KnownMethodCall } from "../utils/ast-utils"
import {
    isKnownMethodCall,
    extractExpressionReferences,
} from "../utils/ast-utils"
import { createTypeTracker } from "../utils/type-tracker"
import type { RuleListener } from "../types"
import type { Rule } from "eslint"

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

class RegExpReference {
    public readonly defineNode: RegExpExpression

    public defineId?: CodePathId

    public readonly readNodes = new Map<
        Expression,
        {
            marked?: boolean
            usedInSearch?: boolean
            usedInSplit?: boolean
            usedInExec?: { id: CodePathId }
            usedInTest?: { id: CodePathId }
        }
    >()

    private readonly state: {
        track: boolean
        usedIn: {
            search?: boolean
            split?: boolean
            exec?: boolean
            test?: boolean
            match?: boolean
            matchAll?: boolean
            replace?: boolean
            replaceAll?: boolean
        }
        hasUnusedExpression?: boolean
    } = {
        usedIn: {},
        track: true,
    }

    public constructor(defineNode: RegExpExpression) {
        this.defineNode = defineNode
    }

    public addReadNode(node: Expression) {
        this.readNodes.set(node, {})
    }

    public setDefineId(codePathId: string, loopNode: Statement | undefined) {
        this.defineId = { codePathId, loopNode }
    }

    public markAsUsedInSearch(node: Expression) {
        const exprState = this.readNodes.get(node)
        if (exprState) {
            exprState.marked = true
            exprState.usedInSearch = true
        }
        this.state.usedIn.search = true
    }

    public markAsUsedInSplit(node: Expression) {
        const exprState = this.readNodes.get(node)
        if (exprState) {
            exprState.marked = true
            exprState.usedInSplit = true
        }
        this.state.usedIn.split = true
    }

    public markAsUsedInExec(
        node: Expression,
        codePathId: string,
        loopNode: Statement | undefined,
    ) {
        const exprState = this.readNodes.get(node)
        if (exprState) {
            exprState.marked = true
            exprState.usedInExec = { id: { codePathId, loopNode } }
        }
        this.state.usedIn.exec = true
    }

    public markAsUsedInTest(
        node: Expression,
        codePathId: string,
        loopNode: Statement | undefined,
    ) {
        const exprState = this.readNodes.get(node)
        if (exprState) {
            exprState.marked = true
            exprState.usedInTest = { id: { codePathId, loopNode } }
        }
        this.state.usedIn.test = true
    }

    public isUsed(
        kinds: (
            | "search"
            | "split"
            | "exec"
            | "test"
            | "match"
            | "matchAll"
            | "replace"
            | "replaceAll"
        )[],
    ) {
        for (const kind of kinds) {
            if (this.state.usedIn[kind]) {
                return true
            }
        }
        return false
    }

    public isCannotTrack() {
        return !this.state.track
    }

    public markAsUsed(kind: "match" | "matchAll" | "replace" | "replaceAll") {
        this.state.usedIn[kind] = true
    }

    public markAsCannotTrack() {
        this.state.track = false
    }
}

/**
 * Gets the location for reporting the flag.
 */
function getFlagLocation(
    context: Rule.RuleContext,
    node: RegExpExpression,
    flag: "i" | "m" | "s" | "g" | "y",
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
    { flagsString, fixReplaceFlags }: RegExpContext,
    flag: "i" | "m" | "s" | "g",
) {
    if (flagsString) {
        return fixReplaceFlags(flagsString.replace(flag, ""))
    }
    return null
}

/**
 * Create visitor for verify unnecessary i flag
 */
function createUselessIgnoreCaseFlagVisitor(context: Rule.RuleContext) {
    return defineRegexpVisitor(context, {
        createVisitor(regExpContext: RegExpContext) {
            const { flags, regexpNode, toCharSet, ownsFlags } = regExpContext

            if (!flags.ignoreCase || !ownsFlags) {
                return {}
            }

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
                        if (toCharSet(cNode).size > 1) {
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
                            const caseInsensitive = toCharSet(cNode)
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
                            fix: fixRemoveFlag(regExpContext, "i"),
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
        createVisitor(regExpContext: RegExpContext) {
            const { flags, regexpNode, ownsFlags } = regExpContext

            if (!flags.multiline || !ownsFlags) {
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
                            fix: fixRemoveFlag(regExpContext, "m"),
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
        createVisitor(regExpContext: RegExpContext) {
            const { flags, regexpNode, ownsFlags } = regExpContext

            if (!flags.dotAll || !ownsFlags) {
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
                            fix: fixRemoveFlag(regExpContext, "s"),
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
    /**
     * Report for useless global flag
     */
    function reportUselessGlobalFlag(regExpReference: RegExpReference) {
        const node = regExpReference.defineNode
        context.report({
            node,
            loc: getFlagLocation(context, node, "g"),
            messageId: "uselessGlobalFlag",
        })
    }

    /**
     * Checks Check whether the flag needs to be reported.
     */
    function isNeedReport(regExpReference: RegExpReference): boolean {
        let countOfUsedInExecOrTest = 0
        for (const readData of regExpReference.readNodes.values()) {
            if (!readData.marked) {
                // There is expression node whose usage is unknown.
                return false
            }
            const usedInExecOrTest = readData.usedInExec || readData.usedInTest
            if (usedInExecOrTest) {
                if (!regExpReference.defineId) {
                    // The definition scope is unknown. Probably broken.
                    return false
                }
                if (
                    regExpReference.defineId.codePathId ===
                        usedInExecOrTest.id.codePathId &&
                    regExpReference.defineId.loopNode ===
                        usedInExecOrTest.id.loopNode
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

    return createRegExpReferenceExtractVisitor(context, {
        flag: "global",
        exit(regExpReferenceList) {
            for (const regExpReference of regExpReferenceList) {
                if (isNeedReport(regExpReference)) {
                    reportUselessGlobalFlag(regExpReference)
                }
            }
        },
        isUsedShortCircuit(regExpReference) {
            return regExpReference.isUsed([
                "match",
                "matchAll",
                "replace",
                "replaceAll",
            ])
        },
    })
}

/**
 * Create visitor for verify unnecessary y flag
 */
function createUselessStickyFlagVisitor(context: Rule.RuleContext) {
    /**
     * Report for useless sticky flag
     */
    function reportUselessGlobalFlag(regExpReference: RegExpReference) {
        const node = regExpReference.defineNode
        context.report({
            node,
            loc: getFlagLocation(context, node, "y"),
            messageId: "uselessStickyFlag",
        })
    }

    /**
     * Checks Check whether the flag needs to be reported.
     */
    function isNeedReport(regExpReference: RegExpReference): boolean {
        for (const readData of regExpReference.readNodes.values()) {
            if (!readData.marked) {
                // There is expression node whose usage is unknown.
                return false
            }
        }
        // Need to report
        return true
    }

    return createRegExpReferenceExtractVisitor(context, {
        flag: "sticky",
        exit(regExpReferenceList) {
            for (const regExpReference of regExpReferenceList) {
                if (isNeedReport(regExpReference)) {
                    reportUselessGlobalFlag(regExpReference)
                }
            }
        },
        isUsedShortCircuit(regExpReference) {
            return regExpReference.isUsed([
                "search",
                "exec",
                "test",
                "match",
                "matchAll",
                "replace",
                "replaceAll",
            ])
        },
    })
}

/**
 * Create a visitor that extracts RegExpReference.
 */
function createRegExpReferenceExtractVisitor(
    context: Rule.RuleContext,
    {
        flag,
        exit,
        isUsedShortCircuit,
    }: {
        flag: "global" | "sticky"
        exit: (list: RegExpReference[]) => void
        isUsedShortCircuit: (regExpReference: RegExpReference) => boolean
    },
) {
    const typeTracer = createTypeTracker(context)

    let stack: CodePathStack | null = null

    const regExpReferenceMap = new Map<Node, RegExpReference>()
    const regExpReferenceList: RegExpReference[] = []

    /** Verify for String.prototype.search() or String.prototype.split() */
    function verifyForSearchOrSplit(
        node: KnownMethodCall,
        kind: "search" | "split",
    ) {
        const regExpReference = regExpReferenceMap.get(node.arguments[0])
        if (regExpReference == null || isUsedShortCircuit(regExpReference)) {
            return
        }
        if (!typeTracer.isString(node.callee.object)) {
            regExpReference.markAsCannotTrack()
            return
        }
        if (kind === "search") {
            // String.prototype.search()
            regExpReference.markAsUsedInSearch(node.arguments[0])
        } else {
            // String.prototype.split()
            regExpReference.markAsUsedInSplit(node.arguments[0])
        }
    }

    /** Verify for RegExp.prototype.exec() or RegExp.prototype.test() */
    function verifyForExecOrTest(node: KnownMethodCall, kind: "exec" | "test") {
        const regExpReference = regExpReferenceMap.get(node.callee.object)
        if (regExpReference == null || isUsedShortCircuit(regExpReference)) {
            return
        }
        if (kind === "exec") {
            // RegExp.prototype.exec()
            regExpReference.markAsUsedInExec(
                node.callee.object,
                stack!.codePathId,
                stack!.loopStack[0],
            )
        } else {
            // RegExp.prototype.test()
            regExpReference.markAsUsedInTest(
                node.callee.object,
                stack!.codePathId,
                stack!.loopStack[0],
            )
        }
    }

    return compositingVisitors(
        defineRegexpVisitor(context, {
            createVisitor({ flags, regexpNode }: RegExpContext) {
                if (flags[flag]) {
                    const regExpReference = new RegExpReference(regexpNode)
                    regExpReferenceList.push(regExpReference)
                    regExpReferenceMap.set(regexpNode, regExpReference)
                    for (const ref of extractExpressionReferences(
                        regexpNode,
                        context,
                    )) {
                        if (ref.type === "argument" || ref.type === "member") {
                            regExpReferenceMap.set(ref.node, regExpReference)
                            regExpReference.addReadNode(ref.node)
                        } else {
                            regExpReference.markAsCannotTrack()
                        }
                    }
                }
                return {} // not visit RegExpNodes
            },
        }),
        {
            "Program:exit"() {
                exit(
                    regExpReferenceList.filter((regExpReference) => {
                        if (!regExpReference.readNodes.size) {
                            // Unused variable
                            return false
                        }
                        if (regExpReference.isCannotTrack()) {
                            // There is expression node whose usage is unknown.
                            return false
                        }
                        if (isUsedShortCircuit(regExpReference)) {
                            // The flag was used.
                            return false
                        }

                        return true
                    }),
                )
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
                const regExpReference = regExpReferenceMap.get(node)
                if (!regExpReference || regExpReference.defineNode !== node) {
                    return
                }
                regExpReference.setDefineId(
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
                    verifyForSearchOrSplit(node, node.callee.property.name)
                } else if (
                    node.callee.property.name === "test" ||
                    node.callee.property.name === "exec"
                ) {
                    verifyForExecOrTest(node, node.callee.property.name)
                } else if (
                    node.callee.property.name === "match" ||
                    node.callee.property.name === "matchAll" ||
                    node.callee.property.name === "replace" ||
                    node.callee.property.name === "replaceAll"
                ) {
                    const regExpReference = regExpReferenceMap.get(
                        node.arguments[0],
                    )
                    regExpReference?.markAsUsed(node.callee.property.name)
                }
            },
        },
    )
}

export default createRule("no-useless-flag", {
    meta: {
        docs: {
            description: "disallow unnecessary regex flags",
            category: "Best Practices",
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
                            enum: ["i", "m", "s", "g", "y"],
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
            uselessStickyFlag:
                "The 'y' flag is unnecessary because not using sticky search.",
        },
        type: "suggestion", // "problem",
    },
    create(context) {
        const ignore = new Set<"i" | "m" | "s" | "g" | "y">(
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
        if (!ignore.has("y")) {
            visitor = compositingVisitors(
                visitor,
                createUselessStickyFlagVisitor(context),
            )
        }
        return visitor
    },
})
