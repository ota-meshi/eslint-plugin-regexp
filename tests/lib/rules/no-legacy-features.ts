import * as tsParser from "@typescript-eslint/parser"
import { SnapshotRuleTester } from "eslint-snapshot-rule-tester"
import rule from "../../../lib/rules/no-legacy-features.ts"

const tester = new SnapshotRuleTester({
    languageOptions: {
        ecmaVersion: "latest",
        sourceType: "module",
    },
})

const STATIC_PROPERTIES: string[] = [
    "input",
    "$_",
    "lastMatch",
    "$&",
    "lastParen",
    "$+",
    "leftContext",
    "$`",
    "rightContext",
    "$'",
    "$1",
    "$2",
    "$3",
    "$4",
    "$5",
    "$6",
    "$7",
    "$8",
    "$9",
]
const PROTOTYPE_METHODS: string[] = ["compile"]

tester.run("no-legacy-features", rule as any, {
    valid: [
        `RegExp`,
        `new RegExp()`,
        `RegExp.unknown`,
        {
            // https://github.com/ota-meshi/eslint-plugin-regexp/issues/378
            filename: "loglevel.d.ts",
            code: `
            import log from 'loglevel';
            export as namespace log;
            export = log;
            `,
            files: ["**/*.*"],
            languageOptions: {
                parser: tsParser,
            },
        },
    ],
    invalid: [
        ...STATIC_PROPERTIES.map((sp) => {
            return `RegExp["${sp}"]`
        }),
        ...STATIC_PROPERTIES.filter((sp) => /^[\w$]+$/u.test(sp)).map((sp) => {
            return `RegExp.${sp}`
        }),
        ...PROTOTYPE_METHODS.map((pm) => {
            return `const regexObj = new RegExp('foo', 'gi');\nregexObj.${pm}`
        }),
        ...PROTOTYPE_METHODS.map((pm) => {
            return `const regexObj = /foo/;\nregexObj.${pm}('new foo', 'g')`
        }),
    ],
})
