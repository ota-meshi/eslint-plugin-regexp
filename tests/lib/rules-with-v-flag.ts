import { Linter } from "eslint"
import * as parser from "@typescript-eslint/parser"
import { rules } from "../../lib/index"
import assert from "assert"

describe("Don't crash even if with v flag.", () => {
    const elements = [
        // Character
        "a",
        // CharacterClass
        "[abc]",
        "[^abc]",
        // CharacterClassRange
        "[a-z]",
        "[^a-z]",
        // EscapeCharacterSet
        String.raw`\d`,
        String.raw`\D`,
        String.raw`\s`,
        String.raw`\S`,
        String.raw`\s`,
        String.raw`\W`,
        // UnicodePropertyCharacterSet
        String.raw`\p{ASCII}`,
        String.raw`\P{ASCII}`,
        // ClassIntersection
        `[a&&b]`,
        `[^a&&b]`,
        // ClassStringDisjunction
        String.raw`[\q{a|b|c}]`,
        // ClassSubtraction
        `[a--b]`,
        `[^a--b]`,
    ]
    const alternatives = [
        // Alternative
        "a|b",
        // LookaheadAssertion
        "(?=ab)",
        "(?!ab)",
        // LookbehindAssertion
        `(?<=ab)`,
        `(?<!ab)`,
        // WordBoundaryAssertion
        String.raw`\b`,
        String.raw`\B`,
        // AnyCharacterSet
        ".",
        // Quantifier
        `a?`,
        `a*`,
        `a+`,
        `a{1,2}`,
        `a??`,
        `a*?`,
        `a+?`,
        `a{1,2}?`,
        elements.join(""),
        `[${elements.join("")}]`,
        `[^${elements.join("")}]`,
    ]
    const patternsWithGroup = [
        // Group
        `(?:${alternatives.join("")})`,
        // CapturingGroup
        `(${alternatives.join("")})`,
    ]
    const patternsWithBackreference = [
        String.raw`(a)\1`,
        String.raw`(?<name>a)\k<name>`,
    ]
    const patternWithEdgeAssertion = [
        alternatives.join(""),
        ...patternsWithGroup,
        ...patternsWithBackreference,
    ].map((p) => `^${p}$`)
    const patterns = [
        alternatives.join(""),
        ...patternsWithGroup,
        ...patternWithEdgeAssertion,
    ]
    const code = patterns
        .flatMap((p, i) => [
            `export const re${i + 1} = /${p}/v`,
            `export const re${i + 1}i = /${p}/iv`,
        ])
        .join(";\n")

    const RULE_SPECIFIC_HAS_ERROR: Record<
        string,
        number | boolean | undefined
    > = {
        "regexp/no-empty-character-class": true,
        "regexp/no-super-linear-backtracking": true,
        "regexp/no-useless-assertions": true,
        "regexp/order-in-character-class": true,
        "regexp/prefer-named-capture-group": true,
        "regexp/sort-character-class-elements": true,
        "regexp/optimal-quantifier-concatenation": true,
    }

    for (const key of Object.keys(rules)) {
        const rule = rules[key]
        const ruleId = rule.meta.docs.ruleId

        it(ruleId, () => {
            const linter = new Linter()
            const config: Linter.Config = {
                parser: "@typescript-eslint/parser",
                parserOptions: {
                    ecmaVersion: "latest",
                    sourceType: "module",
                },
                rules: {
                    [ruleId]: "error",
                },
            }
            // @ts-expect-error -- ignore
            linter.defineParser("@typescript-eslint/parser", parser)
            linter.defineRule(ruleId, rule)

            const resultVue = linter.verifyAndFix(code, config, "test.js")

            const expected = RULE_SPECIFIC_HAS_ERROR[ruleId] ?? false
            if (expected === false) {
                assert.deepStrictEqual(
                    resultVue.messages.map((m) => m.message),
                    [],
                )
            } else if (typeof expected === "number") {
                assert.deepStrictEqual(
                    resultVue.messages.map((m) => ({
                        ruleId: m.ruleId,
                    })),
                    Array(expected).fill({ ruleId }),
                )
            } else {
                assert.deepStrictEqual(
                    resultVue.messages.map((m) => ({
                        ruleId: m.ruleId,
                    })),
                    Array(resultVue.messages.length).fill({ ruleId }),
                )
            }
        })
    }
})
