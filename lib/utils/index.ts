import type * as ESTree from "estree"
import type { RuleListener, RuleModule, PartialRuleModule } from "../types"
import type { RegExpVisitor } from "@eslint-community/regexpp/visitor"
import type {
    Alternative,
    CapturingGroup,
    CharacterClassElement,
    Element,
    Node,
    Pattern,
    Quantifier,
} from "@eslint-community/regexpp/ast"
import { RegExpParser, visitRegExpAST } from "@eslint-community/regexpp"
import {
    CALL,
    CONSTRUCT,
    ReferenceTracker,
} from "@eslint-community/eslint-utils"
import type { Rule, AST, SourceCode } from "eslint"
import { getStringIfConstant } from "./ast-utils"
import type { ReadonlyFlags } from "regexp-ast-analysis"
import { toCache } from "regexp-ast-analysis"
import type { CharSet } from "refa"
import { JS } from "refa"
import type { UsageOfPattern } from "./get-usage-of-pattern"
import { getUsageOfPattern } from "./get-usage-of-pattern"
import {
    dereferenceOwnedVariable,
    getStringValueRange,
    isRegexpLiteral,
    isStringLiteral,
} from "./ast-utils/utils"
import type { PatternRange } from "./ast-utils/pattern-source"
import { PatternSource } from "./ast-utils/pattern-source"
import type { CapturingGroupReference } from "./extract-capturing-group-references"
import { extractCapturingGroupReferences } from "./extract-capturing-group-references"
import { createTypeTracker } from "./type-tracker"
export * from "./unicode"

type RegExpContextBase = {
    /**
     * Creates SourceLocation from the given regexp node
     * @see getRegexpLocation
     *
     * @param regexpNode The regexp node to report.
     * @param offsets The report location offsets.
     * @returns The SourceLocation
     */
    getRegexpLocation: (
        regexpNode: PatternRange,
        offsets?: [number, number],
    ) => AST.SourceLocation

    /**
     * Creates SourceLocation of the regexp flags
     */
    getFlagsLocation: () => AST.SourceLocation

    /**
     * Creates SourceLocation of the regexp flag
     */
    getFlagLocation: (flag: string) => AST.SourceLocation

    /**
     * Creates a new fix that replaces the given node with a given string.
     *
     * The string will automatically be escaped if necessary.
     * @see fixReplaceNode
     */
    fixReplaceNode: (
        regexpNode: Node,
        replacement: string | (() => string | null),
    ) => (fixer: Rule.RuleFixer) => Rule.Fix | null

    /**
     * Creates a new fix that replaces the given quantifier (but not the quantified
     * element) with a given string.
     *
     * This will not change the greediness of the quantifier.
     * @see fixReplaceQuant
     */
    fixReplaceQuant: (
        quantifier: Quantifier,
        replacement: string | Quant | (() => string | Quant | null),
    ) => (fixer: Rule.RuleFixer) => Rule.Fix | null

    fixReplaceFlags: (
        newFlags: string | (() => string | null),
        includePattern?: boolean,
    ) => (fixer: Rule.RuleFixer) => Rule.Fix[] | Rule.Fix | null

    /**
     * Returns the usage of pattern.
     */
    getUsageOfPattern: () => UsageOfPattern

    /**
     * Returns the capturing group references
     */
    getCapturingGroupReferences: (options?: {
        strictTypes?: boolean // default true
    }) => CapturingGroupReference[]

    /**
     * Returns a list of all capturing groups in the order of their numbers.
     */
    getAllCapturingGroups: () => CapturingGroup[]

    pattern: string
    patternAst: Pattern
    patternSource: PatternSource

    flags: Required<ReadonlyFlags>
}
export type RegExpContextForLiteral = {
    node: ESTree.RegExpLiteral
    flagsString: string
    ownsFlags: true
    regexpNode: ESTree.RegExpLiteral
} & RegExpContextBase
export type RegExpContextForSource = {
    node: ESTree.Expression
    flagsString: string | null
    ownsFlags: boolean
    regexpNode: ESTree.CallExpression
} & RegExpContextBase
export type RegExpContext = RegExpContextForLiteral | RegExpContextForSource

type UnparsableRegExpContextBase = {
    node: ESTree.Expression
    regexpNode: ESTree.RegExpLiteral | ESTree.CallExpression

    flags: Required<ReadonlyFlags>
    flagsString: string | null
    ownsFlags: boolean

    /**
     * Creates SourceLocation of the regexp flags
     */
    getFlagsLocation: () => AST.SourceLocation

    /**
     * Creates SourceLocation of the regexp flag
     */
    getFlagLocation: (flag: string) => AST.SourceLocation

    fixReplaceFlags: (
        newFlags: string | (() => string | null),
        includePattern?: boolean,
    ) => (fixer: Rule.RuleFixer) => Rule.Fix[] | Rule.Fix | null
}
export type RegExpContextForInvalid = {
    pattern: string
    patternSource: PatternSource
    error: SyntaxError
} & UnparsableRegExpContextBase
export type RegExpContextForUnknown = {
    pattern: null
    patternSource: null
} & UnparsableRegExpContextBase
export type UnparsableRegExpContext =
    | RegExpContextForInvalid
    | RegExpContextForUnknown

