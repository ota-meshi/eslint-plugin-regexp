import { RuleTester } from "../rule-tester"
import rule from "../../../lib/rules/no-legacy-features"
import * as tsParser from "@typescript-eslint/parser"

const tester = new RuleTester({
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
            return {
                code: `RegExp["${sp}"]`,
                errors: [`'RegExp.${sp}' static property is forbidden.`],
            }
        }),
        ...STATIC_PROPERTIES.filter((sp) => /^[\w$]+$/u.test(sp)).map((sp) => {
            return {
                code: `RegExp.${sp}`,
                errors: [`'RegExp.${sp}' static property is forbidden.`],
            }
        }),
        ...PROTOTYPE_METHODS.map((pm) => {
            return {
                code: `
                const regexObj = new RegExp('foo', 'gi');
                regexObj.${pm}`,
                errors: ["RegExp.prototype.compile method is forbidden."],
            }
        }),
        ...PROTOTYPE_METHODS.map((pm) => {
            return {
                code: `
                const regexObj = /foo/;
                regexObj.${pm}('new foo', 'g')`,
                errors: ["RegExp.prototype.compile method is forbidden."],
            }
        }),
    ],
})
