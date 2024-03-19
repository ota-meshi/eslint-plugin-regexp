import { SnapshotRuleTester } from "eslint-snapshot-rule-tester"
import rule from "../../../lib/rules/no-extra-lookaround-assertions"

const tester = new SnapshotRuleTester({
    languageOptions: {
        ecmaVersion: "latest",
        sourceType: "module",
    },
})

tester.run("no-extra-lookaround-assertions", rule as any, {
    valid: [
        `console.log('JavaScript'.replace(/Java(?=Script)/u, 'Type'))`,
        `console.log('JavaScript'.replace(/(?<=Java)Script/u, ''))`,
        String.raw`console.log('JavaScript'.replace(/(?<=[\q{Java}])Script/v, ''))`,
    ],
    invalid: [
        `console.log('JavaScript'.replace(/Java(?=Scrip(?=t))/u, 'Type'))`,
        `console.log('JavaScript'.replace(/(?<=(?<=J)ava)Script/u, ''))`,
        // Within negate
        `console.log('JavaScript Java JavaRuntime'.replace(/Java(?!Scrip(?=t))/gu, 'Python'))`,
        `console.log('JavaScript TypeScript ActionScript'.replace(/(?<!(?<=J)ava)Script/gu, 'ScriptCompiler'))`,
        // Multiple alternatives
        `console.log('JavaScriptChecker JavaScriptLinter'.replace(/Java(?=Script(?=Checker|Linter))/gu, 'Type'))`,
        `console.log('JavaScriptChecker JavaScriptLinter'.replace(/Java(?=Script(?=(?:Check|Lint)er))/gu, 'Type'))`,
        `console.log('ESLint JSLint TSLint'.replace(/(?<=(?<=J|T)S)Lint/gu, '-Runtime'))`,
        `console.log('JavaScriptChecker JavaScriptLinter'.replace(/Java(?=Script(?=Checker)|Script(?=Linter))/gu, 'Type'))`,
        `console.log('ESLint JSLint TSLint'.replace(/(?<=(?<=J)S|(?<=T)S)Lint/gu, '-Runtime'))`,
        String.raw`console.log('JavaScript'.replace(/Java(?=Scrip(?=[\q{t}]))/v, 'Type'))`,
    ],
})
