import type { Expression, Literal, RegExpLiteral } from "estree"
import type { Rule, AST, SourceCode } from "eslint"
import { getStaticValue } from "."
import {
    dereferenceOwnedVariable,
    astRangeToLocation,
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

/**
 * A range in source code that can be edited.
 */
export class PatternReplaceRange {
    public range: AST.Range

    public type: "RegExp" | "SingleQuotedString" | "DoubleQuotedString"

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
                const quote = sourceCode.text[node.range[0]]
                return new PatternReplaceRange(
                    astRange,
                    quote === "'" ? "SingleQuotedString" : "DoubleQuotedString",
                )
            }
        }
        return null
    }

    public getAstLocation(sourceCode: SourceCode): AST.SourceLocation {
        return astRangeToLocation(sourceCode, this.range)
    }

    public escape(text: string): string {
        if (
            this.type === "DoubleQuotedString" ||
            this.type === "SingleQuotedString"
        ) {
            const base = text
                .replace(/\\/gu, "\\\\")
                .replace(/\n/gu, "\\n")
                .replace(/\r/gu, "\\r")
                .replace(/\t/gu, "\\t")

            if (this.type === "DoubleQuotedString") {
                return base.replace(/"/gu, '\\"')
            }
            return base.replace(/'/gu, "\\'")
        }

        return text.replace(/\n/gu, "\\n").replace(/\r/gu, "\\r")
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

    public getOwnedRegExpLiteral(): RegExpLiteral | null {
        if (isRegexpLiteral(this.node)) {
            return this.node
        }

        // e.g. /foo/.source
        if (
            this.node.type === "MemberExpression" &&
            this.node.object.type !== "Super" &&
            isRegexpLiteral(this.node.object) &&
            getPropertyName(this.node) === "source"
        ) {
            return this.node.object
        }

        return null
    }

    public getReplaceRange(range: PatternRange): PatternReplaceRange | null {
        if (!this.contains(range)) {
            return null
        }

        const regexp = this.getOwnedRegExpLiteral()
        if (regexp) {
            return PatternReplaceRange.fromLiteral(
                regexp,
                this.sourceCode,
                this,
                range,
            )
        }

        if (this.node.type === "Literal") {
            // This will cover string literals
            return PatternReplaceRange.fromLiteral(
                this.node,
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

export interface RegExpValue {
    readonly source: string
    readonly flags: string
    /**
     * If the RegExp object is an owned RegExp literal, then this value will be
     * non-null.
     *
     * If the RegExp object is shared or not created a literal, this will be
     * `null`.
     */
    readonly ownedNode: RegExpLiteral | null
}

export class PatternSource {
    private readonly sourceCode: SourceCode

    public readonly node: Expression

    public readonly value: string

    private readonly segments: readonly PatternSegment[]

    /**
     * If the pattern of a regexp is defined by a RegExp object, this value
     * will be non-null. This is the case for simple RegExp literals
     * (e.g. `/foo/`) and RegExp constructors (e.g. `RegExp(/foo/, "i")`).
     *
     * If the pattern source is defined by a string value
     * (e.g. `RegExp("foo")`), then this will be `null`.
     */
    public readonly regexpValue: RegExpValue | null

    public isStringValue(): this is PatternSource & {
        readonly regexpValue: null
    } {
        return this.regexpValue === null
    }

    private constructor(
        sourceCode: SourceCode,
        node: Expression,
        value: string,
        segments: readonly PatternSegment[],
        regexpValue: RegExpValue | null,
    ) {
        this.sourceCode = sourceCode
        this.node = node
        this.value = value
        this.segments = segments
        this.regexpValue = regexpValue
    }

    public static fromExpression(
        context: Rule.RuleContext,
        expression: Expression,
    ): PatternSource | null {
        // eslint-disable-next-line no-param-reassign -- x
        expression = dereferenceOwnedVariable(context, expression)

        if (isRegexpLiteral(expression)) {
            return PatternSource.fromRegExpLiteral(context, expression)
        }

        const sourceCode = context.getSourceCode()

        const flat = flattenPlus(context, expression)

        const items: PatternSegment[] = []
        let value = ""

        for (const e of flat) {
            const staticValue = getStaticValue(context, e)
            if (!staticValue) {
                return null
            }

            if (flat.length === 1 && staticValue.value instanceof RegExp) {
                // This means we have a non-owned reference to something that
                // evaluates to an RegExp object
                return PatternSource.fromRegExpObject(
                    context,
                    e,
                    staticValue.value.source,
                    staticValue.value.flags,
                )
            }

            if (typeof staticValue.value !== "string") {
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

        return new PatternSource(sourceCode, expression, value, items, null)
    }

    private static fromRegExpObject(
        context: Rule.RuleContext,
        expression: Expression,
        source: string,
        flags: string,
    ): PatternSource {
        const sourceCode = context.getSourceCode()

        return new PatternSource(
            sourceCode,
            expression,
            source,
            [new PatternSegment(sourceCode, expression, source, 0)],
            {
                source,
                flags,
                ownedNode: null,
            },
        )
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
            {
                source: expression.regex.pattern,
                flags: expression.regex.flags,
                ownedNode: expression,
            },
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

    /**
     * Returns an approximate AST range for the given pattern range.
     *
     * DO NOT use this in fixes to edit source code. Use
     * {@link PatternSource.getReplaceRange} instead.
     */
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

    /**
     * Returns an approximate AST source location for the given pattern range.
     *
     * DO NOT use this in fixes to edit source code. Use
     * {@link PatternSource.getReplaceRange} instead.
     */
    public getAstLocation(range: PatternRange): AST.SourceLocation {
        return astRangeToLocation(this.sourceCode, this.getAstRange(range))
    }

    /**
     * Returns all RegExp literals nodes that are owned by this pattern.
     *
     * This means that the returned RegExp literals are only used to create
     * this pattern and for nothing else.
     */
    public getOwnedRegExpLiterals(): readonly RegExpLiteral[] {
        const literals: RegExpLiteral[] = []

        for (const segment of this.segments) {
            const regexp = segment.getOwnedRegExpLiteral()
            if (regexp) {
                literals.push(regexp)
            }
        }

        return literals
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

    const deRef = dereferenceOwnedVariable(context, e)
    if (deRef !== e) {
        return flattenPlus(context, deRef)
    }

    return [e]
}
