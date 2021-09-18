import type { RegExpVisitor } from "regexpp/visitor"
import type { CapturingGroup, Element } from "regexpp/ast"
import type { RegExpContext } from "../utils"
import { createRule, defineRegexpVisitor } from "../utils"
import { createTypeTracker } from "../utils/type-tracker"
import type { KnownMethodCall, ReferenceElement } from "../utils/ast-utils"
import {
    getParent,
    parseReplacements,
    getStaticValue,
    extractExpressionReferences,
    isKnownMethodCall,
} from "../utils/ast-utils"
import type { PatternReplaceRange } from "../utils/ast-utils/pattern-source"
import type { Expression, Literal } from "estree"
import type { Rule } from "eslint"
import { mention } from "../utils/mention"
import {
    getFirstConsumedCharPlusAfter,
    getPossiblyConsumedChar,
} from "../utils/regexp-ast"
import {
    getLengthRange,
    isZeroLength,
    FirstConsumedChars,
} from "regexp-ast-analysis"
import type { CharSet } from "refa"

type ReplaceReference = { ref: string | number; range?: [number, number] }
type ReplaceReferences = {
    // Reference at the starting position.
    // e.g.
    // '$1str$2' -> { ref: 1, range: [0,2] }
    // '$<foo>str$<bar>' -> { ref: 'foo', range: [0,6] }
    // 'str$1' -> null
    // 'str$1str$2' -> null
    startRef: ReplaceReference | null
    // Reference at the ending position.
    // e.g.
    // '$1str$2' -> { ref: 2, range: [5,7] }
    // '$<foo>str$<bar>' -> { ref: 'bar', range: [9,15] }
    // '$1str' -> null
    // '$1str$2str' -> null
    endRef: ReplaceReference | null
    // All references including the above.
    allRefs: ReplaceReference[]
}

/**
 * Holds all replacement reference data.
 *
 * If the same RegExp instance is used for replacement in 2 places, the number of data in `list` is 2.
 */
class ReplaceReferencesList {
    private readonly list: ReplaceReferences[]

    /** Reference name at the starting position. */
    public readonly startRefName?: string | number

    /** Reference name at the ending position. */
    public readonly endRefName?: string | number

    /** All reference names except at the starting position. */
    public readonly otherThanStartRefNames: Set<string | number>

    /** All reference names except at the starting position. */
    public readonly otherThanEndRefNames: Set<string | number>

    public constructor(list: ReplaceReferences[]) {
        this.list = list
        this.startRefName = list[0].startRef?.ref
        this.endRefName = list[0].endRef?.ref

        const otherThanStartRefNames = new Set<string | number>()
        const otherThanEndRefNames = new Set<string | number>()
        for (const { startRef, endRef, allRefs } of this.list) {
            for (const ref of allRefs) {
                if (ref !== startRef) {
                    otherThanStartRefNames.add(ref.ref)
                }
                if (ref !== endRef) {
                    otherThanEndRefNames.add(ref.ref)
                }
            }
        }
        this.otherThanStartRefNames = otherThanStartRefNames
        this.otherThanEndRefNames = otherThanEndRefNames
    }

    public *[Symbol.iterator](): Iterator<ReplaceReferences> {
        yield* this.list
    }
}

const enum SideEffect {
    startRef,
    endRef,
}

/**
 * Gets the type of side effect when replacing the capture group for the given element.
 *
 * There are no side effects if the following conditions are met:
 *
 * - Some elements other than the start capturing group have disjoints to the start capturing group.
 * - The last element and the start consume character have disjoint.
 */
function getSideEffectsWhenReplacingCapturingGroup(
    elements: readonly Element[],
    start: CapturingGroup | undefined,
    end: CapturingGroup | undefined,
    { flags }: RegExpContext,
): Set<SideEffect> {
    const result = new Set<SideEffect>()

    if (start) {
        const { char } = getPossiblyConsumedChar(start, flags)
        if (!hasDisjoint(char, elements.slice(1))) {
            result.add(SideEffect.startRef)
        } else {
            const last = elements[elements.length - 1]
            const lastChar = FirstConsumedChars.toLook(
                getFirstConsumedCharPlusAfter(last, "rtl", flags),
            )
            if (!lastChar.char.isDisjointWith(char)) {
                result.add(SideEffect.startRef)
            }
        }
    }

    if (end && flags.global) {
        const first = elements[0]
        if (first) {
            const { char } = getPossiblyConsumedChar(end, flags)

            const firstChar = FirstConsumedChars.toLook(
                getFirstConsumedCharPlusAfter(first, "ltr", flags),
            )
            if (!firstChar.char.isDisjointWith(char)) {
                result.add(SideEffect.endRef)
            }
        }
    }

    return result

    /** Checks whether the given target element has disjoint in elements.  */
    function hasDisjoint(target: CharSet, targetElements: Element[]) {
        for (const element of targetElements) {
            if (isConstantLength(element)) {
                const elementChars = getPossiblyConsumedChar(element, flags)
                if (elementChars.char.isEmpty) {
                    continue
                }
                if (elementChars.char.isDisjointWith(target)) {
                    return true
                }
            } else {
                const elementLook = FirstConsumedChars.toLook(
                    getFirstConsumedCharPlusAfter(element, "ltr", flags),
                )
                return elementLook.char.isDisjointWith(target)
            }
        }
        return false
    }

    /** Checks whether the given element is constant length. */
    function isConstantLength(target: Element): boolean {
        const range = getLengthRange(target)
        return Boolean(range && range.min === range.max)
    }
}