type ParsableRegexpRule = {
    createLiteralVisitor?: (
        context: RegExpContextForLiteral,
    ) => RegExpVisitor.Handlers
    createSourceVisitor?: (
        context: RegExpContextForSource,
    ) => RegExpVisitor.Handlers
}
type UnparsableRegexpRule = {
    visitInvalid?: (context: RegExpContextForInvalid) => void
    visitUnknown?: (context: RegExpContextForUnknown) => void
}
type RegexpRule = ParsableRegexpRule & UnparsableRegexpRule

const regexpRules = new WeakMap<ESTree.Program, RegexpRule[]>()

export const FLAG_GLOBAL = "g"
export const FLAG_DOT_ALL = "s"
export const FLAG_HAS_INDICES = "d"
export const FLAG_IGNORECASE = "i"
export const FLAG_MULTILINE = "m"
export const FLAG_STICKY = "y"
export const FLAG_UNICODE = "u"
export const FLAG_UNICODE_SETS = "v"

const flagsCache = new Map<string, Required<ReadonlyFlags>>()

/**
 * Given some flags, this will return a parsed flags object.
 *
 * Non-standard flags will be ignored.
 */
export function parseFlags(flags: string): ReadonlyFlags {
    let cached = flagsCache.get(flags)
    if (cached === undefined) {
        cached = {
            dotAll: flags.includes(FLAG_DOT_ALL),
            global: flags.includes(FLAG_GLOBAL),
            hasIndices: flags.includes(FLAG_HAS_INDICES),
            ignoreCase: flags.includes(FLAG_IGNORECASE),
            multiline: flags.includes(FLAG_MULTILINE),
            sticky: flags.includes(FLAG_STICKY),
            unicode: flags.includes(FLAG_UNICODE),
            unicodeSets: flags.includes(FLAG_UNICODE_SETS),
        }
        flagsCache.set(flags, cached)
    }
    return cached
}

/**
 * Asserts that the given flags are valid (no `u` and `v` flag together).
 * @param flags
 */
export function assertValidFlags(
    flags: ReadonlyFlags,
): asserts flags is JS.Flags {
    if (!JS.isFlags(flags)) {
        throw new Error(`Invalid flags: ${JSON.stringify(flags)}`)
    }
}

/**
 * Define the rule.
 * @param ruleName ruleName
 * @param rule rule module
 */
export function createRule(
    ruleName: string,
    rule: PartialRuleModule,
): RuleModule {
    return {
        meta: {
            ...rule.meta,
            docs: {
                ...rule.meta.docs,
                url: `https://ota-meshi.github.io/eslint-plugin-regexp/rules/${ruleName}.html`,
                ruleId: `regexp/${ruleName}`,
                ruleName,
            },
        },
        create: rule.create as never,
    }
}

type DefineRegexpVisitorRule = UnparsableRegexpRule &
    (
        | ParsableRegexpRule
        | {
              createVisitor: (context: RegExpContext) => RegExpVisitor.Handlers
          }
    )

/**
 * Define the RegExp visitor rule.
 */
export function defineRegexpVisitor(
    context: Rule.RuleContext,
    rule: DefineRegexpVisitorRule,
): RuleListener {
    const programNode = context.getSourceCode().ast

    let visitor: RuleListener
    let rules = regexpRules.get(programNode)
    if (!rules) {
        rules = []
        regexpRules.set(programNode, rules)
        visitor = buildRegexpVisitor(context, rules, () => {
            regexpRules.delete(programNode)
        })
    } else {
        visitor = {}
    }

    let createLiteralVisitor = undefined
    let createSourceVisitor = undefined
    if ("createVisitor" in rule) {
        createLiteralVisitor = rule.createVisitor
        createSourceVisitor = rule.createVisitor
    } else {
        createLiteralVisitor = rule.createLiteralVisitor
        createSourceVisitor = rule.createSourceVisitor
    }

    rules.push({
        createLiteralVisitor,
        createSourceVisitor,
        visitInvalid: rule.visitInvalid,
        visitUnknown: rule.visitUnknown,
    })

    return visitor
}

