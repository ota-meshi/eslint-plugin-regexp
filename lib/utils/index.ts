import type * as ESTree from "estree"
import type { RuleListener, RuleModule, PartialRuleModule } from "../types"
import type { RegExpVisitor } from "regexpp/visitor"
import type {
    Alternative,
    Element,
    Node,
    Node as RegExpNode,
    Quantifier,
} from "regexpp/ast"
import { RegExpParser, visitRegExpAST } from "regexpp"
import {
    CALL,
    CONSTRUCT,
    ReferenceTracker,
    getStringIfConstant,
} from "eslint-utils"
import type { Rule, AST, SourceCode } from "eslint"
import { parseStringTokens } from "./string-literal-parser"
import { findVariable } from "./ast-utils"
export * from "./unicode"

type RegexpRule = {
    createLiteralVisitor?: (
        node: ESTree.RegExpLiteral,
        pattern: string,
        flags: string,
        regexpNode: ESTree.RegExpLiteral,
    ) => RegExpVisitor.Handlers
    createSourceVisitor?: (
        node: ESTree.Expression,
        pattern: string,
        flags: string,
        regexpNode: ESTree.NewExpression | ESTree.CallExpression,
    ) => RegExpVisitor.Handlers
}
const regexpRules = new WeakMap<ESTree.Program, RegexpRule[]>()

export const FLAG_GLOBAL = "g"
export const FLAG_DOTALL = "s"
export const FLAG_IGNORECASE = "i"
export const FLAG_MULTILINE = "m"
export const FLAG_STICKY = "y"
export const FLAG_UNICODE = "u"

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
              createVisitor?: (
                  node: ESTree.Expression,
                  pattern: string,
                  flags: string,
                  regexpNode:
                      | ESTree.RegExpLiteral
                      | ESTree.NewExpression
                      | ESTree.CallExpression,
              ) => RegExpVisitor.Handlers
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
    const parser = new RegExpParser()

    /**
     * Verify a given regular expression.
     * @param pattern The regular expression pattern to verify.
     * @param flags The flags of the regular expression.
     */
    function verify(
        pattern: string,
        flags: string,
        createVisitors: () => IterableIterator<RegExpVisitor.Handlers>,
    ) {
        let patternNode

        try {
            patternNode = parser.parsePattern(
                pattern,
                0,
                pattern.length,
                flags.includes("u"),
            )
        } catch {
            // Ignore regular expressions with syntax errors
            return
        }

        const handler: RegExpVisitor.Handlers = {}
        for (const visitor of createVisitors()) {
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

        visitRegExpAST(patternNode, handler)
    }

    return {
        "Program:exit": programExit,
        "Literal[regex]"(node: ESTree.RegExpLiteral) {
            verify(node.regex.pattern, node.regex.flags, function* () {
                for (const rule of rules) {
                    if (rule.createLiteralVisitor) {
                        yield rule.createLiteralVisitor(
                            node,
                            node.regex.pattern,
                            node.regex.flags,
                            node,
                        )
                    }
                }
            })
        },
        // eslint-disable-next-line complexity -- X(
        Program() {
            const scope = context.getScope()
            const tracker = new ReferenceTracker(scope)

            // Iterate calls of RegExp.
            // E.g., `new RegExp()`, `RegExp()`, `new window.RegExp()`,
            //       `const {RegExp: a} = window; new a()`, etc...
            const regexpDataList: {
                newOrCall: ESTree.NewExpression | ESTree.CallExpression
                patternNode: ESTree.Expression
                pattern: string | null
                flagsNode: ESTree.Expression | ESTree.SpreadElement | undefined
                flags: string | null
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
                const pattern = getStringIfConstant(patternNode, scope)
                const flags = flagsNode
                    ? getStringIfConstant(flagsNode, scope)
                    : null

                regexpDataList.push({
                    newOrCall,
                    patternNode,
                    pattern,
                    flagsNode,
                    flags,
                })
            }
            for (const {
                newOrCall,
                patternNode,
                pattern,
                flags,
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
                                                    r.flags === flags,
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
                    verify(pattern, flags || "", function* () {
                        for (const rule of rules) {
                            if (rule.createSourceVisitor) {
                                yield rule.createSourceVisitor(
                                    verifyPatternNode,
                                    pattern,
                                    flags || "",
                                    newOrCall,
                                )
                            }
                        }
                    })
                }
            }
        },
    }
}

