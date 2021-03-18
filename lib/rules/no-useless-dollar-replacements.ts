import type { CallExpression, Expression, Literal } from "estree"
import { createRule } from "../utils"
import { createTypeTracker } from "../utils/type-tracker"
import { getStaticValue } from "eslint-utils"
import { parseRegExpLiteral, visitRegExpAST, RegExpParser } from "regexpp"
import type { RegExpLiteral, Pattern } from "regexpp/ast"
import type { Token as CharToken } from "../utils/string-literal-parser"
import { parseStringLiteral } from "../utils/string-literal-parser"
import type { Rule } from "eslint"

type DollarReplacement = {
    ref: number | string
    refText: string
    range: [number, number]
}

/**
 * Extract capturing group data
 */
function extractCaptures(
    patternNode: RegExpLiteral | Pattern,
): { names: Set<string>; count: number } {
    let count = 0
    const names = new Set<string>()
    visitRegExpAST(patternNode, {
        onCapturingGroupEnter(cgNode) {
            count++
            if (cgNode.name != null) {
                names.add(cgNode.name)
            }
        },
    })

    return { count, names }
}

/**
 * Extract `$` replacements
 */
function extractDollarReplacements(
    context: Rule.RuleContext,
    node: Literal,
): DollarReplacement[] {
    const stringLiteral = parseStringLiteral(context.getSourceCode().text, {
        start: node.range![0],
        end: node.range![1],
    })
    const tokens = stringLiteral.tokens.filter((t) => t.value)

    const results: DollarReplacement[] = []
    let token
    while ((token = tokens.shift())) {
        if (token.value === "$") {
            const next = tokens.shift()
            if (!next) {
                break
            }
            if (next.value === "$") {
                // escape
                continue
            }
            if (!parseNumberRef(token, next)) {
                if (!parseNamedRef(token, next)) {
                    tokens.unshift(next)
                }
            }
        }
    }

    return results

    /** Parse number reference */
    function parseNumberRef(
        dollarToken: CharToken,
        startToken: CharToken,
    ): boolean {
        if (!/^\d$/u.test(startToken.value)) {
            return false
        }
        if (startToken.value === "0") {
            // Check 01 - 09. Ignore 10 - 99 as they may be used in 1 - 9 and cannot be checked.
            const next = tokens.shift()
            if (next) {
                if (/^[1-9]$/u.test(next.value)) {
                    const ref = Number(next.value)
                    results.push({
                        ref,
                        refText: startToken.value + next.value,
                        range: [dollarToken.range[0], next.range[1]],
                    })
                    return true
                }
                tokens.unshift(next)
            }
            return false
        }
        const ref = Number(startToken.value)
        results.push({
            ref,
            refText: startToken.value,
            range: [dollarToken.range[0], startToken.range[1]],
        })
        return true
    }

    /** Parse named reference */
    function parseNamedRef(
        dollarToken: CharToken,
        startToken: CharToken,
    ): boolean {
        if (startToken.value !== "<") {
            return false
        }

        const chars: CharToken[] = []
        let t
        while ((t = tokens.shift())) {
            if (t.value === ">") {
                const ref = chars.map((c) => c.value).join("")
                results.push({
                    ref,
                    refText: ref,
                    range: [dollarToken.range[0], t.range[1]],
                })
                return true
            }
            chars.push(t)
        }
        tokens.unshift(...chars)
        return false
    }
}

export default createRule("no-useless-dollar-replacements", {
    meta: {
        docs: {
            description:
                "disallow useless `$` replacements in replacement string",
            recommended: false,
        },
        schema: [],
        messages: {
            numberRef:
                "'${{ refText }}' replacement will insert '${{ refText }}' because there are less than {{ num }} capturing groups. Use '$$' if you want to escape '$'.",
            numberRefCapturingNotFound:
                "'${{ refText }}' replacement will insert '${{ refText }}' because capturing group does not found. Use '$$' if you want to escape '$'.",
            namedRef:
                "'$<{{ refText }}>' replacement will be ignored because the named capturing group is not found. Use '$$' if you want to escape '$'.",
            namedRefNamedCapturingNotFound:
                "'$<{{ refText }}>' replacement will insert '$<{{ refText }}>' because named capturing group does not found. Use '$$' if you want to escape '$'.",
        },
        type: "suggestion", // "problem",
    },
    create(context) {
        const parser = new RegExpParser()
        const typeTracer = createTypeTracker(context)
        const sourceCode = context.getSourceCode()

        /** Verify */
        function verify(arg: Expression, replacement: Literal) {
            let patternNode: RegExpLiteral | Pattern
            if (arg.type === "Literal") {
                if ("regex" in arg && arg.regex) {
                    try {
                        patternNode = parser.parsePattern(
                            arg.regex.pattern,
                            0,
                            arg.regex.pattern.length,
                            arg.regex.flags.includes("u"),
                        )
                    } catch {
                        return
                    }
                } else {
                    return
                }
            } else {
                const evaluated = getStaticValue(arg, context.getScope())
                if (!evaluated || !(evaluated.value instanceof RegExp)) {
                    return
                }
                try {
                    patternNode = parseRegExpLiteral(evaluated.value)
                } catch {
                    return
                }
            }

            const captures = extractCaptures(patternNode)
            for (const dollarReplacement of extractDollarReplacements(
                context,
                replacement,
            )) {
                if (typeof dollarReplacement.ref === "number") {
                    if (captures.count < dollarReplacement.ref) {
                        context.report({
                            node: replacement,
                            loc: {
                                start: sourceCode.getLocFromIndex(
                                    dollarReplacement.range[0],
                                ),
                                end: sourceCode.getLocFromIndex(
                                    dollarReplacement.range[1],
                                ),
                            },
                            messageId:
                                captures.count > 0
                                    ? "numberRef"
                                    : "numberRefCapturingNotFound",
                            data: {
                                refText: dollarReplacement.refText,
                                num: String(dollarReplacement.ref),
                            },
                        })
                    }
                } else {
                    if (!captures.names.has(dollarReplacement.ref)) {
                        context.report({
                            node: replacement,
                            loc: {
                                start: sourceCode.getLocFromIndex(
                                    dollarReplacement.range[0],
                                ),
                                end: sourceCode.getLocFromIndex(
                                    dollarReplacement.range[1],
                                ),
                            },
                            messageId:
                                captures.names.size > 0
                                    ? "namedRef"
                                    : "namedRefNamedCapturingNotFound",
                            data: {
                                refText: dollarReplacement.refText,
                            },
                        })
                    }
                }
            }
        }

        return {
            CallExpression(node: CallExpression) {
                if (
                    node.arguments.length < 2 ||
                    node.callee.type !== "MemberExpression"
                ) {
                    return
                }
                const mem = node.callee
                if (
                    mem.computed ||
                    mem.property.type !== "Identifier" ||
                    (mem.property.name !== "replace" &&
                        mem.property.name !== "replaceAll") ||
                    mem.object.type === "Super"
                ) {
                    return
                }
                const replacementTextNode = node.arguments[1]
                if (
                    replacementTextNode.type !== "Literal" ||
                    typeof replacementTextNode.value !== "string"
                ) {
                    return
                }
                const arg = node.arguments[0]
                if (arg.type === "SpreadElement") {
                    return
                }
                if (!typeTracer.isString(mem.object)) {
                    return
                }
                verify(arg, replacementTextNode)
            },
        }
    },
})