/** Build RegExp visitor */
function buildRegexpVisitor(
    context: Rule.RuleContext,
    rules: RegexpRule[],
    programExit: (node: ESTree.Program) => void,
): RuleListener {
    const parser = new RegExpParser()

    /**
     * Verify a given regular expression.
     * @param patternNode The regular expression pattern to verify.
     * @param flags The flags of the regular expression.
     */
    function verify(
        patternNode: ESTree.Expression,
        flagsNode: ESTree.Expression | null,
        regexpNode: ESTree.RegExpLiteral | ESTree.CallExpression,
        patternSource: PatternSource | null,
        flagsString: string | null,
        ownsFlags: boolean,
        createVisitor: (helpers: RegExpContextBase) => RegExpVisitor.Handlers,
    ) {
        const flags = parseFlags(flagsString || "")

        if (!patternSource) {
            visitUnknownForRules(rules, {
                pattern: null,
                patternSource: null,

                ...buildUnparsableRegExpContextBase({
                    patternSource,
                    patternNode,
                    regexpNode,
                    context,
                    flags,
                    flagsString,
                    flagsNode,
                    ownsFlags,
                }),
            })
            return
        }

        let parsedPattern
        try {
            parsedPattern = parser.parsePattern(
                patternSource.value,
                0,
                patternSource.value.length,
                flags,
            )
        } catch (error: unknown) {
            if (error instanceof SyntaxError) {
                // regex with syntax error
                visitInvalidForRules(rules, {
                    pattern: patternSource.value,
                    patternSource,
                    error,

                    ...buildUnparsableRegExpContextBase({
                        patternSource,
                        patternNode,
                        regexpNode,
                        context,
                        flags,
                        flagsString,
                        flagsNode,
                        ownsFlags,
                    }),
                })
            }
            return
        }

        const helpers = buildRegExpContextBase({
            patternSource,
            regexpNode,
            flagsNode,
            context,
            flags,
            parsedPattern,
        })

        visitRegExpAST(parsedPattern, createVisitor(helpers))
    }

    const ownedRegExpLiterals = new Set<ESTree.RegExpLiteral>()

    return {
        "Program:exit": programExit,
        Literal(node: ESTree.Literal) {
            if (!isRegexpLiteral(node) || ownedRegExpLiterals.has(node)) {
                return
            }
            const flagsString = node.regex.flags
            const patternSource = PatternSource.fromRegExpLiteral(context, node)
            verify(
                node,
                node,
                node,
                patternSource,
                flagsString,
                true,
                (base) => {
                    return createLiteralVisitorFromRules(rules, {
                        node,
                        flagsString,
                        ownsFlags: true,
                        regexpNode: node,
                        ...base,
                    })
                },
            )
        },
        Program() {
            const tracker = new ReferenceTracker(context.getScope())

            // Iterate calls of RegExp.
            // E.g., `new RegExp()`, `RegExp()`, `new window.RegExp()`,
            //       `const {RegExp: a} = window; new a()`, etc...
            const regexpDataList: {
                call: ESTree.CallExpression
                patternNode: ESTree.Expression
                patternSource: PatternSource | null
                flagsNode: ESTree.Expression | null
                flagsString: string | null
                ownsFlags: boolean
            }[] = []
            for (const { node } of tracker.iterateGlobalReferences({
                RegExp: { [CALL]: true, [CONSTRUCT]: true },
            })) {
                const newOrCall = node as ESTree.CallExpression
                const args = newOrCall.arguments as (
                    | ESTree.Expression
                    | ESTree.SpreadElement
                    | undefined
                )[]
                const [patternArg, flagsArg] = args
                if (!patternArg || patternArg.type === "SpreadElement") {
                    continue
                }

                const patternSource = PatternSource.fromExpression(
                    context,
                    patternArg,
                )

                // avoid double reporting
                patternSource
                    ?.getOwnedRegExpLiterals()
                    .forEach((n) => ownedRegExpLiterals.add(n))

                let flagsNode = null
                let flagsString = null
                let ownsFlags = false
                if (flagsArg) {
                    if (flagsArg.type !== "SpreadElement") {
                        flagsNode = dereferenceOwnedVariable(context, flagsArg)
                        flagsString = getStringIfConstant(context, flagsNode)
                        ownsFlags = isStringLiteral(flagsNode)
                    }
                } else {
                    if (patternSource && patternSource.regexpValue) {
                        flagsString = patternSource.regexpValue.flags
                        ownsFlags = Boolean(patternSource.regexpValue.ownedNode)
                        flagsNode = patternSource.regexpValue.ownedNode
                    } else {
                        flagsString = ""
                        ownsFlags = true
                    }
                }

                regexpDataList.push({
                    call: newOrCall,
                    patternNode: patternArg,
                    patternSource,
                    flagsNode,
                    flagsString,
                    ownsFlags,
                })
            }

            for (const {
                call,
                patternNode,
                patternSource,
                flagsNode,
                flagsString,
                ownsFlags,
            } of regexpDataList) {
                verify(
                    patternNode,
                    flagsNode,
                    call,
                    patternSource,
                    flagsString,
                    ownsFlags,
                    (base) => {
                        return createSourceVisitorFromRules(rules, {
                            node: patternNode,
                            flagsString,
                            ownsFlags,
                            regexpNode: call,
                            ...base,
                        })
                    },
                )
            }
        },
    }
}

/** Create a visitor handler from the given rules */
function createLiteralVisitorFromRules(
    rules: Iterable<RegexpRule>,
    context: RegExpContextForLiteral,
): RegExpVisitor.Handlers {
    const handlers: RegExpVisitor.Handlers[] = []
    for (const rule of rules) {
        if (rule.createLiteralVisitor) {
            handlers.push(rule.createLiteralVisitor(context))
        }
    }
    return composeRegExpVisitors(handlers)
}

