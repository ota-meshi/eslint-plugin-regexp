import type * as ESTree from "estree"
import type { RuleListener, RuleModule, PartialRuleModule } from "../types"
import type { RegExpVisitor } from "regexpp/visitor"
import type { Node as RegExpNode } from "regexpp/ast"
import { RegExpParser, visitRegExpAST } from "regexpp"
import {
    CALL,
    CONSTRUCT,
    ReferenceTracker,
    getStringIfConstant,
} from "eslint-utils"
import type { Rule, AST, SourceCode } from "eslint"

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
        create: rule.create as any,
    }
}

/**
 * Define the RegExp visitor rule.
 */
export function defineRegexpVisitor(
    context: Rule.RuleContext,
    rule:
        | {
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
        | {
              createVisitor?: (
                  node: ESTree.Expression,
                  pattern: string,
                  flags: string,
              ) => RegExpVisitor.Handlers
          },
): RuleListener {
    const parser = new RegExpParser()

    /**
     * Verify a given regular expression.
     * @param node The node to report.
     * @param pattern The regular expression pattern to verify.
     * @param flags The flags of the regular expression.
     */
    function verify<T extends ESTree.Expression>(
        node: T,
        pattern: string,
        flags: string,
        createVisitor: (
            node: T,
            pattern: string,
            flags: string,
        ) => RegExpVisitor.Handlers,
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

        visitRegExpAST(patternNode, createVisitor(node, pattern, flags))
    }

    const createLiteralVisitor =
        "createVisitor" in rule
            ? rule.createVisitor
            : "createLiteralVisitor" in rule
            ? rule.createLiteralVisitor
            : null
    const createSourceVisitor =
        "createVisitor" in rule
            ? rule.createVisitor
            : "createSourceVisitor" in rule
            ? rule.createSourceVisitor
            : null

    return {
        ...(createLiteralVisitor
            ? {
                  "Literal[regex]"(node: ESTree.RegExpLiteral) {
                      verify(
                          node,
                          node.regex.pattern,
                          node.regex.flags,
                          createLiteralVisitor,
                      )
                  },
              }
            : null),
        ...(createSourceVisitor
            ? {
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
                          if (
                              !patternNode ||
                              patternNode.type === "SpreadElement"
                          ) {
                              continue
                          }
                          const pattern = getStringIfConstant(
                              patternNode,
                              scope,
                          )
                          const flags = getStringIfConstant(flagsNode, scope)

                          if (typeof pattern === "string") {
                              verify(
                                  patternNode,
                                  pattern,
                                  flags || "",
                                  createSourceVisitor,
                              )
                          }
                      }
                  },
              }
            : null),
    }
}

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
 * @returns The SourceLocation
 */
export function getRegexpLocation(
    sourceCode: SourceCode,
    node: ESTree.Expression,
    regexpNode: RegExpNode,
): AST.SourceLocation {
    const range = getRegexpRange(sourceCode, node, regexpNode)
    if (range == null) {
        return node.loc!
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
    if (!(node.value instanceof RegExp)) {
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

export const FLAG_GLOBAL = "g"
export const FLAG_DOTALL = "s"
export const FLAG_IGNORECASE = "i"
export const FLAG_MULTILINE = "m"
export const FLAG_STICKY = "y"
export const FLAG_UNICODE = "u"

export const CP_DIGIT_ZERO = "0".codePointAt(0)!
export const CP_DIGIT_NINE = "9".codePointAt(0)!
export const CP_SMALL_A = "a".codePointAt(0)!
export const CP_SMALL_Z = "z".codePointAt(0)!
export const CP_CAPITAL_A = "A".codePointAt(0)!
export const CP_CAPITAL_Z = "Z".codePointAt(0)!
export const CP_LOW_LINE = "_".codePointAt(0)!
