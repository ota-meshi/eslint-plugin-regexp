import cp from "node:child_process"
import fs from "node:fs"
import path from "node:path"
const logger = console
const __dirname = import.meta.dirname

// main
;((ruleId) => {
    if (ruleId == null) {
        logger.error("Usage: npm run new <RuleID>")
        process.exitCode = 1
        return
    }
    if (!/^[\w-]+$/u.test(ruleId)) {
        logger.error("Invalid RuleID '%s'.", ruleId)
        process.exitCode = 1
        return
    }

    const ruleFile = path.resolve(__dirname, `../lib/rules/${ruleId}.ts`)
    const testFile = path.resolve(__dirname, `../tests/lib/rules/${ruleId}.ts`)
    const docFile = path.resolve(__dirname, `../docs/rules/${ruleId}.md`)

    fs.writeFileSync(
        ruleFile,
        `
import type { Expression } from "estree"
import type { RegExpVisitor } from "@eslint-community/regexpp/visitor"
import type { CharacterClass } from "@eslint-community/regexpp/ast"
import { createRule, defineRegexpVisitor, RegExpContext } from "../utils"

export default createRule("${ruleId}", {
    meta: {
        docs: {
            description: "",
            category: "Best Practices",
            // TODO Switch to recommended in the major version.
            // recommended: true,
            recommended: false,
        },
        schema: [],
        messages: {},
        type: "suggestion", // "problem",
    },
    create(context) {

        function createVisitor(regexpContext: RegExpContext): RegExpVisitor.Handlers {
            const { node, flags, getRegexpLocation } = regexpContext
        }
        return defineRegexpVisitor(context, {
            createVisitor,
        })
    },
})
`,
    )
    fs.writeFileSync(
        testFile,
        `import { SnapshotRuleTester } from "eslint-snapshot-rule-tester"
import rule from "../../../lib/rules/${ruleId}"

const tester = new SnapshotRuleTester({
    languageOptions: {
        ecmaVersion: "latest",
        sourceType: "module",
    },
})

tester.run("${ruleId}", rule as any, {
    valid: [
        \`/regexp/\`
    ],
    invalid: [
        \`/regexp/\`
    ],
})
`,
    )
    fs.writeFileSync(
        docFile,
        `#  (regexp/${ruleId})

> description

## :book: Rule Details

This rule reports ???.

<eslint-code-block>

<!-- eslint-skip -->

\`\`\`js
/* eslint regexp/${ruleId}: "error" */

/* ✓ GOOD */


/* ✗ BAD */

\`\`\`

</eslint-code-block>

## :wrench: Options

\`\`\`json
{
  "regexp/${ruleId}": ["error", {

  }]
}
\`\`\`

-

## :books: Further reading

-

`,
    )

    cp.execSync(`code "${ruleFile}"`)
    cp.execSync(`code "${testFile}"`)
    cp.execSync(`code "${docFile}"`)
})(process.argv[2])