/** Create a visitor handler from the given rules */
function createSourceVisitorFromRules(
    rules: Iterable<RegexpRule>,
    context: RegExpContextForSource,
): RegExpVisitor.Handlers {
    const handlers: RegExpVisitor.Handlers[] = []
    for (const rule of rules) {
        if (rule.createSourceVisitor) {
            handlers.push(rule.createSourceVisitor(context))
        }
    }
    return composeRegExpVisitors(handlers)
}

/** Calls a visit function for all the given rules */
function visitInvalidForRules(
    rules: Iterable<RegexpRule>,
    context: RegExpContextForInvalid,
): void {
    for (const rule of rules) {
        rule.visitInvalid?.(context)
    }
}

/** Calls a visit function for all the given rules */
function visitUnknownForRules(
    rules: Iterable<RegexpRule>,
    context: RegExpContextForUnknown,
): void {
    for (const rule of rules) {
        rule.visitUnknown?.(context)
    }
}

/** Returns a single visitor handler that executes all the given handlers. */
function composeRegExpVisitors(
    handlers: Iterable<RegExpVisitor.Handlers>,
): RegExpVisitor.Handlers {
    const handler: RegExpVisitor.Handlers = {}

    for (const visitor of handlers) {
        const entries = Object.entries(visitor) as [
            keyof RegExpVisitor.Handlers,
            RegExpVisitor.Handlers[keyof RegExpVisitor.Handlers],
        ][]

        for (const [key, fn] of entries) {
            const orig = handler[key]
            if (orig) {
                handler[key] = (
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- ignore
                    node: any,
                ) => {
                    orig(node)
                    fn!(node)
                }
            } else {
                // @ts-expect-error -- ignore
                handler[key] = fn
            }
        }
    }

    return handler
}

/**
 * Composite all given visitors.
 */
export function compositingVisitors(
    visitor: RuleListener,
    ...visitors: RuleListener[]
): RuleListener {
    for (const v of visitors) {
        for (const key in v) {
            const orig = visitor[key]
            if (orig) {
                visitor[key] = (...args: unknown[]) => {
                    // @ts-expect-error -- ignore
                    orig(...args)
                    // @ts-expect-error -- ignore
                    v[key](...args)
                }
            } else {
                visitor[key] = v[key]
            }
        }
    }
    return visitor
}

/**
 * Build RegExpContextBase
 */
function buildRegExpContextBase({
    patternSource,
    regexpNode,
    flagsNode,
    context,
    flags,
    parsedPattern,
}: {
    patternSource: PatternSource
    regexpNode: ESTree.CallExpression | ESTree.RegExpLiteral
    flagsNode: ESTree.Expression | null
    context: Rule.RuleContext
    flags: ReadonlyFlags
    parsedPattern: Pattern
}): RegExpContextBase {
    const sourceCode = context.getSourceCode()

    let cacheUsageOfPattern: UsageOfPattern | null = null
    const cacheCapturingGroupReferenceMap = new Map<
        boolean /* strictTypes */,
        CapturingGroupReference[]
    >()
    let cacheAllCapturingGroups: CapturingGroup[] | null = null
    return {
        getRegexpLocation: (range, offsets) => {
            if (offsets) {
                return patternSource.getAstLocation({
                    start: range.start + offsets[0],
                    end: range.start + offsets[1],
                })
            }
            return patternSource.getAstLocation(range)
        },
        getFlagsLocation: () =>
            getFlagsLocation(sourceCode, regexpNode, flagsNode),
        getFlagLocation: (flag) =>
            getFlagLocation(sourceCode, regexpNode, flagsNode, flag),
        fixReplaceNode: (node, replacement) => {
            return fixReplaceNode(patternSource, node, replacement)
        },
        fixReplaceQuant: (qNode, replacement) => {
            return fixReplaceQuant(patternSource, qNode, replacement)
        },
        fixReplaceFlags: (newFlags, includePattern) => {
            return fixReplaceFlags(
                patternSource,
                regexpNode,
                flagsNode,
                newFlags,
                includePattern ?? true,
            )
        },
        getUsageOfPattern: () =>
            (cacheUsageOfPattern ??= getUsageOfPattern(regexpNode, context)),
        getCapturingGroupReferences: (options?: {
            strictTypes?: boolean // default true
        }) => {
            const strictTypes = Boolean(options?.strictTypes ?? true)
            const cacheCapturingGroupReference =
                cacheCapturingGroupReferenceMap.get(strictTypes)
            if (cacheCapturingGroupReference) {
                return cacheCapturingGroupReference
            }
            const countOfCapturingGroup =
                getAllCapturingGroupsWithCache().length
            const capturingGroupReferences = [
                ...extractCapturingGroupReferences(
                    regexpNode,
                    flags,
                    createTypeTracker(context),
                    countOfCapturingGroup,
                    context,
                    { strictTypes },
                ),
            ]
            cacheCapturingGroupReferenceMap.set(
                strictTypes,
                capturingGroupReferences,
            )
            return capturingGroupReferences
        },
        getAllCapturingGroups: getAllCapturingGroupsWithCache,

        pattern: parsedPattern.raw,
        patternAst: parsedPattern,
        patternSource,
        flags: toCache(flags),
    }

    /** Returns a list of all capturing groups in the order of their numbers. */
    function getAllCapturingGroupsWithCache(): CapturingGroup[] {
        return (cacheAllCapturingGroups ??=
            getAllCapturingGroups(parsedPattern))
    }
}

