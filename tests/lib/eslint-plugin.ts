import assert from "assert"
import path from "path"
import { fileURLToPath } from "url"
import * as eslintModule from "eslint"

// -----------------------------------------------------------------------------
// Tests
// -----------------------------------------------------------------------------

// @ts-expect-error -- ?
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const TEST_CWD_FOR_FLAT_CONFIG = path.join(
    __dirname,
    "../fixtures/integrations/eslint-plugin",
)

// eslint-disable-next-line @typescript-eslint/no-misused-promises -- bug ?
describe("Integration with eslint-plugin-regexp", async () => {
    const FlatESLint =
        typeof eslintModule.loadESLint === "function"
            ? await eslintModule.loadESLint({ useFlatConfig: true })
            : null
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
                    "regexp/use-ignore-case",
                ],
            )
        })
    }
})
