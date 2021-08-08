import type { Expression, Literal, RegExpLiteral } from "estree"
import type { Rule, AST, SourceCode } from "eslint"
import { getStaticValue } from "."
import {
    findVariable,
    getParent,
    getPropertyName,
    getStringValueRange,
    isRegexpLiteral,
    isStringLiteral,
} from "./utils"

/**
 * The range of a node/construct within a regexp pattern.
 */
export interface PatternRange {
    readonly start: number
    readonly end: number
}

export class PatternReplaceRange {
    public range: AST.Range

    public type: "RegExp" | "String"

    public constructor(range: AST.Range, type: PatternReplaceRange["type"]) {
        if (!range || range[0] < 0 || range[0] > range[1]) {
            throw new Error(`Invalid range: ${JSON.stringify(range)}`)
        }

        this.range = range
        this.type = type
    }

    public static fromLiteral(
        node: Literal,
        sourceCode: SourceCode,
        nodeRange: PatternRange,
        range: PatternRange,
    ): PatternReplaceRange | null {
        if (!node.range) {
            return null
        }

        const start = range.start - nodeRange.start
        const end = range.end - nodeRange.start

        if (isRegexpLiteral(node)) {
            const nodeStart = node.range[0] + "/".length
            return new PatternReplaceRange(
                [nodeStart + start, nodeStart + end],
                "RegExp",
            )
        }

        if (isStringLiteral(node)) {
            const astRange = getStringValueRange(sourceCode, node, start, end)

            if (astRange) {
                return new PatternReplaceRange(astRange, "String")
            }
        }
        return null
    }

    public getAstLocation(sourceCode: SourceCode): AST.SourceLocation {
        return astRangeToLocation(sourceCode, this.range)
    }

    public escape(text: string): string {
        if (this.type === "String") {
            return text
                .replace(/\\/g, "\\\\")
                .replace(/\n/g, "\\n")
                .replace(/\r/g, "\\r")
                .replace(/\t/g, "\\t")
        }

        return text
    }

    public replace(fixer: Rule.RuleFixer, text: string): Rule.Fix {
        return fixer.replaceTextRange(this.range, this.escape(text))
    }

    public remove(fixer: Rule.RuleFixer): Rule.Fix {
        return fixer.removeRange(this.range)
    }

    public insertAfter(fixer: Rule.RuleFixer, text: string): Rule.Fix {
        return fixer.insertTextAfterRange(this.range, this.escape(text))
    }

    public insertBefore(fixer: Rule.RuleFixer, text: string): Rule.Fix {
        return fixer.insertTextBeforeRange(this.range, this.escape(text))
    }
}

class PatternSegment implements PatternRange {
    private readonly sourceCode: SourceCode

    public readonly node: Expression

    public readonly value: string

    public readonly start: number

    public readonly end: number

    public constructor(
        sourceCode: SourceCode,
        node: Expression,
        value: string,
        start: number,
    ) {
        this.sourceCode = sourceCode
        this.node = node
        this.value = value
        this.start = start
        this.end = start + value.length
    }

    public contains(range: PatternRange): boolean {
        return this.start <= range.start && range.end <= this.end
    }

    public getReplaceRange(range: PatternRange): PatternReplaceRange | null {
        if (!this.contains(range)) {
            return null
        }

        if (this.node.type === "Literal") {
            // This will cover string literals and RegExp literals
            return PatternReplaceRange.fromLiteral(
                this.node,
                this.sourceCode,
                this,
                range,
            )
        }

        // e.g. /foo/.source
        if (
            this.node.type === "MemberExpression" &&
            this.node.object.type !== "Super" &&
            isRegexpLiteral(this.node.object) &&
            getPropertyName(this.node) === "source"
        ) {
            return PatternReplaceRange.fromLiteral(
                this.node.object,
                this.sourceCode,
                this,
                range,
            )
        }

        return null
    }

    public getAstRange(range: PatternRange): AST.Range {
        const replaceRange = this.getReplaceRange(range)
        if (replaceRange) {
            return replaceRange.range
        }

        return this.node.range!
    }
}

export class PatternSource {
    private readonly sourceCode: SourceCode

    public readonly node: Expression

    public readonly value: string

    private readonly segments: readonly PatternSegment[]

    private constructor(
        sourceCode: SourceCode,
        node: Expression,
        value: string,
        items: readonly PatternSegment[],
    ) {
        this.sourceCode = sourceCode
        this.node = node
        this.value = value
        this.segments = items
    }

