import { Linter } from "eslint"
import type { AST } from "eslint"
import type * as ES from "estree"
import type { Expression } from "estree"
import path from "path"
import { createTypeTracker } from "../../../../lib/utils/type-tracker"
import * as tsParser from "@typescript-eslint/parser"
import assert from "assert"
import { isCommentToken } from "eslint-utils"
import { isParenthesized } from "../../../../lib/utils/type-tracker/utils"

export type TestCase = {
    code: string
    type: string | string[]
    parser?: string
    parserOptions?: any
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
    const linter = new Linter()
    linter.defineRule("test", {
        create(context) {
            const sourceCode = context.getSourceCode()
            let lastExpr: Expression | null = null
            let target: Expression | null = null
            const typeTracer = createTypeTracker(context)
            return {
                ...typeTracer.getCodePathVisitor(),
                ":expression:exit"(node: Expression) {
                    lastExpr = node
                    if (!target) {
                        let token:
                            | AST.Token
                            | ES.Comment
                            | null = sourceCode.getTokenBefore(node, {
                            includeComments: true,
                        })
                        if (
                            token?.value === "(" &&
                            isParenthesized(context, node)
                        ) {
                            token = sourceCode.getTokenBefore(token, {
                                includeComments: true,
                            })
                        }

                        if (
                            token &&
                            isCommentToken(token) &&
                            /^\s*target\s*$/iu.test(token.value)
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
                    types = typeTracer.getTypes(target ?? lastExpr!)
                },
            }
        },
    })
    linter.defineParser("@typescript-eslint/parser", tsParser as never)
    const r = linter.verify(
        testCase.code,
        {
            globals: {
                Set: "readonly",
                Map: "readonly",
                BigInt: "readonly",
                window: "readonly",
                globalThis: "readonly",
                Array: "readonly",
            },
            parser: testCase.parser,
            parserOptions: {
                ecmaVersion: 2020,
                ...(testCase.parserOptions ?? {}),
                tsconfigRootDir,
                project,
            },
            rules: {
                test: "error",
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
