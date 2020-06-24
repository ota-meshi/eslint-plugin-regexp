import type * as ESTree from "estree"
import type { RuleListener, RuleModule, PartialRuleModule } from "../types"
import type { RegExpVisitor } from "regexpp/visitor"
import { RegExpParser, visitRegExpAST } from "regexpp"
import {
    CALL,
    CONSTRUCT,
    ReferenceTracker,
    getStringIfConstant,
} from "eslint-utils"
import { Rule } from "eslint"

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
    rule: {
        createLiteralVisitor?: (
            node: ESTree.RegExpLiteral,
        ) => RegExpVisitor.Handlers
        createSourceVisitor?: (
            node: ESTree.Expression,
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
        createVisitor: (node: T) => RegExpVisitor.Handlers,
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

        visitRegExpAST(patternNode, createVisitor(node))
    }

    const createLiteralVisitor = rule.createLiteralVisitor
    const createSourceVisitor = rule.createSourceVisitor

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
