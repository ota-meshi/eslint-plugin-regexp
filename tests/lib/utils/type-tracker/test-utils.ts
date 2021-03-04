import { Linter } from "eslint"
import type { Expression } from "estree"
import path from "path"
import { createTypeTracker } from "../../../../lib/utils/type-tracker"
import * as tsParser from "@typescript-eslint/parser"
import assert from "assert"

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
            let lastExpr: Expression | null = null
            return {
                ":expression:exit"(node: Expression) {
                    lastExpr = node
                },
                "Program:exit"() {
                    // if (
                    //     context
                    //         .getSourceCode()
                    //         .text.includes("[{a: 's'},{a: 42}]")
                    // ) {
                    //     debugger
                    // }
                    types = createTypeTracker(context).getTypes(lastExpr!)
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
