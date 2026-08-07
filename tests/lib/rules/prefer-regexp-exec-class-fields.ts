import module from "node:module"
import * as tsParser from "@typescript-eslint/parser"
import { RuleTester } from "eslint"
import rule from "../../../lib/rules/prefer-regexp-exec.ts"

const require = module.createRequire(import.meta.url)
const filename = "tests/lib/rules/prefer-regexp-exec-class-fields.ts"
const languageOptions = {
    parser: tsParser,
    parserOptions: {
        project: require.resolve("../../../tsconfig.json"),
        disallowAutomaticSingleRunInference: true,
    },
}

const tester = new RuleTester({
    languageOptions: {
        ecmaVersion: "latest",
        sourceType: "module",
    },
})

tester.run("prefer-regexp-exec class fields", rule as any, {
    valid: [
        {
            filename,
            code: String.raw`
            class MutablePath {
                private PATH_REGEXP: RegExp = /^.*\//;

                getLogPath(filepath: string): string | undefined {
                    return filepath.match(this.PATH_REGEXP)?.[0];
                }
            }
            `,
            languageOptions,
        },
        {
            filename,
            code: String.raw`
            class MutableConstructorPath {
                private PATH_REGEXP: RegExp;

                constructor() {
                    this.PATH_REGEXP = /^.*\//;
                }

                getLogPath(filepath: string): string | undefined {
                    return filepath.match(this.PATH_REGEXP)?.[0];
                }
            }
            `,
            languageOptions,
        },
        {
            filename,
            code: String.raw`
            class PrivateGlobalPath {
                private readonly PATH_REGEXP: RegExp = /^.*\//g;

                getLogPath(filepath: string): string | undefined {
                    return filepath.match(this.PATH_REGEXP)?.[0];
                }
            }
            `,
            languageOptions,
        },
        {
            filename,
            code: String.raw`
            class ConstructorGlobalPath {
                private readonly PATH_REGEXP: RegExp;

                constructor() {
                    this.PATH_REGEXP = /^.*\//g;
                }

                getLogPath(filepath: string): string | undefined {
                    return filepath.match(this.PATH_REGEXP)?.[0];
                }
            }
            `,
            languageOptions,
        },
    ],
    invalid: [
        {
            filename,
            code: String.raw`
            class PrivatePath {
                private readonly PATH_REGEXP: RegExp = /^.*\//;

                getLogPath(filepath: string): string | undefined {
                    return filepath.match(this.PATH_REGEXP)?.[0];
                }
            }
            `,
            languageOptions,
            errors: [{ messageId: "disallow" }],
        },
        {
            filename,
            code: String.raw`
            class ConstructorPath {
                private readonly PATH_REGEXP: RegExp;

                constructor() {
                    this.PATH_REGEXP = /^.*\//;
                }

                getLogPath(filepath: string): string | undefined {
                    return filepath.match(this.PATH_REGEXP)?.[0];
                }
            }
            `,
            languageOptions,
            errors: [{ messageId: "disallow" }],
        },
    ],
})