    public static fromExpression(
        context: Rule.RuleContext,
        expression: Expression,
    ): PatternSource | null {
        // eslint-disable-next-line no-param-reassign -- x
        expression = dereferenceOwnedConstant(context, expression)

        if (isRegexpLiteral(expression)) {
            return PatternSource.fromRegExpLiteral(context, expression)
        }

        const sourceCode = context.getSourceCode()

        const items: PatternSegment[] = []
        let value = ""

        for (const e of flattenPlus(context, expression)) {
            const staticValue = getStaticValue(context, e)
            if (!staticValue || typeof staticValue.value !== "string") {
                return null
            }

            items.push(
                new PatternSegment(
                    sourceCode,
                    e,
                    staticValue.value,
                    value.length,
                ),
            )
            value += staticValue.value
        }

        return new PatternSource(sourceCode, expression, value, items)
    }

    public static fromRegExpLiteral(
        context: Rule.RuleContext,
        expression: RegExpLiteral,
    ): PatternSource {
        const sourceCode = context.getSourceCode()

        return new PatternSource(
            sourceCode,
            expression,
            expression.regex.pattern,
            [
                new PatternSegment(
                    sourceCode,
                    expression,
                    expression.regex.pattern,
                    0,
                ),
            ],
        )
    }

    private getSegment(range: PatternRange): PatternSegment | null {
        const segments = this.getSegments(range)
        if (segments.length === 1) {
            return segments[0]
        }
        return null
    }

    private getSegments(range: PatternRange): PatternSegment[] {
        return this.segments.filter(
            (item) => item.start < range.end && range.start < item.end,
        )
    }

    public getReplaceRange(range: PatternRange): PatternReplaceRange | null {
        const segment = this.getSegment(range)
        if (segment) {
            return segment.getReplaceRange(range)
        }
        return null
    }

    public getAstRange(range: PatternRange): AST.Range {
        const overlapping = this.getSegments(range)

        if (overlapping.length === 1) {
            return overlapping[0].getAstRange(range)
        }

        // the input range comes from multiple sources
        // union all their ranges
        let min = Infinity
        let max = -Infinity
        for (const item of overlapping) {
            min = Math.min(min, item.node.range![0])
            max = Math.max(max, item.node.range![1])
        }

        if (min > max) {
            return this.node.range!
        }

        return [min, max]
    }

    public getAstLocation(range: PatternRange): AST.SourceLocation {
        return astRangeToLocation(this.sourceCode, this.getAstRange(range))
    }
}

/**
 * Flattens binary + expressions into an array.
 *
 * This will automatically dereference owned constants.
 */
function flattenPlus(context: Rule.RuleContext, e: Expression): Expression[] {
    if (e.type === "BinaryExpression" && e.operator === "+") {
        return [
            ...flattenPlus(context, e.left),
            ...flattenPlus(context, e.right),
        ]
    }

    const deRef = dereferenceOwnedConstant(context, e)
    if (deRef !== e) {
        return flattenPlus(context, deRef)
    }

    return [e]
}

/**
 * Converts an range into a source location.
 */
function astRangeToLocation(
    sourceCode: SourceCode,
    range: AST.Range,
): AST.SourceLocation {
    return {
        start: sourceCode.getLocFromIndex(range[0]),
        end: sourceCode.getLocFromIndex(range[1]),
    }
}

/**
 * If the given expression is a variables, this will dereference the variables
 * if the variable is constant and only referenced by this expression.
 *
 * This means that only variables that are owned by this expression are
 * dereferenced.
 *
 * In all other cases, the given expression will be returned as is.
 *
 * @param expression
 */
function dereferenceOwnedConstant(
    context: Rule.RuleContext,
    expression: Expression,
): Expression {
    if (expression.type === "Identifier") {
        const variable = findVariable(context, expression)
        if (!variable || variable.defs.length !== 1) {
            // we want a variable with 1 definition
            return expression
        }

        const def = variable.defs[0]
        if (def.type !== "Variable") {
            // we want a variable
            return expression
        }

        const grandParent = getParent(def.parent)
        if (grandParent && grandParent.type === "ExportNamedDeclaration") {
            // exported variables are not owned because they can be referenced
            // by modules that import this module
            return expression
        }

        // we expect there two be exactly 2 references:
        //  1. for initializing the variable
        //  2. the reference given to this function
        if (variable.references.length !== 2) {
            return expression
        }

        const [initRef, thisRef] = variable.references
        if (
            !(
                initRef.init &&
                initRef.writeExpr &&
                initRef.writeExpr === def.node.init
            ) ||
            thisRef.identifier !== expression
        ) {
            return expression
        }

        return def.node.init
    }

    return expression
}
