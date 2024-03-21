import type { RegExpContext, RegExpContextForSource } from "../utils"
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
    getFlagsRange,
    getFlagsLocation,
} from "../utils/ast-utils"
import { createTypeTracker } from "../utils/type-tracker"
import type { RuleListener } from "../types"
import type { Rule } from "eslint"
import { isCaseVariant } from "../utils/regexp-ast"

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

type RegExpMethodKind =
    | "search"
    | "split"
    | "exec"
    | "test"
    | "match"
    | "matchAll"
    | "replace"
    | "replaceAll"

class RegExpReference {
    public readonly regExpContext: RegExpContext

    public get defineNode(): RegExpExpression {
        return this.regExpContext.regexpNode
    }

    public defineId?: CodePathId

    public readonly readNodes = new Map<
        Expression,
        {
            marked?: boolean
            usedInExec?: { id: CodePathId }
            usedInTest?: { id: CodePathId }
        }
    >()

    private readonly state: {
        track: boolean
        usedNodes: Map<RegExpMethodKind, Expression[]>
        hasUnusedExpression?: boolean
    } = {
        usedNodes: new Map(),
        track: true,
    }

    public constructor(regExpContext: RegExpContext) {
        this.regExpContext = regExpContext
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
        }
        this.addUsedNode("search", node)
    }

    public markAsUsedInSplit(node: Expression) {
        const exprState = this.readNodes.get(node)
        if (exprState) {
            exprState.marked = true
        }
        this.addUsedNode("split", node)
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
        this.addUsedNode("exec", node)
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
        this.addUsedNode("test", node)
    }

    public isUsed(kinds: RegExpMethodKind[]) {
        for (const kind of kinds) {
            if (this.state.usedNodes.has(kind)) {
                return true
            }
        }
        return false
    }

    public isCannotTrack() {
        return !this.state.track
    }

    public markAsUsed(
        kind: "match" | "matchAll" | "replace" | "replaceAll",
        exprNode: Expression,
    ) {
        this.addUsedNode(kind, exprNode)
    }

    public markAsCannotTrack() {
        this.state.track = false
    }

    public getUsedNodes() {
        return this.state.usedNodes
    }

    private addUsedNode(kind: RegExpMethodKind, exprNode: Expression) {
        const list = this.state.usedNodes.get(kind)
        if (list) {
            list.push(exprNode)
        } else {
            this.state.usedNodes.set(kind, [exprNode])
        }
    }
}

/**
 * Returns a fixer that removes the given flag.
 */
