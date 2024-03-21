import assert from "assert"
import path from "path"
import * as eslintModule from "eslint"
import * as plugin from "../../lib/index"

// -----------------------------------------------------------------------------
// Tests
// -----------------------------------------------------------------------------

const TEST_CWD_FOR_FLAT_CONFIG = path.join(
    __dirname,
    "../fixtures/integrations/eslint-plugin",
)
const TEST_CWD_FOR_LEGACY_CONFIG = path.join(
    __dirname,
    "../fixtures/integrations/eslint-plugin-legacy-config",
)

// eslint-disable-next-line @typescript-eslint/no-misused-promises -- bug ?
describe("Integration with eslint-plugin-regexp", async () => {
    const FlatESLint: typeof eslintModule.ESLint =
        // @ts-expect-error -- new API
        typeof eslintModule.loadESLint === "function"
            ? // @ts-expect-error -- new API
              await eslintModule.loadESLint({ useFlatConfig: true })
            : null
    const ESLint: typeof eslintModule.ESLint =
        // @ts-expect-error -- new API
        typeof eslintModule.loadESLint === "function"
            ? // @ts-expect-error -- new API
              await eslintModule.loadESLint({ useFlatConfig: false })
            : eslintModule.ESLint
    if (FlatESLint) {
        it("should lint without errors (with flat config)", async () => {
            const eslint = new FlatESLint({
                cwd: TEST_CWD_FOR_FLAT_CONFIG,
            })
            const results: eslintModule.ESLint.LintResult[] =
                await eslint.lintFiles(["test.js"])

            assert.strictEqual(results.length, 1)
            assert.deepStrictEqual(
                results[0].messages.map((m) => m.ruleId),
                [
                    "regexp/no-dupe-characters-character-class",
                    "regexp/prefer-w",
                    "regexp/prefer-d",
                    "regexp/prefer-d",
                    "regexp/use-ignore-case",
                ],
            )
        })
    }
    it("should lint without errors (with legacy config)", async () => {
        let results: eslintModule.ESLint.LintResult[]
        if (ESLint) {
            const eslint = new ESLint({
                cwd: TEST_CWD_FOR_LEGACY_CONFIG,
                plugins: { "eslint-plugin-regexp": plugin as never },
            })
            results = await eslint.lintFiles(["test.js"])
        } else {
            // eslint-disable-next-line @typescript-eslint/no-var-requires, @typescript-eslint/no-require-imports -- ignore
            const engine = new (require("eslint").CLIEngine)({
                cwd: TEST_CWD_FOR_LEGACY_CONFIG,
            })
            engine.addPlugin("eslint-plugin-regexp", plugin)
            results = engine.executeOnFiles(["test.js"]).results
        }

        assert.strictEqual(results.length, 1)
        assert.deepStrictEqual(
            results[0].messages.map((m) => m.ruleId),
            [
                "regexp/no-dupe-characters-character-class",
                "regexp/prefer-w",
                "regexp/prefer-d",
                "regexp/prefer-d",
                "regexp/use-ignore-case",
            ],
        )
    })
})
