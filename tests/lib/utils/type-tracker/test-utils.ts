import { Linter } from "eslint"
import type { AST } from "eslint"
import type * as ES from "estree"
import type { Expression } from "estree"
import path from "path"
import { createTypeTracker } from "../../../../lib/utils/type-tracker"
import assert from "assert"
import { isCommentToken } from "@eslint-community/eslint-utils"
import type * as tsParser from "@typescript-eslint/parser"
import type { Rule } from "eslint"

export type TestCase = {
    code: string
    type: string | string[]
    languageOptions?: {
        parser?: typeof tsParser
        [key: string]: any
    }
}

const tsconfigRootDir = path.resolve(__dirname, "../../../..")
const project = "tsconfig.json"
const filename = path.join(
    tsconfigRootDir,
    "./tests/lib/utils/type-tracker/fixture.ts",
)
/**
 * Test
 */
export function testTypeTrackerWithLinter(testCase: TestCase): string[] {
    let types: string[]
    const linter = new Linter({ configType: "flat" })
    const r = linter.verify(
        testCase.code,
        {
            files: ["**/*.*"],
            plugins: {
                // @ts-expect-error -- ignore type error for eslint v9
                test: {
                    rules: {
                        test: {
                            create(context: Rule.RuleContext) {
                                const sourceCode = context.sourceCode
                                let lastExpr: Expression | null = null
                                let target: Expression | null = null
                                return {
                                    ":expression:exit"(node: Expression) {
                                        lastExpr = node
                                        if (!target) {
                                            const token:
                                                | AST.Token
                                                | ES.Comment
                                                | null =
                                                sourceCode.getTokenBefore(
                                                    node,
                                                    {
                                                        includeComments: true,
                                                    },
                                                )
                                            if (
                                                token &&
                                                isCommentToken(token) &&
                                                /^\s*target\s*$/iu.test(
                                                    token.value,
                                                )
                                            ) {
                                                target = node
                                            }
                                        }
                                    },
                                    "Program:exit"() {
                                        // if (
                                        //     context
                                        //         .getSourceCode()
                                        //         .text.includes("[{a: 's'},{a: 42}]")
                                        // ) {
                                        //     debugger
                                        // }
                                        types = createTypeTracker(
                                            context,
                                        ).getTypes(target ?? lastExpr!)
                                    },
                                }
                            },
                        },
                    },
                },
            },
            languageOptions: {
                globals: {
                    Set: "readonly",
                    Map: "readonly",
                    BigInt: "readonly",
                    window: "readonly",
                    globalThis: "readonly",
                },
                ecmaVersion: 2020,
                ...testCase.languageOptions,
                parserOptions: {
                    tsconfigRootDir,
                    project,
                    ...testCase.languageOptions?.parserOptions,
                },
            },
            rules: {
                "test/test": "error",
            },
        },
        filename,
    )
    if (r.length) {
        assert.deepStrictEqual(r, [])
    }

    assert.deepStrictEqual(
        types!,
        Array.isArray(testCase.type) ? testCase.type : [testCase.type],
    )

    return types!
}
