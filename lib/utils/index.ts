import type * as ESTree from "estree"
import type { RuleListener, RuleModule, PartialRuleModule } from "../types"
import type { RegExpVisitor } from "regexpp/visitor"
import type { Element, Node, Pattern, Quantifier } from "regexpp/ast"
import { RegExpParser, visitRegExpAST } from "regexpp"
import { CALL, CONSTRUCT, ReferenceTracker } from "eslint-utils"
import type { Rule, AST, SourceCode } from "eslint"
import { parseStringTokens } from "./string-literal-parser"
import { findVariable, getStringIfConstant } from "./ast-utils"
import type { ReadonlyFlags, ToCharSetElement } from "regexp-ast-analysis"
// eslint-disable-next-line no-restricted-imports -- Implement RegExpContext#toCharSet
import { toCharSet } from "regexp-ast-analysis"
import type { CharSet } from "refa"
import { JS } from "refa"
import type { UsageOfPattern } from "./get-usage-of-pattern"
import { getUsageOfPattern } from "./get-usage-of-pattern"
export * from "./unicode"

export type ToCharSet = (
    node: ToCharSetElement,
    flags?: ReadonlyFlags,
) => CharSet
type RegExpHelpersBase = {
    toCharSet: ToCharSet

    /**
     * Creates SourceLocation from the given regexp node
     * @see getRegexpLocation
     *
     * @param regexpNode The regexp node to report.
     * @param offsets The report location offsets.
     * @returns The SourceLocation
     */
    getRegexpLocation: (
        regexpNode: Node,
        offsets?: [number, number],
    ) => AST.SourceLocation

    /**
     * Creates SourceLocation from the regexp flags
     *
     * @returns The SourceLocation
     */
    getFlagsLocation: () => AST.SourceLocation

    /**
     * Escape depending on which node the string applied to fixer is applied.
     * @see fixerApplyEscape
     */
    fixerApplyEscape: (text: string) => string

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
    ) => (fixer: Rule.RuleFixer) => Rule.Fix[] | Rule.Fix | null

    /**
     * Returns the usage of pattern.
     */
    getUsageOfPattern: () => UsageOfPattern

    patternAst: Pattern
}
export type RegExpHelpersForLiteral = {
    /**
     * Creates source range from the given regexp node
     * @param regexpNode The regexp node to report.
     * @returns The SourceLocation
     */
    getRegexpRange: (regexpNode: Node) => AST.Range
} & RegExpHelpersBase
export type RegExpHelpersForSource = {
    /**
     * Creates source range from the given regexp node
     * @param regexpNode The regexp node to report.
     * @returns The SourceLocation
     */
    getRegexpRange: (regexpNode: Node) => AST.Range | null
} & RegExpHelpersBase
export type RegExpHelpers = RegExpHelpersForLiteral & RegExpHelpersForSource

export type RegExpContextForLiteral = {
    node: ESTree.RegExpLiteral
    pattern: string
    flags: ReadonlyFlags
    flagsString: string
    ownsFlags: true
    regexpNode: ESTree.RegExpLiteral
} & RegExpHelpersForLiteral
export type RegExpContextForSource = {
    node: ESTree.Expression
    pattern: string
    flags: ReadonlyFlags
    flagsString: string | null
    ownsFlags: boolean
    regexpNode: ESTree.NewExpression | ESTree.CallExpression
} & RegExpHelpersForSource
export type RegExpContext = RegExpContextForLiteral | RegExpContextForSource

type RegexpRule = {
    createLiteralVisitor?: (
        context: RegExpContextForLiteral,
    ) => RegExpVisitor.Handlers
    createSourceVisitor?: (
        context: RegExpContextForSource,
    ) => RegExpVisitor.Handlers
}
const regexpRules = new WeakMap<ESTree.Program, RegexpRule[]>()

export const FLAG_GLOBAL = "g"
export const FLAG_DOTALL = "s"
export const FLAG_IGNORECASE = "i"
export const FLAG_MULTILINE = "m"
export const FLAG_STICKY = "y"
export const FLAG_UNICODE = "u"

const flagsCache = new Map<string, ReadonlyFlags>()

