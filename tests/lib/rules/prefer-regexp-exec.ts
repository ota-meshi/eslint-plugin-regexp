import module from "node:module"
import * as tsParser from "@typescript-eslint/parser"
import { SnapshotRuleTester } from "eslint-snapshot-rule-tester"
import rule from "../../../lib/rules/prefer-regexp-exec.ts"

const require = module.createRequire(import.meta.url)
const filename = "tests/lib/rules/prefer-regexp-exec.ts"

const tester = new SnapshotRuleTester({
    languageOptions: {
        ecmaVersion: "latest",
        sourceType: "module",
    },
})

tester.run("prefer-regexp-exec", rule as any, {
    valid: [
        `
        /thing/.exec('something');

        'some things are just things'.match(/thing/g);

        const text = 'something';
        const search = /thing/;
        search.exec(text);
        `,
        `
        /thin[[g]]/v.exec('something');
        `,
        {
            filename,
            code: String.raw`
            class Path {
                protected readonly PATH_REGEXP: RegExp = /^.*\//g;

                protected getLogPath(filepath: string): string | undefined {
                    const match = filepath.match(this.PATH_REGEXP);
                    return match?.[0];
                }
            }
            `,
            files: ["**/*.*"],
            languageOptions: {
                parser: tsParser,
                parserOptions: {
                    project: require.resolve("../../../tsconfig.json"),
                    disallowAutomaticSingleRunInference: true,
                },
            },
        },
    ],
    invalid: [
        `
            'something'.match(/thing/);

            'some things are just things'.match(/thing/);

            const text = 'something';
            const search = /thing/;
            text.match(search);
            `,
        `
            const fn = (a) => a + ''
            fn(1).match(search);
            `,
        `
            const v = a + b
            v.match(search);

            const n = 1 + 2
            n.match(search); // ignore
            `,
        `
            'something'.match(/thin[[g]]/v);
            `,
    ],
})
