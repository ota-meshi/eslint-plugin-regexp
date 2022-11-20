import { RuleTester } from "eslint"
import rule from "../../../lib/rules/no-useless-lookaround-assertions"

const tester = new RuleTester({
    parserOptions: {
        ecmaVersion: 2020,
        sourceType: "module",
    },
})

tester.run("no-useless-lookaround-assertions", rule as any, {
    valid: [
        `console.log('JavaScript'.replace(/Java(?=Script)/u, 'Type'))`,
        `console.log('JavaScript'.replace(/(?<=Java)Script/u, ''))`,
    ],
    invalid: [
        {
            code: `console.log('JavaScript'.replace(/Java(?=Scrip(?=t))/u, 'Type'))`,
            output: `console.log('JavaScript'.replace(/Java(?=Script)/u, 'Type'))`,
            errors: [
                {
                    message: "This lookahead assertion is useless.",
                    column: 47,
                },
            ],
        },
        {
            code: `console.log('JavaScript'.replace(/(?<=(?<=J)ava)Script/u, ''))`,
            output: `console.log('JavaScript'.replace(/(?<=Java)Script/u, ''))`,
            errors: [
                {
                    message: "This lookbehind assertion is useless.",
                    column: 39,
                },
            ],
        },
        // Within negate
        {
            code: `console.log('JavaScript Java JavaRuntime'.replace(/Java(?!Scrip(?=t))/gu, 'Python'))`,
            output: `console.log('JavaScript Java JavaRuntime'.replace(/Java(?!Script)/gu, 'Python'))`,
            errors: [
                {
                    message: "This lookahead assertion is useless.",
                    column: 64,
                },
            ],
        },
        {
            code: `console.log('JavaScript TypeScript ActionScript'.replace(/(?<!(?<=J)ava)Script/gu, 'ScriptCompiler'))`,
            output: `console.log('JavaScript TypeScript ActionScript'.replace(/(?<!Java)Script/gu, 'ScriptCompiler'))`,
            errors: [
                {
                    message: "This lookbehind assertion is useless.",
                    column: 63,
                },
            ],
        },
        // Multiple alternatives
        {
            code: `console.log('JavaScriptChecker JavaScriptLinter'.replace(/Java(?=Script(?=Checker|Linter))/gu, 'Type'))`,
            output: `console.log('JavaScriptChecker JavaScriptLinter'.replace(/Java(?=Script(?:Checker|Linter))/gu, 'Type'))`,
            errors: [
                {
                    message: "This lookahead assertion is useless.",
                    column: 72,
                },
            ],
        },
        {
            code: `console.log('JavaScriptChecker JavaScriptLinter'.replace(/Java(?=Script(?=(?:Check|Lint)er))/gu, 'Type'))`,
            output: `console.log('JavaScriptChecker JavaScriptLinter'.replace(/Java(?=Script(?:Check|Lint)er)/gu, 'Type'))`,
            errors: [
                {
                    message: "This lookahead assertion is useless.",
                    column: 72,
                },
            ],
        },
        {
            code: `console.log('ESLint JSLint TSLint'.replace(/(?<=(?<=J|T)S)Lint/gu, '-Runtime'))`,
            output: `console.log('ESLint JSLint TSLint'.replace(/(?<=(?:J|T)S)Lint/gu, '-Runtime'))`,
            errors: [
                {
                    message: "This lookbehind assertion is useless.",
                    column: 49,
                },
            ],
        },
        {
            code: `console.log('JavaScriptChecker JavaScriptLinter'.replace(/Java(?=Script(?=Checker)|Script(?=Linter))/gu, 'Type'))`,
            output: `console.log('JavaScriptChecker JavaScriptLinter'.replace(/Java(?=ScriptChecker|ScriptLinter)/gu, 'Type'))`,
            errors: [
                {
                    message: "This lookahead assertion is useless.",
                    column: 72,
                },
                {
                    message: "This lookahead assertion is useless.",
                    column: 90,
                },
            ],
        },
        {
            code: `console.log('ESLint JSLint TSLint'.replace(/(?<=(?<=J)S|(?<=T)S)Lint/gu, '-Runtime'))`,
            output: `console.log('ESLint JSLint TSLint'.replace(/(?<=JS|TS)Lint/gu, '-Runtime'))`,
            errors: [
                {
                    message: "This lookbehind assertion is useless.",
                    column: 49,
                },
                {
                    message: "This lookbehind assertion is useless.",
                    column: 57,
                },
            ],
        },
    ],
})
