import type { RegExpContextForInvalid, RegExpContextForUnknown } from "../utils"
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
            recommended: true,
        },
        schema: [],
        messages: {
            error: "{{message}}",
            duplicateFlag: "Duplicate {{flag}} flag",
            uvFlag: "Regex 'u' and 'v' flags cannot be used together",
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

        /** Checks for the combination of `u` and `v` flags */
        function visitUnknown(regexpContext: RegExpContextForUnknown): void {
            const { node, flags, flagsString, getFlagsLocation } = regexpContext

            const flagSet = new Set<string>()
            for (const flag of flagsString ?? "") {
                if (flagSet.has(flag)) {
                    context.report({
                        node,
                        loc: getFlagsLocation(),
                        messageId: "duplicateFlag",
                        data: { flag },
                    })
                    return
                }
                flagSet.add(flag)
            }

            // `regexpp` checks the combination of `u` and `v` flags when parsing `Pattern` according to `ecma262`,
            // but this rule may check only the flag when the pattern is unidentifiable, so check it here.
            // https://tc39.es/ecma262/multipage/text-processing.html#sec-parsepattern
            if (flags.unicode && flags.unicodeSets) {
                context.report({
                    node,
                    loc: getFlagsLocation(),
                    messageId: "uvFlag",
                })
            }
        }

        return defineRegexpVisitor(context, { visitInvalid, visitUnknown })
    },
})