/**
 * Given some flags, this will return a parsed flags object.
 *
 * Non-standard flags will be ignored.
 */
export function parseFlags(flags: string): ReadonlyFlags {
    let cached = flagsCache.get(flags)
    if (cached === undefined) {
        cached = {
            dotAll: flags.includes(FLAG_DOTALL),
            global: flags.includes(FLAG_GLOBAL),
            ignoreCase: flags.includes(FLAG_IGNORECASE),
            multiline: flags.includes(FLAG_MULTILINE),
            sticky: flags.includes(FLAG_STICKY),
            unicode: flags.includes(FLAG_UNICODE),
        }
        flagsCache.set(flags, cached)
    }
    return cached
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

/**
 * Define the RegExp visitor rule.
 */
export function defineRegexpVisitor(
    context: Rule.RuleContext,
    rule:
        | RegexpRule
        | {
              createVisitor?: (context: RegExpContext) => RegExpVisitor.Handlers
          },
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

    const createLiteralVisitor =
        "createVisitor" in rule
            ? rule.createVisitor
            : "createLiteralVisitor" in rule
            ? rule.createLiteralVisitor
            : undefined
    const createSourceVisitor =
        "createVisitor" in rule
            ? rule.createVisitor
            : "createSourceVisitor" in rule
            ? rule.createSourceVisitor
            : undefined

    rules.push({ createLiteralVisitor, createSourceVisitor })

    return visitor
}

/** Build RegExp visitor */
function buildRegexpVisitor(
    context: Rule.RuleContext,
    rules: RegexpRule[],
    programExit: (node: ESTree.Program) => void,
): RuleListener {
    const sourceCode = context.getSourceCode()
    const parser = new RegExpParser()

    /**
     * Verify a given regular expression.
     * @param pattern The regular expression pattern to verify.
     * @param flags The flags of the regular expression.
     */
    function verify(
        exprNode: ESTree.Expression,
        regexpNode: ESTree.RegExpLiteral | ESTree.CallExpression,
        pattern: string,
        flags: ReadonlyFlags,
        createVisitors: (
            helpers: RegExpHelpersBase,
        ) => IterableIterator<RegExpVisitor.Handlers>,
    ) {
        let parsedPattern

        try {
            parsedPattern = parser.parsePattern(
                pattern,
                0,
                pattern.length,
                flags.unicode,
            )
        } catch {
            // Ignore regular expressions with syntax errors
            return
        }

        const helpers = buildRegExpHelperBase({
            exprNode,
            regexpNode,
            context,
            flags,
            parsedPattern,
        })

        const handler: RegExpVisitor.Handlers = {}
        for (const visitor of createVisitors(helpers)) {
            for (const [key, fn] of Object.entries(visitor) as [
                keyof RegExpVisitor.Handlers,
                RegExpVisitor.Handlers[keyof RegExpVisitor.Handlers],
            ][]) {
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
        if (Object.keys(handler).length === 0) {
            return
        }

        visitRegExpAST(parsedPattern, handler)
    }

    return {
        "Program:exit": programExit,
        Literal(node: ESTree.Literal) {
            if (!isRegexpLiteral(node)) {
                return
            }
            const flagsString = node.regex.flags
            const flags = parseFlags(flagsString)
            verify(node, node, node.regex.pattern, flags, function* (helpers) {
                const regexpContext: RegExpContextForLiteral = {
                    node,
                    pattern: node.regex.pattern,
                    flags,
                    flagsString,
                    ownsFlags: true,
                    regexpNode: node,
                    ...helpers,
                    getRegexpRange: (regexpNode) =>
                        getRegexpRange(sourceCode, node, regexpNode),
                }
                for (const rule of rules) {
                    if (rule.createLiteralVisitor) {
                        yield rule.createLiteralVisitor(regexpContext)
                    }
                }
            })
        },
        // eslint-disable-next-line complexity -- X(
        Program() {
            const tracker = new ReferenceTracker(context.getScope())

            // Iterate calls of RegExp.
            // E.g., `new RegExp()`, `RegExp()`, `new window.RegExp()`,
            //       `const {RegExp: a} = window; new a()`, etc...
            const regexpDataList: {
                newOrCall: ESTree.NewExpression | ESTree.CallExpression
                patternNode: ESTree.Expression
                pattern: string | null
                flagsNode: ESTree.Expression | ESTree.SpreadElement | undefined
                flagsString: string | null
            }[] = []
            for (const { node } of tracker.iterateGlobalReferences({
                RegExp: { [CALL]: true, [CONSTRUCT]: true },
            })) {
                const newOrCall = node as
                    | ESTree.NewExpression
                    | ESTree.CallExpression
                const [patternNode, flagsNode] = newOrCall.arguments
                if (!patternNode || patternNode.type === "SpreadElement") {
                    continue
                }
                const pattern = getStringIfConstant(context, patternNode)
                const flagsString = flagsNode
                    ? getStringIfConstant(context, flagsNode)
                    : null

                regexpDataList.push({
                    newOrCall,
                    patternNode,
                    pattern,
                    flagsNode,
                    flagsString,
                })
            }
            for (const {
                newOrCall,
                patternNode,
                pattern,
                flagsNode,
                flagsString,
            } of regexpDataList) {
                if (typeof pattern === "string") {
                    let verifyPatternNode = patternNode
                    if (patternNode.type === "Identifier") {
                        const variable = findVariable(context, patternNode)
                        if (variable && variable.defs.length === 1) {
                            const def = variable.defs[0]
                            if (
                                def.type === "Variable" &&
                                def.parent.kind === "const" &&
                                def.node.init &&
                                def.node.init.type === "Literal"
                            ) {
                                let useInit = false
                                if (variable.references.length > 2) {
                                    if (
                                        variable.references.every((ref) => {
                                            if (ref.isWriteOnly()) {
                                                return true
                                            }
                                            return regexpDataList.some(
                                                (r) =>
                                                    r.patternNode ===
                                                        ref.identifier &&
                                                    r.flagsString ===
                                                        flagsString,
                                            )
                                        })
                                    ) {
                                        useInit = true
                                    }
                                } else {
                                    useInit = true
                                }

                                if (useInit) {
                                    verifyPatternNode = def.node.init
                                }
                            }
                        }
                    }
                    const flags = parseFlags(flagsString || "")
                    verify(
                        verifyPatternNode,
                        newOrCall,
                        pattern,
                        flags,
                        function* (helpers) {
                            const regexpContext: RegExpContextForSource = {
                                node: verifyPatternNode,
                                pattern,
                                flags,
                                flagsString,
                                ownsFlags: Boolean(
                                    flagsNode &&
                                        flagsNode.type !== "SpreadElement" &&
                                        isStringLiteral(flagsNode),
                                ),
                                regexpNode: newOrCall,
                                ...helpers,
                                getRegexpRange: (regexpNode) =>
                                    getRegexpRange(
                                        sourceCode,
                                        verifyPatternNode,
                                        regexpNode,
                                    ),
                            }
                            for (const rule of rules) {
                                if (rule.createSourceVisitor) {
                                    yield rule.createSourceVisitor(
                                        regexpContext,
                                    )
                                }
                            }
                        },
                    )
                }
            }
        },
    }
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
 * Build RegExpHelperBase
 */
function buildRegExpHelperBase({
    exprNode,
    regexpNode,
    context,
    flags,
    parsedPattern,
}: {
    exprNode: ESTree.Expression
    regexpNode: ESTree.CallExpression | ESTree.RegExpLiteral
    context: Rule.RuleContext
    flags: ReadonlyFlags
    parsedPattern: Pattern
}): RegExpHelpersBase {
    const sourceCode = context.getSourceCode()

    const cacheCharSet = new WeakMap<ToCharSetElement, CharSet>()
    let cacheUsageOfPattern: UsageOfPattern | null = null
    return {
        toCharSet: (node, optionFlags) => {
            if (optionFlags) {
                // Ignore the cache if the flag is specified.
                return toCharSet(node, flags)
            }

            let charSet = cacheCharSet.get(node)
            if (charSet) {
                return charSet
            }
            charSet = toCharSet(node, flags)
            cacheCharSet.set(node, charSet)
            return charSet
        },
        getRegexpLocation: (node, offsets) =>
            getRegexpLocation(sourceCode, exprNode, node, offsets),
        getFlagsLocation: () => getFlagsLocation(sourceCode, regexpNode),
        fixerApplyEscape: (text) => fixerApplyEscape(text, exprNode),
        fixReplaceNode: (node, replacement) =>
            fixReplaceNode(sourceCode, exprNode, node, replacement),
        fixReplaceQuant: (qNode, replacement) =>
            fixReplaceQuant(sourceCode, exprNode, qNode, replacement),
        fixReplaceFlags: (newFlags) =>
            fixReplaceFlags(
                sourceCode,
                exprNode,
                parsedPattern,
                regexpNode,
                newFlags,
            ),
        getUsageOfPattern: () =>
            (cacheUsageOfPattern ??= getUsageOfPattern(regexpNode, context)),

        patternAst: parsedPattern,
    }
}

function getRegexpRange(
    sourceCode: SourceCode,
    node: ESTree.RegExpLiteral,
    regexpNode: Node,
): AST.Range
function getRegexpRange(
    sourceCode: SourceCode,
    node: ESTree.Expression,
    regexpNode: Node,
): AST.Range | null
/**
 * Creates source range from the given regexp node
 * @param sourceCode The ESLint source code instance.
 * @param node The node to report.
 * @param regexpNode The regexp node to report.
 * @returns The SourceLocation
 */
function getRegexpRange(
    sourceCode: SourceCode,
    node: ESTree.Expression,
    regexpNode: Node,
    offsets?: [number, number],
): AST.Range | null {
    const startOffset = regexpNode.start + (offsets?.[0] ?? 0)
    const endOffset = regexpNode.end + (offsets?.[1] ?? 0)
    if (isRegexpLiteral(node)) {
        const nodeStart = node.range![0] + 1
        return [nodeStart + startOffset, nodeStart + endOffset]
    }
    if (isStringLiteral(node)) {
        let start: number | null = null
        let end: number | null = null
        try {
            const sourceText = sourceCode.text.slice(
                node.range![0] + 1,
                node.range![1] - 1,
            )
            let startIndex = 0
            for (const t of parseStringTokens(sourceText)) {
                const endIndex = startIndex + t.value.length

                if (
                    start == null &&
                    startIndex <= startOffset &&
                    startOffset < endIndex
                ) {
                    start = t.range[0]
                }
                if (
                    start != null &&
                    end == null &&
                    startIndex < endOffset &&
                    endOffset <= endIndex
                ) {
                    end = t.range[1]
                    break
                }
                startIndex = endIndex
            }
            if (start != null && end != null) {
                const nodeStart = node.range![0] + 1
                return [nodeStart + start, nodeStart + end]
            }
        } catch {
            // ignore
        }
    }
    return null
}

/**
 * Creates SourceLocation from the given regexp node
 * @param sourceCode The ESLint source code instance.
 * @param node The node to report.
 * @param regexpNode The regexp node to report.
 * @param offsets The report location offsets.
 * @returns The SourceLocation
 */
function getRegexpLocation(
    sourceCode: SourceCode,
    node: ESTree.Expression,
    regexpNode: Node,
    offsets?: [number, number],
): AST.SourceLocation {
    const range = getRegexpRange(sourceCode, node, regexpNode)
    if (range == null) {
        return node.loc!
    }
    if (offsets) {
        return {
            start: sourceCode.getLocFromIndex(range[0] + offsets[0]),
            end: sourceCode.getLocFromIndex(range[0] + offsets[1]),
        }
    }
    return {
        start: sourceCode.getLocFromIndex(range[0]),
        end: sourceCode.getLocFromIndex(range[1]),
    }
}

function getFlagsRange(regexpNode: ESTree.RegExpLiteral): AST.Range
function getFlagsRange(
    regexpNode: ESTree.CallExpression | ESTree.RegExpLiteral,
): AST.Range | null
/**
 * Creates source range of the flags of the given regexp node
 * @param regexpNode The regexp node to report.
 * @returns The SourceLocation
 */
function getFlagsRange(
    regexpNode: ESTree.CallExpression | ESTree.RegExpLiteral,
): AST.Range | null {
    if (isRegexpLiteral(regexpNode)) {
        return [
            regexpNode.range![1] - regexpNode.regex.flags.length,
            regexpNode.range![1],
        ]
    }
    const flagsArg = regexpNode.arguments[1]
    if (
        flagsArg &&
        flagsArg.type === "Literal" &&
        typeof flagsArg.value === "string"
    ) {
        return [flagsArg.range![0] + 1, flagsArg.range![1] - 1]
    }

    return null
}

/**
 * Creates SourceLocation of the flags of the given regexp node
 * @param sourceCode The ESLint source code instance.
 * @param regexpNode The node to report.
 * @returns The SourceLocation
 */
function getFlagsLocation(
    sourceCode: SourceCode,
    regexpNode: ESTree.CallExpression | ESTree.RegExpLiteral,
): AST.SourceLocation {
    const range = getFlagsRange(regexpNode)
    if (range == null) {
        return regexpNode.loc!
    }
    return {
        start: sourceCode.getLocFromIndex(range[0]),
        end: sourceCode.getLocFromIndex(range[1]),
    }
}

/**
 * Check if the given expression node is regexp literal.
 */
export function isRegexpLiteral(
    node: ESTree.Expression,
): node is ESTree.RegExpLiteral {
    if (node.type !== "Literal") {
        return false
    }
    if (!(node as ESTree.RegExpLiteral).regex) {
        return false
    }
    return true
}

/**
 * Check if the given expression node is string literal.
 */
function isStringLiteral(
    node: ESTree.Expression,
): node is ESTree.Literal & { value: string } {
    if (node.type !== "Literal") {
        return false
    }
    if (typeof node.value !== "string") {
        return false
    }
    return true
}

/**
 * Escape depending on which node the string applied to fixer is applied.
 */
function fixerApplyEscape(text: string, node: ESTree.Expression): string {
    if (node.type !== "Literal") {
        throw new Error(`illegal node type:${node.type}`)
    }
    if (!(node as ESTree.RegExpLiteral).regex) {
        return text.replace(/\\/gu, "\\\\")
    }
    return text
}

/**
 * Creates a new fix that replaces the given node with a given string.
 *
 * The string will automatically be escaped if necessary.
 */
function fixReplaceNode(
    sourceCode: SourceCode,
    node: ESTree.Expression,
    regexpNode: Node,
    replacement: string | (() => string | null),
) {
    return (fixer: Rule.RuleFixer): Rule.Fix | null => {
        const range = getRegexpRange(sourceCode, node, regexpNode)
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

        return fixer.replaceTextRange(range, fixerApplyEscape(text, node))
    }
}

/**
 * Creates a new fix that replaces the given quantifier (but not the quantified
 * element) with a given string.
 *
 * This will not change the greediness of the quantifier.
 */
function fixReplaceQuant(
    sourceCode: SourceCode,
    node: ESTree.Expression,
    quantifier: Quantifier,
    replacement: string | Quant | (() => string | Quant | null),
) {
    return (fixer: Rule.RuleFixer): Rule.Fix | null => {
        const range = getRegexpRange(sourceCode, node, quantifier)
        if (range == null) {
            return null
        }

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

        return fixer.replaceTextRange(
            [range[0] + offset[0], range[0] + offset[1]],
            text,
        )
    }
}

/**
 * Returns a new fixer that replaces the current flags with the given flags.
 */
function fixReplaceFlags(
    sourceCode: SourceCode,
    patternNode: ESTree.Expression,
    pattern: Pattern,
    regexpNode: ESTree.CallExpression | ESTree.RegExpLiteral,
    replacement: string | (() => string | null),
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

        if (!/^[a-z]*$/i.test(newFlags)) {
            // make sure that escaping isn't necessary
            return null
        }

        if (isRegexpLiteral(regexpNode)) {
            // fixes that change the pattern generally assume that flags don't
            // change, so we have to create conflicts.

            return fixer.replaceText(
                regexpNode,
                `/${regexpNode.regex.pattern}/${newFlags}`,
            )
        }

        const range = getFlagsRange(regexpNode)
        if (range == null) {
            return null
        }

        // fixes that change the pattern generally assume that flags don't
        // change, so we have to create conflicts.

        const patternRange = getRegexpRange(sourceCode, patternNode, pattern)
        if (patternRange == null) {
            return null
        }

        return [
            fixer.replaceTextRange(
                patternRange,
                fixerApplyEscape(pattern.raw, patternNode),
            ),
            fixer.replaceTextRange(range, newFlags),
        ]
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
    if (before.endsWith("\\c") && /^[a-z]/i.test(after)) {
        return true
    }

    // hexadecimal
    // \xFF \uFFFF
    if (
        /(?:^|[^\\])(?:\\{2})*\\(?:x[\dA-Fa-f]?|u[\dA-Fa-f]{0,3})$/.test(
            before,
        ) &&
        /^[\da-f]/i.test(after)
    ) {
        return true
    }

    // unicode
    // \u{FFFF}
    if (
        (/(?:^|[^\\])(?:\\{2})*\\u$/.test(before) &&
            /^\{[\da-f]*(?:\}[\s\S]*)?$/i.test(after)) ||
        (/(?:^|[^\\])(?:\\{2})*\\u\{[\da-f]*$/.test(before) &&
            /^(?:[\da-f]+\}?|\})/i.test(after))
    ) {
        return true
    }

    // octal
    // \077 \123
    if (
        (/(?:^|[^\\])(?:\\{2})*\\0[0-7]?$/.test(before) &&
            /^[0-7]/.test(after)) ||
        (/(?:^|[^\\])(?:\\{2})*\\[1-7]$/.test(before) && /^[0-7]/.test(after))
    ) {
        return true
    }

    // backreference
    // \12 \k<foo>
    if (
        (/(?:^|[^\\])(?:\\{2})*\\[1-9]\d*$/.test(before) &&
            /^\d/.test(after)) ||
        (/(?:^|[^\\])(?:\\{2})*\\k$/.test(before) && after.startsWith("<")) ||
        /(?:^|[^\\])(?:\\{2})*\\k<[^<>]*$/.test(before)
    ) {
        return true
    }

    // property
    // \p{L} \P{L}
    if (
        (/(?:^|[^\\])(?:\\{2})*\\p$/i.test(before) &&
            /^\{[\w=]*(?:\}[\s\S]*)?$/.test(after)) ||
        (/(?:^|[^\\])(?:\\{2})*\\p\{[\w=]*$/i.test(before) &&
            /^[\w=]+(?:\}[\s\S]*)?$|^\}/.test(after))
    ) {
        return true
    }

    // quantifier
    // {1} {2,} {2,3}
    if (
        (/(?:^|[^\\])(?:\\{2})*\{\d*$/.test(before) && /^[\d,}]/.test(after)) ||
        (/(?:^|[^\\])(?:\\{2})*\{\d+,$/.test(before) &&
            /^(?:\d+(?:\}|$)|\})/.test(after)) ||
        (/(?:^|[^\\])(?:\\{2})*\{\d+,\d*$/.test(before) &&
            after.startsWith("}"))
    ) {
        return true
    }

    return false
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
    return /^\\[0-7]{1,3}$/.test(raw)
}
/**
 * Returns whether the given raw of a character literal is a control escape
 * sequence.
 */
export function isControlEscape(raw: string): boolean {
    return /^\\c[A-Za-z]$/.test(raw)
}
/**
 * Returns whether the given raw of a character literal is a hexadecimal escape
 * sequence.
 */
export function isHexadecimalEscape(raw: string): boolean {
    return /^\\x[\dA-Fa-f]{2}$/.test(raw)
}
/**
 * Returns whether the given raw of a character literal is a unicode escape
 * sequence.
 */
export function isUnicodeEscape(raw: string): boolean {
    return /^\\u[\dA-Fa-f]{4}$/.test(raw)
}
/**
 * Returns whether the given raw of a character literal is a unicode code point
 * escape sequence.
 */
export function isUnicodeCodePointEscape(raw: string): boolean {
    return /^\\u\{[\dA-Fa-f]{1,8}\}$/.test(raw)
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
