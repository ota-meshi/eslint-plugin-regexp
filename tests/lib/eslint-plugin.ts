import path from "path"
import assert from "assert"
import { ESLint } from "eslint"
import plugin from "../../lib/index"

// -----------------------------------------------------------------------------
// Tests
// -----------------------------------------------------------------------------

const TEST_CWD = path.join(__dirname, "../fixtures/integrations/eslint-plugin")

describe("Integration with eslint-plugin-regexp", () => {
    it("should lint without errors", async () => {
        let results: ESLint.LintResult[]
        if (ESLint) {
            const eslint = new ESLint({
                cwd: TEST_CWD,
                plugins: { "eslint-plugin-regexp": plugin },
            })
            results = await eslint.lintFiles(["test.js"])
        } else {
            // eslint-disable-next-line new-cap, @typescript-eslint/no-var-requires, @typescript-eslint/no-require-imports -- ignore
            const engine = require("eslint").CLIEngine({
                cwd: TEST_CWD,
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
            ],
        )
    })
})