/**
 * Build UnparsableRegExpContextBase
 */
function buildUnparsableRegExpContextBase({
    patternSource,
    patternNode,
    regexpNode,
    context,
    flags: originalFlags,
    flagsString,
    flagsNode,
    ownsFlags,
}: {
    patternSource: PatternSource | null
    patternNode: ESTree.Expression
    regexpNode: ESTree.CallExpression | ESTree.RegExpLiteral
    context: Rule.RuleContext
    flags: ReadonlyFlags
    flagsString: string | null
    flagsNode: ESTree.Expression | null
    ownsFlags: boolean
}): UnparsableRegExpContextBase {
    const sourceCode = context.getSourceCode()
    const flags = toCache(originalFlags)

    return {
        regexpNode,
        node: patternNode,

        flags,
        flagsString,
        ownsFlags,

        getFlagsLocation: () =>
            getFlagsLocation(sourceCode, regexpNode, flagsNode),
        getFlagLocation: (flag) =>
            getFlagLocation(sourceCode, regexpNode, flagsNode, flag),

        fixReplaceFlags: (newFlags, includePattern) => {
            return fixReplaceFlags(
                patternSource,
                regexpNode,
                flagsNode,
                newFlags,
                includePattern ?? true,
            )
        },
    }
}

export function getFlagsRange(flagsNode: ESTree.RegExpLiteral): AST.Range
export function getFlagsRange(
    flagsNode: ESTree.Expression | null,
): AST.Range | null
/**
 * Creates source range of the flags of the given regexp node
 * @param flagsNode The expression that contributes the flags.
 */
export function getFlagsRange(
    flagsNode: ESTree.Expression | null,
): AST.Range | null {
    if (!flagsNode) {
        return null
    }

    if (isRegexpLiteral(flagsNode)) {
        return [
            flagsNode.range![1] - flagsNode.regex.flags.length,
            flagsNode.range![1],
        ]
    }
    if (isStringLiteral(flagsNode)) {
        return [flagsNode.range![0] + 1, flagsNode.range![1] - 1]
    }

    return null
}

/**
 * Creates SourceLocation of the flags of the given regexp node
 * @param sourceCode The ESLint source code instance.
 * @param regexpNode The node to report.
 */
export function getFlagsLocation(
    sourceCode: SourceCode,
    regexpNode: ESTree.CallExpression | ESTree.RegExpLiteral,
    flagsNode: ESTree.Expression | null,
): AST.SourceLocation {
    const range = getFlagsRange(flagsNode)
    if (range == null) {
        return flagsNode?.loc ?? regexpNode.loc!
    }

    if (range[0] === range[1]) {
        range[0]--
    }

    return {
        start: sourceCode.getLocFromIndex(range[0]),
        end: sourceCode.getLocFromIndex(range[1]),
    }
}

/**
 * Creates source range of the given flag in the given flags node
 * @param flagsNode The expression that contributes the flags.
 */
function getFlagRange(
    sourceCode: SourceCode,
    flagsNode: ESTree.Expression | null,
    flag: string,
): AST.Range | null {
    if (!flagsNode || !flag) {
        return null
    }

    if (isRegexpLiteral(flagsNode)) {
        const index = flagsNode.regex.flags.indexOf(flag)
        if (index === -1) {
            return null
        }
        const start = flagsNode.range![1] - flagsNode.regex.flags.length + index
        return [start, start + 1]
    }
    if (isStringLiteral(flagsNode)) {
        const index = flagsNode.value.indexOf(flag)
        if (index === -1) {
            return null
        }
        return getStringValueRange(sourceCode, flagsNode, index, index + 1)
    }

    return null
}

/**
 * Creates source location of the given flag in the given flags node
 * @param flagsNode The expression that contributes the flags.
 */
function getFlagLocation(
    sourceCode: SourceCode,
    regexpNode: ESTree.CallExpression | ESTree.RegExpLiteral,
    flagsNode: ESTree.Expression | null,
    flag: string,
): AST.SourceLocation {
    const range = getFlagRange(sourceCode, flagsNode, flag)
    if (range == null) {
        return flagsNode?.loc ?? regexpNode.loc!
    }
    return {
        start: sourceCode.getLocFromIndex(range[0]),
        end: sourceCode.getLocFromIndex(range[1]),
    }
}

/**
 * Creates a new fix that replaces the given node with a given string.
 *
 * The string will automatically be escaped if necessary.
 */