function fixRemoveFlag(
    { flagsString, fixReplaceFlags }: RegExpContext,
    flag: "i" | "m" | "s" | "g" | "y",
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
            const { flags, regexpNode, ownsFlags, getFlagLocation } =
                regExpContext

            if (!flags.ignoreCase || !ownsFlags) {
                return {}
            }

            return {
                onPatternLeave(pattern) {
                    if (!isCaseVariant(pattern, flags, false)) {
                        context.report({
                            node: regexpNode,
                            loc: getFlagLocation("i"),
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
            const { flags, regexpNode, ownsFlags, getFlagLocation } =
                regExpContext

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
                            loc: getFlagLocation("m"),
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
            const { flags, regexpNode, ownsFlags, getFlagLocation } =
                regExpContext

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
                            loc: getFlagLocation("s"),
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
function createUselessGlobalFlagVisitor(
    context: Rule.RuleContext,
    strictTypes: boolean,
) {
    const enum ReportKind {
        // It is used only in "split".
        usedOnlyInSplit,
        // It is used only in "search".
        usedOnlyInSearch,
        // It is used only once in "exec".
        usedOnlyOnceInExec,
        // It is used only once in "test".
        usedOnlyOnceInTest,
        // The global flag is given, but it is not used.
        unused,
    }

    type ReportData = { kind: ReportKind; fixable?: boolean }

    /**
     * Report for useless global flag
     */
    function reportUselessGlobalFlag(
        regExpReference: RegExpReference,
        data: ReportData,
    ) {
        const { getFlagLocation } = regExpReference.regExpContext
        const node = regExpReference.defineNode

        context.report({
            node,
            loc: getFlagLocation("g"),
            messageId:
                data.kind === ReportKind.usedOnlyInSplit
                    ? "uselessGlobalFlagForSplit"
                    : data.kind === ReportKind.usedOnlyInSearch
                      ? "uselessGlobalFlagForSearch"
                      : data.kind === ReportKind.usedOnlyOnceInTest
                        ? "uselessGlobalFlagForTest"
                        : data.kind === ReportKind.usedOnlyOnceInExec
                          ? "uselessGlobalFlagForExec"
                          : "uselessGlobalFlag",
            fix: data.fixable
                ? fixRemoveFlag(regExpReference.regExpContext, "g")
                : null,
        })
    }

    /**
     * Checks if it needs to be reported and returns the report data if it needs to be reported.
     */
    function getReportData(
        regExpReference: RegExpReference,
    ): null | ReportData {
        let countOfUsedInExecOrTest = 0
        for (const readData of regExpReference.readNodes.values()) {
            if (!readData.marked) {
                // There is expression node whose usage is unknown.
                return null
            }
            const usedInExecOrTest = readData.usedInExec || readData.usedInTest
            if (usedInExecOrTest) {
                if (!regExpReference.defineId) {
                    // The definition scope is unknown. Probably broken.
                    return null
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
                        return null
                    }
                    continue
                } else {
                    // Used `exec` or` test` in different scopes. It may be called multiple times.
                    return null
                }
            }
        }
        // Need to report
        return buildReportData(regExpReference)
    }

    function buildReportData(regExpReference: RegExpReference) {
        const usedNodes = regExpReference.getUsedNodes()
        if (usedNodes.size === 1) {
            const [[method, nodes]] = usedNodes
            // Make it fixable only if the regex is used directly.
            const fixable =
                nodes.length === 1 && nodes.includes(regExpReference.defineNode)
            if (method === "split") {
                return {
                    kind: ReportKind.usedOnlyInSplit,
                    fixable,
                }
            }
            if (method === "search") {
                return { kind: ReportKind.usedOnlyInSearch, fixable }
            }
            if (method === "exec" && nodes.length === 1)
                return { kind: ReportKind.usedOnlyOnceInExec, fixable }
            if (method === "test" && nodes.length === 1)
                return { kind: ReportKind.usedOnlyOnceInTest, fixable }
        }
        return { kind: ReportKind.unused }
    }

    return createRegExpReferenceExtractVisitor(context, {
        flag: "global",
        exit(regExpReferenceList) {
            for (const regExpReference of regExpReferenceList) {
                const report = getReportData(regExpReference)
                if (report != null) {
                    reportUselessGlobalFlag(regExpReference, report)
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
        strictTypes,
    })
}

/**
 * Create visitor for verify unnecessary y flag
 */
function createUselessStickyFlagVisitor(
    context: Rule.RuleContext,
    strictTypes: boolean,
) {
    type ReportData = { fixable?: boolean }

    /**
     * Report for useless sticky flag
     */
    function reportUselessStickyFlag(
        regExpReference: RegExpReference,
        data: ReportData,
    ) {
        const { getFlagLocation } = regExpReference.regExpContext
        const node = regExpReference.defineNode

        context.report({
            node,
            loc: getFlagLocation("y"),
            messageId: "uselessStickyFlag",
            fix: data.fixable
                ? fixRemoveFlag(regExpReference.regExpContext, "y")
                : null,
        })
    }

    /**
     * Checks if it needs to be reported and returns the report data if it needs to be reported.
     */
    function getReportData(
        regExpReference: RegExpReference,
    ): null | ReportData {
        for (const readData of regExpReference.readNodes.values()) {
            if (!readData.marked) {
                // There is expression node whose usage is unknown.
                return null
            }
        } // Need to report
        return buildReportData(regExpReference)
    }

    function buildReportData(regExpReference: RegExpReference) {
        const usedNodes = regExpReference.getUsedNodes()
        if (usedNodes.size === 1) {
            const [[method, nodes]] = usedNodes
            // Make it fixable only if the regex is used directly.
            const fixable =
                nodes.length === 1 && nodes.includes(regExpReference.defineNode)
            if (method === "split") {
                return {
                    fixable,
                }
            }
        }
        return {}
    }

    return createRegExpReferenceExtractVisitor(context, {
        flag: "sticky",
        exit(regExpReferenceList) {
            for (const regExpReference of regExpReferenceList) {
                const report = getReportData(regExpReference)
                if (report != null) {
                    reportUselessStickyFlag(regExpReference, report)
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
        strictTypes,
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
        strictTypes,
    }: {
        flag: "global" | "sticky"
        exit: (list: RegExpReference[]) => void
        isUsedShortCircuit: (regExpReference: RegExpReference) => boolean
        strictTypes: boolean
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
        if (
            strictTypes
                ? !typeTracer.isString(node.callee.object)
                : !typeTracer.maybeString(node.callee.object)
        ) {
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
            createVisitor(regExpContext: RegExpContext) {
                const { flags, regexpNode } = regExpContext
                if (flags[flag]) {
                    const regExpReference = new RegExpReference(regExpContext)
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
                    regExpReference?.markAsUsed(
                        node.callee.property.name,
                        node.arguments[0],
                    )
                }
            },
        },
    )
}

/**
 * Create visitor for verify unnecessary flags of owned RegExp literals
 */
function createOwnedRegExpFlagsVisitor(context: Rule.RuleContext) {
    const sourceCode = context.sourceCode

    /** Remove the flags of the given literal */
    function removeFlags(node: RegExpLiteral): void {
        // The u flag is relevant for parsing the literal, so
        // we can't just remove it and potentially create
        // invalid source code.
        const newFlags = node.regex.flags.replace(/[^u]+/gu, "")
        if (newFlags === node.regex.flags) {
            return
        }

        context.report({
            node,
            loc: getFlagsLocation(sourceCode, node, node),
            messageId: "uselessFlagsOwned",
            fix(fixer) {
                const range = getFlagsRange(node)
                return fixer.replaceTextRange(range, newFlags)
            },
        })
    }

    return defineRegexpVisitor(context, {
        createSourceVisitor(regExpContext: RegExpContextForSource) {
            const { patternSource, regexpNode } = regExpContext

            if (patternSource.isStringValue()) {
                // all regexp literals are used via `.source`
                patternSource.getOwnedRegExpLiterals().forEach(removeFlags)
            } else {
                // The source is copied from some other regex
                if (regexpNode.arguments.length >= 2) {
                    // and the flags are given using the second parameter
                    const ownedNode = patternSource.regexpValue?.ownedNode
                    if (ownedNode) {
                        removeFlags(ownedNode)
                    }
                }
            }

            return {}
        },
    })
}

function parseOption(
    userOption:
        | {
              ignore?: ("i" | "m" | "s" | "g" | "y")[]
              strictTypes?: boolean
          }
        | undefined,
) {
    const ignore = new Set<"i" | "m" | "s" | "g" | "y">()
    let strictTypes = true
    if (userOption) {
        for (const i of userOption.ignore ?? []) {
            ignore.add(i)
        }
        if (userOption.strictTypes != null) {
            strictTypes = userOption.strictTypes
        }
    }

    return {
        ignore,
        strictTypes,
    }
}

export default createRule("no-useless-flag", {
    meta: {
        docs: {
            description: "disallow unnecessary regex flags",
            category: "Best Practices",
            recommended: true,
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
                    strictTypes: { type: "boolean" },
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
                "The 'g' flag is unnecessary because the regex does not use global search.",
            uselessGlobalFlagForTest:
                "The 'g' flag is unnecessary because the regex is used only once in 'RegExp.prototype.test'.",
            uselessGlobalFlagForExec:
                "The 'g' flag is unnecessary because the regex is used only once in 'RegExp.prototype.exec'.",
            uselessGlobalFlagForSplit:
                "The 'g' flag is unnecessary because 'String.prototype.split' ignores the 'g' flag.",
            uselessGlobalFlagForSearch:
                "The 'g' flag is unnecessary because 'String.prototype.search' ignores the 'g' flag.",
            uselessStickyFlag:
                "The 'y' flag is unnecessary because 'String.prototype.split' ignores the 'y' flag.",
            uselessFlagsOwned:
                "The flags of this RegExp literal are useless because only the source of the regex is used.",
        },
        type: "suggestion", // "problem",
    },
    create(context) {
        const { ignore, strictTypes } = parseOption(context.options[0])

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
                createUselessGlobalFlagVisitor(context, strictTypes),
            )
        }
        if (!ignore.has("y")) {
            visitor = compositingVisitors(
                visitor,
                createUselessStickyFlagVisitor(context, strictTypes),
            )
        }
        visitor = compositingVisitors(
            visitor,
            createOwnedRegExpFlagsVisitor(context),
        )
        return visitor
    },
})