/**
 * Parse option
 */
function parseOption(
    userOption:
        | {
              strictTypes?: boolean
          }
        | undefined,
) {
    let strictTypes = true
    if (userOption) {
        if (userOption.strictTypes != null) {
            strictTypes = userOption.strictTypes
        }
    }

    return {
        strictTypes,
    }
}

export default createRule("prefer-lookaround", {
    meta: {
        docs: {
            description:
                "prefer lookarounds over capturing group that do not replace",
            category: "Stylistic Issues",
            recommended: false,
        },
        fixable: "code",
        schema: [
            {
                type: "object",
                properties: {
                    strictTypes: { type: "boolean" },
                },
                additionalProperties: false,
            },
        ],
        messages: {
            preferLookarounds:
                "These capturing groups can be replaced with lookaround assertions ({{expr1}} and {{expr2}}).",
            prefer:
                "This capturing group can be replaced with a {{kind}} ({{expr}}).",
        },
        type: "suggestion",
    },
    create(context) {
        const { strictTypes } = parseOption(context.options[0])
        const typeTracer = createTypeTracker(context)

        /**
         * Create visitor
         */
        function createVisitor(
            regexpContext: RegExpContext,
        ): RegExpVisitor.Handlers {
            const { regexpNode, patternAst } = regexpContext
            if (
                patternAst.alternatives.length > 1 ||
                patternAst.alternatives[0].elements.length < 2
            ) {
                return {}
            }
            const replaceReferenceList: ReplaceReferences[] = []
            for (const ref of extractExpressionReferences(
                regexpNode,
                context,
            )) {
                if (ref.type === "argument") {
                    if (
                        !isKnownMethodCall(ref.callExpression, {
                            replace: 2,
                            replaceAll: 2,
                        })
                    ) {
                        // Calls other than replace.
                        return {}
                    }
                    const replaceReference = getReplaceReferenceFromCallExpression(
                        ref.callExpression,
                    )
                    if (!replaceReference) {
                        // Unknown call or replacement where lookarounds cannot be used.
                        return {}
                    }
                    replaceReferenceList.push(replaceReference)
                } else if (ref.type === "member") {
                    const parent = getParent(ref.memberExpression)
                    if (
                        parent?.type === "CallExpression" &&
                        isKnownMethodCall(parent, {
                            test: 1,
                        }) &&
                        !regexpContext.flags.global
                    ) {
                        // Using it in the `test` method has no effect on rewriting the regex.
                        continue
                    }
                    // Cannot trace.
                    return {}
                } else {
                    // Cannot trace.
                    return {}
                }
            }
            if (!replaceReferenceList.length) {
                // No pattern is used.
                return {}
            }
            const replaceReference = replaceReferenceList[0]
            if (
                replaceReferenceList.some(
                    (target) =>
                        target.startRef?.ref !==
                            replaceReference.startRef?.ref ||
                        target.endRef?.ref !== replaceReference.endRef?.ref,
                )
            ) {
                // Lookaround cannot be used as it is used in various replacements.
                return {}
            }
            return createVerifyVisitor(
                regexpContext,
                new ReplaceReferencesList(replaceReferenceList),
            )
        }

        /**
         * Get the replace reference info from given call expression
         */
        function getReplaceReferenceFromCallExpression(
            node: KnownMethodCall,
        ): ReplaceReferences | null {
            if (
                strictTypes
                    ? !typeTracer.isString(node.callee.object)
                    : !typeTracer.maybeString(node.callee.object)
            ) {
                // The callee object is not a string.
                return null
            }

            const replacementNode = node.arguments[1]
            if (replacementNode.type === "Literal") {
                return getReplaceReferenceFromLiteralReplacementArgument(
                    replacementNode,
                )
            }
            return getReplaceReferenceFromNonLiteralReplacementArgument(
                replacementNode,
            )
        }

        /**
         * Get the replace reference info from given literal replacement argument
         */
        function getReplaceReferenceFromLiteralReplacementArgument(
            node: Literal,
        ): ReplaceReferences | null {
            if (typeof node.value !== "string") {
                return null
            }
            const replacements = parseReplacements(context, node)

            let startRef: ReplaceReference | null = null
            let endRef: ReplaceReference | null = null
            const start = replacements[0]
            if (start?.type === "ReferenceElement") {
                startRef = start
            }
            const end = replacements[replacements.length - 1]
            if (end?.type === "ReferenceElement") {
                endRef = end
            }
            if (!startRef && !endRef) {
                // Not using a capturing group at start or end.
                return null
            }
            return {
                startRef,
                endRef,
                allRefs: replacements.filter(
                    (e): e is ReferenceElement => e.type === "ReferenceElement",
                ),
            }
        }

        /**
         * Get the replace reference info from given non-literal replacement argument
         */
        function getReplaceReferenceFromNonLiteralReplacementArgument(
            node: Expression,
        ): ReplaceReferences | null {
            const evaluated = getStaticValue(context, node)
            if (!evaluated || typeof evaluated.value !== "string") {
                // The replacement string cannot be determined.
                return null
            }
            const refRegex = /\$([1-9]\d*|<([^>]+)>)/gu

            const allRefs: ReplaceReference[] = []
            let startRef: ReplaceReference | null = null
            let endRef: ReplaceReference | null = null
            let re
            while ((re = refRegex.exec(evaluated.value))) {
                const ref = { ref: re[2] ? re[2] : Number(re[1]) }
                if (re.index === 0) {
                    startRef = ref
                }
                if (refRegex.lastIndex === evaluated.value.length) {
                    endRef = ref
                }
                allRefs.push(ref)
            }
            if (!startRef && !endRef) {
                // Not using a capturing group at start or end.
                return null
            }
            return {
                startRef,
                endRef,
                allRefs,
            }
        }

        /**
         * Create visitor for verify capturing groups
         */
        function createVerifyVisitor(
            regexpContext: RegExpContext,
            replaceReferenceList: ReplaceReferencesList,
        ): RegExpVisitor.Handlers {
            const startReferenceCapturingGroups: CapturingGroup[] = []
            const endReferenceCapturingGroups: CapturingGroup[] = []
            let startReferenceIsUseOther: boolean,
                endReferenceIsUseOther: boolean
            let refNum = 0
            return {
                onCapturingGroupEnter(cgNode) {
                    refNum++
                    if (
                        replaceReferenceList.startRefName === refNum ||
                        replaceReferenceList.startRefName === cgNode.name
                    ) {
                        startReferenceCapturingGroups.push(cgNode)
                        // Flags the capturing group referenced in `start` if it is also referenced elsewhere.
                        startReferenceIsUseOther ||= Boolean(
                            replaceReferenceList.otherThanStartRefNames.has(
                                refNum,
                            ) ||
                                (cgNode.name &&
                                    replaceReferenceList.otherThanStartRefNames.has(
                                        cgNode.name,
                                    )),
                        )
                    }
                    if (
                        replaceReferenceList.endRefName === refNum ||
                        replaceReferenceList.endRefName === cgNode.name
                    ) {
                        endReferenceCapturingGroups.push(cgNode)
                        // Flags the capturing group referenced in `end` if it is also referenced elsewhere.
                        endReferenceIsUseOther ||= Boolean(
                            replaceReferenceList.otherThanEndRefNames.has(
                                refNum,
                            ) ||
                                (cgNode.name &&
                                    replaceReferenceList.otherThanEndRefNames.has(
                                        cgNode.name,
                                    )),
                        )
                    }
                },
                onPatternLeave(pNode) {
                    // verify
                    const alt = pNode.alternatives[0]
                    let reportStart = null
                    if (
                        !startReferenceIsUseOther &&
                        startReferenceCapturingGroups.length === 1 && // It will not be referenced from more than one, but check it just in case.
                        startReferenceCapturingGroups[0] === alt.elements[0] &&
                        !isZeroLength(startReferenceCapturingGroups[0])
                    ) {
                        const capturingGroup = startReferenceCapturingGroups[0]
                        reportStart = {
                            capturingGroup,
                            expr: `(?<=${capturingGroup.alternatives
                                .map((a) => a.raw)
                                .join("|")})`,
                        }
                    }
                    let reportEnd = null
                    if (
                        !endReferenceIsUseOther &&
                        endReferenceCapturingGroups.length === 1 && // It will not be referenced from more than one, but check it just in case.
                        endReferenceCapturingGroups[0] ===
                            alt.elements[alt.elements.length - 1] &&
                        !isZeroLength(endReferenceCapturingGroups[0])
                    ) {
                        const capturingGroup = endReferenceCapturingGroups[0]
                        reportEnd = {
                            capturingGroup,
                            expr: `(?=${capturingGroup.alternatives
                                .map((a) => a.raw)
                                .join("|")})`,
                        }
                    }
                    const sideEffects = getSideEffectsWhenReplacingCapturingGroup(
                        alt.elements,
                        reportStart?.capturingGroup,
                        reportEnd?.capturingGroup,
                        regexpContext,
                    )
                    if (sideEffects.has(SideEffect.startRef)) {
                        reportStart = null
                    }
                    if (sideEffects.has(SideEffect.endRef)) {
                        reportEnd = null
                    }

                    if (reportStart && reportEnd) {
                        const fix = buildFixer(
                            regexpContext,
                            [reportStart, reportEnd],
                            replaceReferenceList,
                            (target) => {
                                if (
                                    target.allRefs.some(
                                        (ref) =>
                                            ref !== target.startRef &&
                                            ref !== target.endRef,
                                    )
                                ) {
                                    // If the capturing group is used for something other than the replacement refs, it cannot be fixed.
                                    return null
                                }
                                return [
                                    target.startRef?.range,
                                    target.endRef?.range,
                                ]
                            },
                        )
                        for (const report of [reportStart, reportEnd]) {
                            context.report({
                                loc: regexpContext.getRegexpLocation(
                                    report.capturingGroup,
                                ),
                                messageId: "preferLookarounds",
                                data: {
                                    expr1: mention(reportStart.expr),
                                    expr2: mention(reportEnd.expr),
                                },
                                fix,
                            })
                        }
                    } else if (reportStart) {
                        const fix = buildFixer(
                            regexpContext,
                            [reportStart],
                            replaceReferenceList,
                            (target) => {
                                if (
                                    target.allRefs.some(
                                        (ref) => ref !== target.startRef,
                                    )
                                ) {
                                    // If the capturing group is used for something other than the replacement refs, it cannot be fixed.
                                    return null
                                }
                                return [target.startRef?.range]
                            },
                        )
                        context.report({
                            loc: regexpContext.getRegexpLocation(
                                reportStart.capturingGroup,
                            ),
                            messageId: "prefer",
                            data: {
                                kind: "lookbehind assertion",
                                expr: mention(reportStart.expr),
                            },
                            fix,
                        })
                    } else if (reportEnd) {
                        const fix = buildFixer(
                            regexpContext,
                            [reportEnd],
                            replaceReferenceList,
                            (target) => {
                                if (
                                    target.allRefs.some(
                                        (ref) => ref !== target.endRef,
                                    )
                                ) {
                                    // If the capturing group is used for something other than the replacement refs, it cannot be fixed.
                                    return null
                                }
                                return [target.endRef?.range]
                            },
                        )
                        context.report({
                            loc: regexpContext.getRegexpLocation(
                                reportEnd.capturingGroup,
                            ),
                            messageId: "prefer",
                            data: {
                                kind: "lookahead assertion",
                                expr: mention(reportEnd.expr),
                            },
                            fix,
                        })
                    }
                },
            }
        }

        /**
         * Build fixer function
         */
        function buildFixer(
            regexpContext: RegExpContext,
            replaceCapturingGroups: {
                capturingGroup: CapturingGroup
                expr: string
            }[],
            replaceReferenceList: ReplaceReferencesList,
            getRemoveRanges: (
                replaceReference: ReplaceReferences,
            ) => Iterable<[number, number] | undefined> | null,
        ): ((fixer: Rule.RuleFixer) => Rule.Fix[]) | null {
            const removeRanges: [number, number][] = []
            for (const replaceReference of replaceReferenceList) {
                const targetRemoveRanges = getRemoveRanges(replaceReference)
                if (!targetRemoveRanges) {
                    return null
                }
                for (const range of targetRemoveRanges) {
                    if (!range) {
                        return null
                    }
                    removeRanges.push(range)
                }
            }
            const replaces: {
                replaceRange: PatternReplaceRange
                expr: string
            }[] = []
            for (const { capturingGroup, expr } of replaceCapturingGroups) {
                const replaceRange = regexpContext.patternSource.getReplaceRange(
                    capturingGroup,
                )
                if (!replaceRange) {
                    return null
                }
                replaces.push({
                    replaceRange,
                    expr,
                })
            }

            return (fixer) => {
                const list: { offset: number; fix: () => Rule.Fix }[] = []
                for (const removeRange of removeRanges) {
                    list.push({
                        offset: removeRange[0],
                        fix: () => fixer.removeRange(removeRange),
                    })
                }
                for (const { replaceRange, expr } of replaces) {
                    list.push({
                        offset: replaceRange.range[0],
                        fix: () => replaceRange.replace(fixer, expr),
                    })
                }
                return list
                    .sort((a, b) => a.offset - b.offset)
                    .map((item) => item.fix())
            }
        }

        return defineRegexpVisitor(context, {
            createVisitor,
        })
    },
})
