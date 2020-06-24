import { RuleTester } from "eslint"
const rule = require("../../../lib/rules/no-dupe-characters-character-class")

const tester = new RuleTester({
    parserOptions: {
        ecmaVersion: 2019,
        sourceType: "module",
    },
})

tester.run("no-parsing-error", rule, {})
