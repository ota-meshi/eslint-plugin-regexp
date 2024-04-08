import { SnapshotRuleTester } from "eslint-snapshot-rule-tester"
import rule from "../../../lib/rules/unicode-property"

const tester = new SnapshotRuleTester({
    languageOptions: {
        ecmaVersion: "latest",
        sourceType: "module",
    },
})

const gc = String.raw`
/\p{L}/u;
/\p{Letter}/u;
/\p{gc=L}/u;
/\p{gc=Letter}/u;
/\p{General_Category=L}/u;
/\p{General_Category=Letter}/u;
`.trim()

const keyValue = String.raw`
${gc}

/\p{sc=Grek}/u;
/\p{sc=Greek}/u;
/\p{Script=Grek}/u;
/\p{Script=Greek}/u;

/\p{scx=Grek}/u;
/\p{scx=Greek}/u;
/\p{Script_Extensions=Grek}/u;
/\p{Script_Extensions=Greek}/u;
`.trim()

// annoyingly, some have 2 aliases
const interesting = String.raw`
// Binary Properties
// https://github.com/tc39/ecma262/issues/3286
// /\p{White_Space} \p{space} \p{WSpace}/u;

// General_Category
/\p{Control} \p{Cc} \p{cntrl}/u;
/\p{Mark} \p{M} \p{Combining_Mark}/u;
/\p{Decimal_Number} \p{Nd} \p{digit}/u;
/\p{Punctuation} \p{P} \p{punct}/u;
`.trim()

const allForms = String.raw`
/\P{ASCII}/u;
/\P{Hex_Digit}/u;
/\P{Hex}/u;

${keyValue}

${interesting}
`.trim()

tester.run("unicode-property", rule as any, {
    valid: [
        {
            code: allForms,
            options: [
                {
                    generalCategory: "ignore",
                    key: "ignore",
                    property: "ignore",
                },
            ],
        },
    ],
    invalid: [
        {
            name: "test default configuration",
            code: allForms,
        },
        {
            code: gc,
            options: [
                {
                    generalCategory: "always",
                    key: "ignore",
                    property: "ignore",
                },
            ],
        },
        {
            code: gc,
            options: [
                { generalCategory: "never", key: "ignore", property: "ignore" },
            ],
        },
        {
            code: keyValue,
            options: [
                { generalCategory: "ignore", key: "long", property: "ignore" },
            ],
        },
        {
            code: keyValue,
            options: [
                { generalCategory: "ignore", key: "short", property: "ignore" },
            ],
        },
        {
            code: allForms,
            options: [
                { generalCategory: "ignore", key: "ignore", property: "long" },
            ],
        },
        {
            code: allForms,
            options: [
                { generalCategory: "ignore", key: "ignore", property: "short" },
            ],
        },
        {
            code: allForms,
            options: [
                {
                    generalCategory: "ignore",
                    key: "ignore",
                    property: {
                        binary: "short",
                        generalCategory: "long",
                        script: "ignore",
                    },
                },
            ],
        },
        {
            code: allForms,
            options: [
                {
                    generalCategory: "ignore",
                    key: "ignore",
                    property: {
                        binary: "long",
                        generalCategory: "ignore",
                        script: "short",
                    },
                },
            ],
        },
    ],
})