function fixReplaceNode(
    patternSource: PatternSource,
    regexpNode: Node,
    replacement: string | (() => string | null),
) {
    return (fixer: Rule.RuleFixer): Rule.Fix | null => {
        const range = patternSource.getReplaceRange(regexpNode)
        if (range == null) {
            return null
        }

        let text
        if (typeof replacement === "string") {
            text = replacement
        } else {
            text = replacement()
            if (text == null) {
                return null
            }
        }

        return range.replace(fixer, text)
    }
}

/**
 * Creates a new fix that replaces the given quantifier (but not the quantified
 * element) with a given string.
 *
 * This will not change the greediness of the quantifier.
 */
function fixReplaceQuant(
    patternSource: PatternSource,
    quantifier: Quantifier,
    replacement: string | Quant | (() => string | Quant | null),
) {
    return (fixer: Rule.RuleFixer): Rule.Fix | null => {
        let text
        if (typeof replacement !== "function") {
            text = replacement
        } else {
            text = replacement()
            if (text == null) {
                return null
            }
        }

        const offset = getQuantifierOffsets(quantifier)

        if (typeof text !== "string") {
            if (
                text.greedy !== undefined &&
                text.greedy !== quantifier.greedy
            ) {
                // we also change the greediness of the quantifier
                offset[1] += 1
            }
            text = quantToString(text)
        }

        const range = patternSource.getReplaceRange({
            start: quantifier.start + offset[0],
            end: quantifier.start + offset[1],
        })
        if (range == null) {
            return null
        }

        return range.replace(fixer, text)
    }
}

/**
 * Returns a new fixer that replaces the current flags with the given flags.
 *
 * @param includePattern Whether the whole pattern is to be included in the fix.
 *
 * Fixes that change the pattern generally assume that the flags don't change,
 * so changing the flags should conflict with all pattern fixes.
 */
function fixReplaceFlags(
    patternSource: PatternSource | null,
    regexpNode: ESTree.CallExpression | ESTree.RegExpLiteral,
    flagsNode: ESTree.Expression | null,
    replacement: string | (() => string | null),
    includePattern: boolean,
) {
    return (fixer: Rule.RuleFixer): Rule.Fix[] | Rule.Fix | null => {
        let newFlags
        if (typeof replacement === "string") {
            newFlags = replacement
        } else {
            newFlags = replacement()
            if (newFlags == null) {
                return null
            }
        }

        if (!/^[a-z]*$/iu.test(newFlags)) {
            // make sure that escaping isn't necessary
            return null
        }

        if (includePattern && isRegexpLiteral(regexpNode)) {
            return fixer.replaceText(
                regexpNode,
                `/${regexpNode.regex.pattern}/${newFlags}`,
            )
        }

        // eslint-disable-next-line one-var -- x
        let flagsFix
        if (isRegexpLiteral(regexpNode)) {
            flagsFix = fixer.replaceTextRange(
                getFlagsRange(regexpNode),
                newFlags,
            )
        } else if (flagsNode) {
            const range = getFlagsRange(flagsNode)
            if (range == null) {
                return null
            }
            flagsFix = fixer.replaceTextRange(range, newFlags)
        } else {
            // If the RegExp call doesn't have a flags argument, we'll add it
            if (regexpNode.arguments.length !== 1) {
                return null
            }
            const end = regexpNode.range![1]
            flagsFix = fixer.replaceTextRange(
                [end - 1, end],
                `, "${newFlags}")`,
            )
        }

        if (!includePattern) {
            return flagsFix
        }

        // pattern fix

        if (!patternSource) {
            return null
        }
        const patternRange = patternSource.getReplaceRange({
            start: 0,
            end: patternSource.value.length,
        })
        if (patternRange == null) {
            return null
        }
        const patternFix = patternRange.replace(fixer, patternSource.value)

        return [patternFix, flagsFix]
    }
}

/**
 * Get the offsets of the given quantifier
 */
export function getQuantifierOffsets(qNode: Quantifier): [number, number] {
    const startOffset = qNode.element.end - qNode.start
    const endOffset = qNode.raw.length - (qNode.greedy ? 0 : 1)
    return [startOffset, endOffset]
}

export interface Quant {
    min: number
    max: number
    greedy?: boolean
}

/**
 * Returns the string representation of the given quantifier.
 */
export function quantToString(quant: Readonly<Quant>): string {
    if (
        quant.max < quant.min ||
        quant.min < 0 ||
        !Number.isInteger(quant.min) ||
        !(Number.isInteger(quant.max) || quant.max === Infinity)
    ) {
        throw new Error(
            `Invalid quantifier { min: ${quant.min}, max: ${quant.max} }`,
        )
    }

    let value
    if (quant.min === 0 && quant.max === 1) {
        value = "?"
    } else if (quant.min === 0 && quant.max === Infinity) {
        value = "*"
    } else if (quant.min === 1 && quant.max === Infinity) {
        value = "+"
    } else if (quant.min === quant.max) {
        value = `{${quant.min}}`
    } else if (quant.max === Infinity) {
        value = `{${quant.min},}`
    } else {
        value = `{${quant.min},${quant.max}}`
    }

    if (quant.greedy === false) {
        return `${value}?`
    }
    return value
}