export function getRegexpRange(
    sourceCode: SourceCode,
    node: ESTree.RegExpLiteral,
    regexpNode: RegExpNode,
): AST.Range
export function getRegexpRange(
    sourceCode: SourceCode,
    node: ESTree.Expression,
    regexpNode: RegExpNode,
): AST.Range | null
/**
 * Creates source range from the given regexp node
 * @param sourceCode The ESLint source code instance.
 * @param node The node to report.
 * @param regexpNode The regexp node to report.
 * @returns The SourceLocation
 */
export function getRegexpRange(
    sourceCode: SourceCode,
    node: ESTree.Expression,
    regexpNode: RegExpNode,
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
export function getRegexpLocation(
    sourceCode: SourceCode,
    node: ESTree.Expression,
    regexpNode: RegExpNode,
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

/**
 * Check if the given expression node is regexp literal.
 */
function isRegexpLiteral(
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
export function fixerApplyEscape(
    text: string,
    node: ESTree.Expression,
): string {
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
export function fixReplaceNode(
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
export function fixReplaceQuant(
    sourceCode: SourceCode,
    node: ESTree.Expression,
    quantifier: Quantifier,
    replacement: string | (() => string | null),
) {
    return (fixer: Rule.RuleFixer): Rule.Fix | null => {
        const range = getRegexpRange(sourceCode, node, quantifier)
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

        const [startOffset, endOffset] = getQuantifierOffsets(quantifier)

        return fixer.replaceTextRange(
            [range[0] + startOffset, range[0] + endOffset],
            text,
        )
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

    if (!quant.greedy) {
        return `${value}?`
    }
    return value
}

/* eslint-disable complexity -- X( */
/**
 * Check the siblings to see if the regex doesn't change when unwrapped.
 */
export function canUnwrapped(
    /* eslint-enable complexity -- X( */
    node: Element,
    text: string,
): boolean {
    const parent = node.parent
    let target: Element, alternative: Alternative
    if (parent.type === "Quantifier") {
        alternative = parent.parent
        target = parent
    } else if (parent.type === "Alternative") {
        alternative = parent
        target = node
    } else {
        return true
    }
    const index = alternative.elements.indexOf(target)
    if (index === 0) {
        return true
    }
    if (/^\d+$/u.test(text)) {
        let prevIndex = index - 1
        let prev = alternative.elements[prevIndex]
        if (prev.type === "Backreference") {
            // e.g. /()\1[0]/ -> /()\10/
            return false
        }

        while (
            prev.type === "Character" &&
            /^\d+$/u.test(prev.raw) &&
            prevIndex > 0
        ) {
            prevIndex--
            prev = alternative.elements[prevIndex]
        }
        if (prev.type === "Character" && prev.raw === "{") {
            // e.g. /a{[0]}/ -> /a{0}/
            return false
        }
    }
    if (/^[0-7]+$/u.test(text)) {
        const prev = alternative.elements[index - 1]
        if (prev.type === "Character" && /^\\[0-7]+$/u.test(prev.raw)) {
            // e.g. /\0[1]/ -> /\01/
            return false
        }
    }
    if (/^[\da-f]+$/iu.test(text)) {
        let prevIndex = index - 1
        let prev = alternative.elements[prevIndex]
        while (
            prev.type === "Character" &&
            /^[\da-f]+$/iu.test(prev.raw) &&
            prevIndex > 0
        ) {
            prevIndex--
            prev = alternative.elements[prevIndex]
        }
        if (
            prev.type === "Character" &&
            (prev.raw === "\\x" || prev.raw === "\\u")
        ) {
            // e.g. /\xF[F]/ -> /\xFF/
            // e.g. /\uF[F]FF/ -> /\xFFFF/
            return false
        }
    }
    if (/^[a-z]+$/iu.test(text)) {
        if (index > 1) {
            const prev = alternative.elements[index - 1]
            if (prev.type === "Character" && prev.raw === "c") {
                const prev2 = alternative.elements[index - 2]
                if (prev2.type === "Character" && prev2.raw === "\\") {
                    // e.g. /\c[M]/ -> /\cM/
                    return false
                }
            }
        }
    }

    return true
}
