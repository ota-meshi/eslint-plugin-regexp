import type { Rule } from "eslint"
import type * as ES from "estree"
import type { RuleListener } from "../../../types"
import { getParent } from "../../ast-utils"

type BlockNode = ES.Statement | ES.Expression

export class CodePathContainer {
    private readonly context: Rule.RuleContext

    private readonly visitor: RuleListener

    private readonly segmentToBlocks = new Map<
        Rule.CodePathSegment,
        BlockNode[]
    >()

    private readonly exprToSegment = new Map<
        ES.Identifier | ES.MemberExpression,
        Rule.CodePathSegment
    >()

    public constructor(context: Rule.RuleContext) {
        this.context = context
        type SegmentStack = {
            upper: SegmentStack | null
            segment: Rule.CodePathSegment
        }
        let segmentStack: SegmentStack | null = null
        this.visitor = {
            onCodePathSegmentStart: (segment) => {
                segmentStack = { upper: segmentStack, segment }
            },
            onCodePathSegmentEnd: () => {
                segmentStack = segmentStack?.upper ?? null
            },
            "IfStatement > *, ConditionalExpression > *": (
                node: NonNullable<
                    | ES.IfStatement["test"]
                    | ES.IfStatement["consequent"]
                    | ES.IfStatement["alternate"]
                    | ES.ConditionalExpression["test"]
                    | ES.ConditionalExpression["consequent"]
                    | ES.ConditionalExpression["alternate"]
                >,
            ) => {
                const parent:
                    | ES.IfStatement
                    | ES.ConditionalExpression = getParent(node)!
                if (parent.consequent === node || parent.alternate === node) {
                    this.addSegmentToBlock(segmentStack!.segment, node)
                }
            },
            "LogicalExpression > *": (
                node:
                    | ES.LogicalExpression["left"]
                    | ES.LogicalExpression["right"],
            ) => {
                this.addSegmentToBlock(segmentStack!.segment, node)
            },
            "SwitchCase > *": (
                node: NonNullable<
                    ES.SwitchCase["test"] | ES.SwitchCase["consequent"][number]
                >,
            ) => {
                const parent: ES.SwitchCase = getParent(node)!
                if (parent.consequent.includes(node as never)) {
                    this.addSegmentToBlock(segmentStack!.segment, node)
                }
            },
            "Identifier, MemberExpression": (
                node: ES.Identifier | ES.MemberExpression,
            ) => {
                this.exprToSegment.set(node, segmentStack!.segment)
            },
        }
    }

    private addSegmentToBlock(segment: Rule.CodePathSegment, block: BlockNode) {
        const blocks = this.segmentToBlocks.get(segment)
        if (blocks) {
            blocks.push(block)
        } else {
            this.segmentToBlocks.set(segment, [block])
        }
    }

    public get _text(): string {
        // for debug
        return this.context.getSourceCode().text
    }

    public getVisitor(): RuleListener {
        return this.visitor
    }

    /**
     * Gets the code path segment in which the given expression is used.
     */
    public getExpressionSegment(
        node: ES.Identifier | ES.MemberExpression,
    ): Rule.CodePathSegment | null {
        return this.exprToSegment.get(node) || null
    }

    /**
     * Gets `if` block or ternary block from the given code path segment.
     */
    public getBlocks(segment: Rule.CodePathSegment): BlockNode[] {
        return this.segmentToBlocks.get(segment) || []
    }
}
