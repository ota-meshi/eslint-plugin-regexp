import path from "path"
import fs from "fs"
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
import { createRule, defineRegexpVisitor, getRegexpLocation } from "../utils"

module.exports = createRule("${ruleId}", {
    meta: {
        docs: {
            description: "",
            recommended: true,
        },
        schema: [],
        messages: {},
        type: "suggestion", // "problem",
    },
    create(context) {
        const sourceCode = context.getSourceCode()

        /**
         * Create visitor
         * @param node
         */
        function createVisitor(node: Expression): RegExpVisitor.Handlers {
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
        \`
        /regexp/
        \`
    ],
    invalid: [
        {
            code: \`
            /regexp/
            \`,
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

This rule reports ??? as errors.

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
})(process.argv[2])