/**
 * Returns a regexp literal source of the given char set or char.
 */
export function toCharSetSource(
    charSetOrChar: CharSet | number,
    flags: ReadonlyFlags,
): string {
    assertValidFlags(flags)
    let charSet
    if (typeof charSetOrChar === "number") {
        charSet = JS.createCharSet([charSetOrChar], flags)
    } else {
        charSet = charSetOrChar
    }
    return JS.toLiteral(
        {
            type: "Concatenation",
            elements: [{ type: "CharacterClass", characters: charSet }],
        },
        { flags },
    ).source
}

/* eslint-disable complexity -- X( */
/**
 * Returns whether the concatenation of the two string might create new escape
 * sequences or elements.
 */
export function mightCreateNewElement(
    /* eslint-enable complexity -- X( */
    before: string,
    after: string,
): boolean {
    // control
    // \cA
    if (before.endsWith("\\c") && /^[a-z]/iu.test(after)) {
        return true
    }

    // hexadecimal
    // \xFF \uFFFF
    if (
        /(?:^|[^\\])(?:\\{2})*\\(?:x[\dA-Fa-f]?|u[\dA-Fa-f]{0,3})$/u.test(
            before,
        ) &&
        /^[\da-f]/iu.test(after)
    ) {
        return true
    }

    // unicode
    // \u{FFFF}
    if (
        (/(?:^|[^\\])(?:\\{2})*\\u$/u.test(before) &&
            /^\{[\da-f]*(?:\}[\s\S]*)?$/iu.test(after)) ||
        (/(?:^|[^\\])(?:\\{2})*\\u\{[\da-f]*$/u.test(before) &&
            /^(?:[\da-f]+\}?|\})/iu.test(after))
    ) {
        return true
    }

    // octal
    // \077 \123
    if (
        (/(?:^|[^\\])(?:\\{2})*\\0[0-7]?$/u.test(before) &&
            /^[0-7]/u.test(after)) ||
        (/(?:^|[^\\])(?:\\{2})*\\[1-7]$/u.test(before) && /^[0-7]/u.test(after))
    ) {
        return true
    }

    // backreference
    // \12 \k<foo>
    if (
        (/(?:^|[^\\])(?:\\{2})*\\[1-9]\d*$/u.test(before) &&
            /^\d/u.test(after)) ||
        (/(?:^|[^\\])(?:\\{2})*\\k$/u.test(before) && after.startsWith("<")) ||
        /(?:^|[^\\])(?:\\{2})*\\k<[^<>]*$/u.test(before)
    ) {
        return true
    }

    // property
    // \p{L} \P{L}
    if (
        (/(?:^|[^\\])(?:\\{2})*\\p$/iu.test(before) &&
            /^\{[\w=]*(?:\}[\s\S]*)?$/u.test(after)) ||
        (/(?:^|[^\\])(?:\\{2})*\\p\{[\w=]*$/iu.test(before) &&
            /^[\w=]+(?:\}[\s\S]*)?$|^\}/u.test(after))
    ) {
        return true
    }

    // quantifier
    // {1} {2,} {2,3}
    if (
        (/(?:^|[^\\])(?:\\{2})*\{\d*$/u.test(before) &&
            /^[\d,}]/u.test(after)) ||
        (/(?:^|[^\\])(?:\\{2})*\{\d+,$/u.test(before) &&
            /^(?:\d+(?:\}|$)|\})/u.test(after)) ||
        (/(?:^|[^\\])(?:\\{2})*\{\d+,\d*$/u.test(before) &&
            after.startsWith("}"))
    ) {
        return true
    }

    return false
}

/**
 * Removes the given character class element from its character class.
 *
 * If the given element is not a direct element of a character class, an error
 * will be thrown.
 */
export function fixRemoveCharacterClassElement(
    context: RegExpContext,
    element: CharacterClassElement,
): (fixer: Rule.RuleFixer) => Rule.Fix | null {
    const cc = element.parent
    if (cc.type !== "CharacterClass") {
        throw new Error("Only call this function for character class elements.")
    }

    return context.fixReplaceNode(element, () => {
        const textBefore = cc.raw.slice(0, element.start - cc.start)
        const textAfter = cc.raw.slice(element.end - cc.start)

        if (mightCreateNewElement(textBefore, textAfter)) {
            return null
        }

        const elementBefore: CharacterClassElement | undefined =
            // FIXME: TS Error
            // @ts-expect-error -- FIXME
            cc.elements[cc.elements.indexOf(element) - 1]
        const elementAfter: CharacterClassElement | undefined =
            // FIXME: TS Error
            // @ts-expect-error -- FIXME
            cc.elements[cc.elements.indexOf(element) + 1]

        if (
            elementBefore &&
            elementAfter &&
            elementBefore.type === "Character" &&
            elementBefore.raw === "-" &&
            elementAfter.type === "Character"
        ) {
            // e.g. [\s0-\s9] -> [\s0-9] is incorrect
            return null
        }

        // add a backslash if ...
        if (
            // ... the text character is a dash
            // e.g. [a\w-b] -> [a\-b], [\w-b] -> [-b], [\s\w-b] -> [\s-b]
            (textAfter.startsWith("-") &&
                elementBefore &&
                elementBefore.type === "Character") ||
            // ... the next character is a caret and the caret will then be the
            // first character in the character class
            // e.g. [a^b] -> [\^b], [ba^] -> [b^]
            (textAfter.startsWith("^") && !cc.negate && !elementBefore)
        ) {
            return "\\"
        }

        return ""
    })
}

