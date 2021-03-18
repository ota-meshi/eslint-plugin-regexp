import type { Rule } from "eslint"
import type {
    CallExpression,
    Expression,
    Identifier,
    Literal,
    MemberExpression,
} from "estree"
import { parseStringLiteral } from "./string-literal-parser"
import type { Token as CharToken } from "../utils/string-literal-parser"

/**
 * Checks whether given node is expected method call
 */
export function isKnownMethodCall(
    node: CallExpression,
    methods: Record<string, number>,
): node is CallExpression & {
    callee: MemberExpression & { object: Expression; property: Identifier }
    arguments: Expression[]
} {
    const mem = node.callee
    if (
        mem.type !== "MemberExpression" ||
        mem.computed ||
        mem.property.type !== "Identifier"
    ) {
        return false
    }
    const argLength = methods[mem.property.name]
    if (node.arguments.length !== argLength) {
        return false
    }
    if (node.arguments.some((arg) => arg.type === "SpreadElement")) {
        return false
    }
    const object = mem.object
    if (object.type === "Super") {
        return false
    }

    return true
}

interface BaseElement {
    type: string
    range: [number, number]
}
export type ReplacementElement =
    | CharacterElement
    | DollarElement
    | ReferenceElement
export interface CharacterElement extends BaseElement {
    type: "CharacterElement"
    value: string
}
export interface DollarElement extends BaseElement {
    type: "DollarElement"
    kind: "$" | "&" | "`" | "'"
}
// $1, $<name>
export interface ReferenceElement extends BaseElement {
    type: "ReferenceElement"
    ref: number | string
    refText: string
}

/**
 * Parse replacements string
 */
export function parseReplacements(
    context: Rule.RuleContext,
    node: Literal,
): ReplacementElement[] {
    const stringLiteral = parseStringLiteral(context.getSourceCode().text, {
        start: node.range![0],
        end: node.range![1],
    })
    const tokens = stringLiteral.tokens.filter((t) => t.value)

    const elements: ReplacementElement[] = []
    let token
    while ((token = tokens.shift())) {
        if (token.value === "$") {
            const next = tokens.shift()
            if (next) {
                if (
                    next.value === "$" ||
                    next.value === "&" ||
                    next.value === "`" ||
                    next.value === "'"
                ) {
                    elements.push({
                        type: "DollarElement",
                        kind: next.value,
                        range: [token.range[0], next.range[1]],
                    })
                    continue
                }
                if (parseNumberRef(token, next)) {
                    continue
                }
                if (parseNamedRef(token, next)) {
                    continue
                }
                tokens.unshift(next)
            }
        }
        elements.push({
            type: "CharacterElement",
            value: token.value,
            range: token.range,
        })
    }

    return elements

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
                    elements.push({
                        type: "ReferenceElement",
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
        elements.push({
            type: "ReferenceElement",
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
                elements.push({
                    type: "ReferenceElement",
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
