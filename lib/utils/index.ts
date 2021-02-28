import type * as ESTree from "estree"
import type { RuleListener, RuleModule, PartialRuleModule } from "../types"
import type { RegExpVisitor } from "regexpp/visitor"
import type { Node as RegExpNode, Quantifier } from "regexpp/ast"
import { RegExpParser, visitRegExpAST } from "regexpp"
import {
    CALL,
    CONSTRUCT,
    ReferenceTracker,
    getStringIfConstant,
    findVariable,
} from "eslint-utils"
import type { Rule, AST, SourceCode } from "eslint"
export * from "./unicode"

type RegexpRule = {
    createLiteralVisitor?: (
        node: ESTree.RegExpLiteral,
        pattern: string,
        flags: string,
    ) => RegExpVisitor.Handlers
    createSourceVisitor?: (
        node: ESTree.Expression,
        pattern: string,
        flags: string,
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
                        )
                    }
                }
            })
        },
        Program() {
            const scope = context.getScope()
            const tracker = new ReferenceTracker(scope)

            // Iterate calls of RegExp.
            // E.g., `new RegExp()`, `RegExp()`, `new window.RegExp()`,
            //       `const {RegExp: a} = window; new a()`, etc...
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
                const flags = getStringIfConstant(flagsNode, scope)

                if (typeof pattern === "string") {
                    let verifyPatternNode = patternNode
                    if (patternNode.type === "Identifier") {
                        const variable = findVariable(
                            context.getScope(),
                            patternNode,
                        )
                        if (variable && variable.defs.length === 1) {
                            const def = variable.defs[0]
                            if (
                                def.type === "Variable" &&
                                def.parent.kind === "const" &&
                                def.node.init &&
                                def.node.init.type === "Literal"
                            ) {
                                verifyPatternNode = def.node.init
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
): AST.Range | null {
    if (!availableRegexpLocation(sourceCode, node)) {
        return null
    }
    const nodeStart = node.range![0] + 1
    return [nodeStart + regexpNode.start, nodeStart + regexpNode.end]
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
 * Check if the location of the regular expression node is available.
 * @param sourceCode The ESLint source code instance.
 * @param node The node to check.
 * @returns `true` if the location of the regular expression node is available.
 */
export function availableRegexpLocation(
    sourceCode: SourceCode,
    node: ESTree.Expression,
): boolean {
    if (node.type !== "Literal") {
        return false
    }
    if (!(node as ESTree.RegExpLiteral).regex) {
        if (typeof node.value !== "string") {
            return false
        }
        if (
            sourceCode.text.slice(node.range![0] + 1, node.range![1] - 1) !==
            node.value
        ) {
            return false
        }
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
 * Get the offsets of the given quantifier
 */
export function getQuantifierOffsets(qNode: Quantifier): [number, number] {
    const startOffset = qNode.element.end - qNode.start
    const endOffset = qNode.raw.length - (qNode.greedy ? 0 : 1)
    return [startOffset, endOffset]
}