/**
 * Removes the given alternative from its parent.
 */
export function fixRemoveAlternative(
    context: RegExpContext,
    alternative: Alternative,
): (fixer: Rule.RuleFixer) => Rule.Fix | null {
    const { parent } = alternative
    if (parent.alternatives.length === 1) {
        // We can't really remove an alternative if the parent only has one.
        // So instead, we will replace the alternative with an empty character
        // set. This ensure that the alternative is *functionally* removed.
        return context.fixReplaceNode(alternative, "[]")
    }

    return context.fixReplaceNode(parent, () => {
        let { start, end } = alternative
        if (parent.alternatives[0] === alternative) {
            end++
        } else {
            start--
        }

        const before = parent.raw.slice(0, start - parent.start)
        const after = parent.raw.slice(end - parent.start)

        return before + after
    })
}

/**
 * Check the siblings to see if the regex doesn't change when unwrapped.
 */
export function canUnwrapped(node: Element, text: string): boolean {
    let textBefore, textAfter

    const parent = node.parent
    if (parent.type === "Alternative") {
        textBefore = parent.raw.slice(0, node.start - parent.start)
        textAfter = parent.raw.slice(node.end - parent.start)
    } else if (parent.type === "Quantifier") {
        const alt = parent.parent
        textBefore = alt.raw.slice(0, node.start - alt.start)
        textAfter = alt.raw.slice(node.end - alt.start)
    } else {
        return true
    }

    return (
        !mightCreateNewElement(textBefore, text) &&
        !mightCreateNewElement(text, textAfter)
    )
}

/**
 * Returns whether the given raw of a character literal is an octal escape
 * sequence.
 */
export function isOctalEscape(raw: string): boolean {
    return /^\\[0-7]{1,3}$/u.test(raw)
}
/**
 * Returns whether the given raw of a character literal is a control escape
 * sequence.
 */
export function isControlEscape(raw: string): boolean {
    return /^\\c[A-Za-z]$/u.test(raw)
}
/**
 * Returns whether the given raw of a character literal is a hexadecimal escape
 * sequence.
 */
export function isHexadecimalEscape(raw: string): boolean {
    return /^\\x[\dA-Fa-f]{2}$/u.test(raw)
}
/**
 * Returns whether the given raw of a character literal is a unicode escape
 * sequence.
 */
export function isUnicodeEscape(raw: string): boolean {
    return /^\\u[\dA-Fa-f]{4}$/u.test(raw)
}
/**
 * Returns whether the given raw of a character literal is a unicode code point
 * escape sequence.
 */
export function isUnicodeCodePointEscape(raw: string): boolean {
    return /^\\u\{[\dA-Fa-f]{1,8}\}$/u.test(raw)
}

export enum EscapeSequenceKind {
    octal = "octal",
    control = "control",
    hexadecimal = "hexadecimal",
    unicode = "unicode",
    unicodeCodePoint = "unicode code point",
}
/**
 * Returns which escape sequence kind was used for the given raw of a character literal.
 */
export function getEscapeSequenceKind(raw: string): EscapeSequenceKind | null {
    if (!raw.startsWith("\\")) {
        return null
    }
    if (isOctalEscape(raw)) {
        return EscapeSequenceKind.octal
    }
    if (isControlEscape(raw)) {
        return EscapeSequenceKind.control
    }
    if (isHexadecimalEscape(raw)) {
        return EscapeSequenceKind.hexadecimal
    }
    if (isUnicodeEscape(raw)) {
        return EscapeSequenceKind.unicode
    }
    if (isUnicodeCodePointEscape(raw)) {
        return EscapeSequenceKind.unicodeCodePoint
    }
    return null
}
/**
 * Returns whether the given raw of a character literal is a hexadecimal escape
 * sequence, a unicode escape sequence, or a unicode code point escape sequence.
 */
export function isUseHexEscape(raw: string): boolean {
    const kind = getEscapeSequenceKind(raw)
    return (
        kind === EscapeSequenceKind.hexadecimal ||
        kind === EscapeSequenceKind.unicode ||
        kind === EscapeSequenceKind.unicodeCodePoint
    )
}

/**
 * Returns whether the given raw of a character literal is an octal escape
 * sequence, a control escape sequence, a hexadecimal escape sequence, a unicode
 * escape sequence, or a unicode code point escape sequence.
 */
export function isEscapeSequence(raw: string): boolean {
    return Boolean(getEscapeSequenceKind(raw))
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
