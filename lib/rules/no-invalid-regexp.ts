import type { RegExpContextForInvalid } from "../utils"
import { createRule, defineRegexpVisitor } from "../utils"

/** Returns the position of the error */
function getErrorIndex(error: SyntaxError): number | null {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- x
    const index = (error as any).index
    if (typeof index === "number") {
        return index
    }
    return null
}

export default createRule("no-invalid-regexp", {
    meta: {
        docs: {
            description:
                "disallow invalid regular expression strings in `RegExp` constructors",
            category: "Possible Errors",
            // TODO Switch to recommended in the major version.
            // TODO When setting `recommended: true`, do not forget to disable ESLint's no-invalid-regexp in recommended.ts
            // recommended: true,
            recommended: false,
        },
        schema: [],
        messages: {
            error: "{{message}}",
        },
        type: "problem",
    },
    create(context) {
        /** Visit invalid regexes */
        function visitInvalid(regexpContext: RegExpContextForInvalid): void {
            const { node, error, patternSource } = regexpContext

            let loc = undefined

            const index = getErrorIndex(error)
            if (
                index !== null &&
                index >= 0 &&
                index <= patternSource.value.length
            ) {
                // The error index regexpp reports is a little weird.
                // It's either spot on or one character to the right.
                // Since we can't know which index is correct, we will report
                // both positions.
                loc = patternSource.getAstLocation({
                    start: Math.max(index - 1, 0),
                    end: Math.min(index + 1, patternSource.value.length),
                })
            }

            context.report({
                node,
                loc: loc ?? undefined,
                messageId: "error",
                data: { message: error.message },
            })
        }

        return defineRegexpVisitor(context, { visitInvalid })
    },
})
