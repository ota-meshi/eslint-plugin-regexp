import type { RegExpVisitor } from "@eslint-community/regexpp/visitor"
import type { RegExpContext } from "../utils"
import { createRule, defineRegexpVisitor } from "../utils"
import { UsageOfPattern } from "../utils/get-usage-of-pattern"
import { analyse } from "scslre"
import type { Position, SourceLocation } from "estree"
import { mention } from "../utils/mention"
import { getJSRegexppAst } from "../utils/regexp-ast"

/**
 * Returns the combined source location of the two given locations.
 */
function unionLocations(a: SourceLocation, b: SourceLocation): SourceLocation {
    /** x < y */
    function less(x: Position, y: Position): boolean {
        if (x.line < y.line) {
            return true
        } else if (x.line > y.line) {
            return false
        }
        return x.column < y.column
    }

    return {
        start: { ...(less(a.start, b.start) ? a.start : b.start) },
        end: { ...(less(a.end, b.end) ? b.end : a.end) },
    }
}

export default createRule("no-super-linear-backtracking", {
    meta: {
        docs: {
            description: "disallow exponential and polynomial backtracking",
            category: "Possible Errors",
            recommended: true,
        },
        fixable: "code",
        schema: [
            {
                type: "object",
                properties: {
                    report: {
                        enum: ["certain", "potential"],
                    },
                },
                additionalProperties: false,
            },
        ],
        messages: {
            self:
                "This quantifier can reach itself via the loop {{parent}}." +
                " Using any string accepted by {{attack}}, this can be exploited to cause at least polynomial backtracking." +
                "{{exp}}",
            trade:
                "The quantifier {{start}} can exchange characters with {{end}}." +
                " Using any string accepted by {{attack}}, this can be exploited to cause at least polynomial backtracking." +
                "{{exp}}",
        },
        type: "problem",
    },
    create(context) {
        const reportUncertain =
            (context.options[0]?.report ?? "certain") === "potential"

        function createVisitor(
            regexpContext: RegExpContext,
        ): RegExpVisitor.Handlers {
            const {
                node,
                patternAst,
                flags,
                getRegexpLocation,
                fixReplaceNode,
                getUsageOfPattern,
            } = regexpContext

            const result = analyse(getJSRegexppAst(regexpContext), {
                reportTypes: { Move: false },
                assumeRejectingSuffix:
                    reportUncertain &&
                    getUsageOfPattern() !== UsageOfPattern.whole,
            })

            for (const report of result.reports) {
                const exp = report.exponential
                    ? " This is going to cause exponential backtracking resulting in exponential worst-case runtime behavior."
                    : getUsageOfPattern() !== UsageOfPattern.whole
                    ? " This might cause exponential backtracking."
                    : ""

                const attack = `/${report.character.literal.source}+/${
                    flags.ignoreCase ? "i" : ""
                }`

                const fix = fixReplaceNode(
                    patternAst,
                    () => report.fix()?.source ?? null,
                )

                if (report.type === "Self") {
                    context.report({
                        node,
                        loc: getRegexpLocation(report.quant),
                        messageId: "self",
                        data: {
                            exp,
                            attack,
                            parent: mention(report.parentQuant),
                        },
                        fix,
                    })
                } else if (report.type === "Trade") {
                    context.report({
                        node,
                        loc: unionLocations(
                            getRegexpLocation(report.startQuant),
                            getRegexpLocation(report.endQuant),
                        ),
                        messageId: "trade",
                        data: {
                            exp,
                            attack,
                            start: mention(report.startQuant),
                            end: mention(report.endQuant),
                        },
                        fix,
                    })
                }
            }

            return {}
        }

        return defineRegexpVisitor(context, {
            createVisitor,
        })
    },
})
