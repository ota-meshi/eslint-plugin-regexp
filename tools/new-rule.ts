import path from "path"
import fs from "fs"
import cp from "child_process"
const logger = console

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
import type { RegExpVisitor } from "regexpp/visitor"
import type { CharacterClass } from "regexpp/ast"
import { createRule, defineRegexpVisitor, RegExpContext } from "../utils"

export default createRule("${ruleId}", {
    meta: {
        docs: {
            description: "",
            // TODO Switch to recommended in the major version.
            // recommended: true,
            recommended: false,
        },
        schema: [],
        messages: {},
        type: "suggestion", // "problem",
    },
    create(context) {
        /**
         * Create visitor
         */
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
        `import { RuleTester } from "eslint"
import rule from "../../../lib/rules/${ruleId}"

const tester = new RuleTester({
    parserOptions: {
        ecmaVersion: 2020,
        sourceType: "module",
    },
})

tester.run("${ruleId}", rule as any, {
    valid: [
        \`/regexp/\`
    ],
    invalid: [
        {
            code: \`/regexp/\`,
            errors: [
                {
                    messageId: "",
                    data: {},
                    line: 1,
                    column: 1,
                    endLine: 1,
                    endColumn: 1,
                },
            ],
        },
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
