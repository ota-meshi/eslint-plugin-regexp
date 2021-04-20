import type { Literal } from "estree"
import type { RegExpVisitor } from "regexpp/visitor"
import type { RegExpContext } from "../utils"
import { createRule, defineRegexpVisitor } from "../utils"

export default createRule("sort-flags", {
    meta: {
        docs: {
            description: "require regex flags to be sorted",
            // TODO Switch to recommended in the major version.
            // recommended: true,
            recommended: false,
        },
        fixable: "code",
        schema: [
            {
                type: "object",
                properties: {
                    order: {
                        type: "array",
                        items: { type: "string", minLength: 1, maxLength: 1 },
                        uniqueItems: true,
                        minItems: 2,
                    },
                },
                additionalProperties: false,
            },
        ],
        messages: {
            sortFlags:
                "The flags '{{flags}}' should in the order '{{sortedFlags}}'.",
        },
        type: "suggestion", // "problem",
    },
    create(context) {
        const order: string[] | undefined = context.options[0]?.order
        let getOrder: (char: string) => number,
            isIgnore: (flags: string) => boolean

        if (order) {
            getOrder = (c) => order.indexOf(c)

            // Ignore if it does not contain more than one flag.
            isIgnore = (flags) => {
                let cnt = 0
                for (const f of flags) {
                    if (order.includes(f)) {
                        cnt++
                        if (cnt > 1) {
                            return false
                        }
                    }
                }
                return true
            }
        } else {
            getOrder = (c) => c.codePointAt(0)!
            isIgnore = () => false
        }

        /**
         * Report
         */
        function report(
            node: Literal,
            flags: string,
            sortedFlags: string,
            flagsRange: [number, number],
        ) {
            const sourceCode = context.getSourceCode()
            context.report({
                node,
                loc: {
                    start: sourceCode.getLocFromIndex(flagsRange[0]),
                    end: sourceCode.getLocFromIndex(flagsRange[1]),
                },
                messageId: "sortFlags",
                data: { flags, sortedFlags },
                fix(fixer) {
                    return fixer.replaceTextRange(flagsRange, sortedFlags)
                },
            })
        }

        /**
         * Sort regexp flags
         */
        function sortFlags(flagsStr: string): string {
            if (isIgnore(flagsStr)) {
                return flagsStr
            }
            return [...flagsStr]
                .sort((a, b) => {
                    if (a === b) {
                        return 0
                    }
                    const aOrder = getOrder(a)
                    const bOrder = getOrder(b)

                    if (aOrder === -1 || bOrder === -1) {
                        // Keep original order.
                        if (bOrder !== -1) {
                            return compareForOmitAOrder(a, b, bOrder)
                        }
                        if (aOrder !== -1) {
                            return -compareForOmitAOrder(b, a, aOrder)
                        }

                        return flagsStr.indexOf(a) - flagsStr.indexOf(b)
                    }
                    return aOrder - bOrder
                })
                .join("")

            /**
             * Compare function for omit order
             */
            function compareForOmitAOrder(
                a: string,
                b: string,
                bOrder: number,
            ): number {
                const aIndex = flagsStr.indexOf(a)
                const bIndex = flagsStr.indexOf(b)
                if (aIndex < bIndex) {
                    // Checks if 'b' must move before 'a'.
                    // e.g. x: 2, a: unknown, b: 1
                    for (let index = 0; index < aIndex; index++) {
                        const x = flagsStr[index]
                        const xOrder = getOrder(x)
                        if (xOrder !== -1 && bOrder < xOrder) {
                            return 1
                        }
                    }
                }
                // If 'x' must move before 'b', it does not affect the result of comparing 'a' and 'b'.
                // e.g. b: 2, a: unknown, x: 1
                return aIndex - bIndex
            }
        }

        /**
         * Create visitor
         */
        function createVisitor({
            regexpNode,
        }: RegExpContext): RegExpVisitor.Handlers {
            if (regexpNode.type === "Literal") {
                const flags = regexpNode.regex.flags
                const sortedFlags = sortFlags(flags)
                if (flags !== sortedFlags) {
                    report(regexpNode, flags, sortedFlags, [
                        regexpNode.range![1] - regexpNode.regex.flags.length,
                        regexpNode.range![1],
                    ])
                }
            } else {
                const flagsArg = regexpNode.arguments[1]
                if (
                    flagsArg.type === "Literal" &&
                    typeof flagsArg.value === "string"
                ) {
                    const flags = flagsArg.value
                    const sortedFlags = sortFlags(flags)
                    if (flags !== sortedFlags) {
                        report(flagsArg, flags, sortedFlags, [
                            flagsArg.range![0] + 1,
                            flagsArg.range![1] - 1,
                        ])
                    }
                }
            }

            return {} // not visit RegExpNodes
        }

        return defineRegexpVisitor(context, {
            createVisitor,
        })
    },
})
