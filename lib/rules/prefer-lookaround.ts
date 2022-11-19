import type { RegExpVisitor } from "regexpp/visitor"
import type {
    CapturingGroup,
    Element,
    LookaroundAssertion,
    Pattern,
} from "regexpp/ast"
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
import type {
    PatternRange,
    PatternReplaceRange,
} from "../utils/ast-utils/pattern-source"
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
        return range.min === range.max
    }
}

/** Checks if the given element is a zero length element that can be placed as a leading/trailing element. */
function isLeadingTrailingElement(element: Element): boolean {
    if (element.type === "CapturingGroup") return false
    return isZeroLength(element)
}

/** Checks whether the given element is a capturing group of length 1 or greater. */
function isCapturingGroupAndNotZeroLength(
    element: Element,
): element is CapturingGroup {
    return element.type === "CapturingGroup" && !isZeroLength(element)
}

type ParsedStartPattern = {
    // A list of zero-length elements placed before the start capturing group.
    // e.g.
    // /^(foo)bar/ -> ^
    // /\b(foo)bar/ -> \b
    // /(?:^|\b)(foo)bar/ -> (?:^|\b)
    // /(?<=f)(oo)bar/ -> (?<=f)
    // /(foo)bar/ -> null
    leadingElements: Element[]
    // Capturing group used to replace the starting string.
    capturingGroup: CapturingGroup
    // The pattern used when replacing lookbehind assertions.
    replacedAssertion: string
    range: PatternRange
}
type ParsedEndPattern = {
    // Capturing group used to replace the ending string.
    capturingGroup: CapturingGroup
    // A list of zero-length elements placed after the end capturing group.
    // e.g.
    // /foo(bar)$/ -> $
    // /foo(bar)\b/ -> \b
    // /foo(bar)(?:\b|$)/ -> (?:\b|$)
    // /foo(ba)(?=r)/ -> (?=r)
    // /foo(bar)/ -> null
    trailingElements: Element[]
    // The pattern used when replacing lookahead assertions.
    replacedAssertion: string
    range: PatternRange
}
type ParsedElements = {
    // All elements
    elements: readonly Element[]
    start: ParsedStartPattern | null
    end: ParsedEndPattern | null
}

/**
 * Parse the elements of the pattern.
 */
function parsePatternElements(node: Pattern): ParsedElements | null {
    if (node.alternatives.length > 1) {
        return null
    }
    const elements = node.alternatives[0].elements
    const leadingElements: Element[] = []
    let start: ParsedStartPattern | null = null

    for (const element of elements) {
        if (isLeadingTrailingElement(element)) {
            leadingElements.push(element)
            continue
        }
        if (isCapturingGroupAndNotZeroLength(element)) {
            const capturingGroup = element
            start = {
                leadingElements,
                capturingGroup,
                replacedAssertion: startElementsToLookbehindAssertionText(
                    leadingElements,
                    capturingGroup,
                ),
                range: {
                    start: (leadingElements[0] || capturingGroup).start,
                    end: capturingGroup.end,
                },
            }
        }
        break
    }

    let end: ParsedEndPattern | null = null
    const trailingElements: Element[] = []
    for (const element of [...elements].reverse()) {
        if (isLeadingTrailingElement(element)) {
            trailingElements.unshift(element)
            continue
        }

        if (isCapturingGroupAndNotZeroLength(element)) {
            const capturingGroup = element
            end = {
                capturingGroup,
                trailingElements,
                replacedAssertion: endElementsToLookaheadAssertionText(
                    capturingGroup,
                    trailingElements,
                ),
                range: {
                    start: capturingGroup.start,
                    end: (
                        trailingElements[trailingElements.length - 1] ||
                        capturingGroup
                    ).end,
                },
            }
        }
        break
    }
    if (!start && !end) {
        // No capturing groups.
        return null
    }
    if (start && end && start.capturingGroup === end.capturingGroup) {
        // There is only one capturing group.
        return null
    }

    return {
        elements,
        start,
        end,
    }
}

/** Convert end capturing group to lookahead assertion text. */
function endElementsToLookaheadAssertionText(
    capturingGroup: CapturingGroup,
    trailingElements: Element[],
): string {
    const groupPattern = capturingGroup.alternatives.map((a) => a.raw).join("|")

    const trailing = leadingTrailingElementsToLookaroundAssertionPatternText(
        trailingElements,
        "lookahead",
    )
    if (trailing && capturingGroup.alternatives.length !== 1) {
        return `(?=(?:${groupPattern})${trailing})`
    }
    return `(?=${groupPattern}${trailing})`
}

/** Convert start capturing group to lookbehind assertion text. */
function startElementsToLookbehindAssertionText(
    leadingElements: Element[],
    capturingGroup: CapturingGroup,
): string {
    const leading = leadingTrailingElementsToLookaroundAssertionPatternText(
        leadingElements,
        "lookbehind",
    )
    const groupPattern = capturingGroup.alternatives.map((a) => a.raw).join("|")
    if (leading && capturingGroup.alternatives.length !== 1) {
        return `(?<=${leading}(?:${groupPattern}))`
    }
    return `(?<=${leading}${groupPattern})`
}

/** Convert leading/trailing elements to lookaround assertion pattern text. */
function leadingTrailingElementsToLookaroundAssertionPatternText(
    leadingTrailingElements: Element[],
    lookaroundAssertionKind: LookaroundAssertion["kind"],
): string {
    if (
        leadingTrailingElements.length === 1 &&
        leadingTrailingElements[0].type === "Assertion"
    ) {
        const assertion = leadingTrailingElements[0]
        if (
            assertion.kind === lookaroundAssertionKind &&
            !assertion.negate &&
            assertion.alternatives.length === 1
        ) {
            // If the leading/trailing assertion is simple (single alternative, and positive) lookaround assertion, unwrap the parens.
            return assertion.alternatives[0].raw
        }
    }

    return leadingTrailingElements.map((e) => e.raw).join("")
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
            prefer: "This capturing group can be replaced with a {{kind}} ({{expr}}).",
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
            const parsedElements = parsePatternElements(patternAst)
            if (!parsedElements) {
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
                    const replaceReference =
                        getReplaceReferenceFromCallExpression(
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
                parsedElements,
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
            const refRegex = /\$(?<ref>[1-9]\d*|<(?<named>[^>]+)>)/gu

            const allRefs: ReplaceReference[] = []
            let startRef: ReplaceReference | null = null
            let endRef: ReplaceReference | null = null
            let re
            while ((re = refRegex.exec(evaluated.value))) {
                const ref = {
                    ref: re.groups!.named
                        ? re.groups!.named
                        : Number(re.groups!.ref),
                }
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
            parsedElements: ParsedElements,
            replaceReferenceList: ReplaceReferencesList,
        ): RegExpVisitor.Handlers {
            type RefState = {
                capturingGroups: CapturingGroup[]
                isUseOther?: boolean
                capturingNum: number
            }
            const startRefState: RefState = {
                capturingGroups: [],
                capturingNum: -1,
            }
            const endRefState: RefState = {
                capturingGroups: [],
                capturingNum: -1,
            }

            let refNum = 0
            return {
                onCapturingGroupEnter(cgNode) {
                    refNum++
                    processForState(
                        replaceReferenceList.startRefName,
                        replaceReferenceList.otherThanStartRefNames,
                        startRefState,
                    )
                    processForState(
                        replaceReferenceList.endRefName,
                        replaceReferenceList.otherThanEndRefNames,
                        endRefState,
                    )

                    /** Process state */
                    function processForState(
                        refName: string | number | undefined,
                        otherThanRefNames: Set<string | number>,
                        state: RefState,
                    ) {
                        if (refName === refNum || refName === cgNode.name) {
                            state.capturingGroups.push(cgNode)
                            state.capturingNum = refNum
                            // Flags the capturing group referenced in `refName` if it is also referenced elsewhere.
                            state.isUseOther ||= Boolean(
                                otherThanRefNames.has(refNum) ||
                                    (cgNode.name &&
                                        otherThanRefNames.has(cgNode.name)),
                            )
                        }
                    }
                },
                onPatternLeave() {
                    // verify
                    let reportStart = null
                    if (
                        !startRefState.isUseOther &&
                        startRefState.capturingGroups.length === 1 && // It will not be referenced from more than one, but check it just in case.
                        startRefState.capturingGroups[0] ===
                            parsedElements.start?.capturingGroup
                    ) {
                        reportStart = parsedElements.start
                    }
                    let reportEnd = null
                    if (
                        !endRefState.isUseOther &&
                        endRefState.capturingGroups.length === 1 && // It will not be referenced from more than one, but check it just in case.
                        endRefState.capturingGroups[0] ===
                            parsedElements.end?.capturingGroup
                    ) {
                        reportEnd = parsedElements.end
                    }
                    const sideEffects =
                        getSideEffectsWhenReplacingCapturingGroup(
                            parsedElements.elements,
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
                                    report.range,
                                ),
                                messageId: "preferLookarounds",
                                data: {
                                    expr1: mention(
                                        reportStart.replacedAssertion,
                                    ),
                                    expr2: mention(reportEnd.replacedAssertion),
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
                                reportStart.range,
                            ),
                            messageId: "prefer",
                            data: {
                                kind: "lookbehind assertion",
                                expr: mention(reportStart.replacedAssertion),
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
                                    target.allRefs.some((ref) => {
                                        if (
                                            ref === target.endRef ||
                                            typeof ref.ref !== "number"
                                        ) {
                                            return false
                                        }
                                        return (
                                            endRefState.capturingNum <= ref.ref
                                        )
                                    })
                                ) {
                                    // If the capturing group with a large num is used, it cannot be fixed.
                                    return null
                                }
                                return [target.endRef?.range]
                            },
                        )
                        context.report({
                            loc: regexpContext.getRegexpLocation(
                                reportEnd.range,
                            ),
                            messageId: "prefer",
                            data: {
                                kind: "lookahead assertion",
                                expr: mention(reportEnd.replacedAssertion),
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
            replaceCapturingGroups: (ParsedStartPattern | ParsedEndPattern)[],
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
                replacedAssertion: string
            }[] = []
            for (const { range, replacedAssertion } of replaceCapturingGroups) {
                const replaceRange =
                    regexpContext.patternSource.getReplaceRange(range)
                if (!replaceRange) {
                    return null
                }
                replaces.push({
                    replaceRange,
                    replacedAssertion,
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
                for (const { replaceRange, replacedAssertion } of replaces) {
                    list.push({
                        offset: replaceRange.range[0],
                        fix: () =>
                            replaceRange.replace(fixer, replacedAssertion),
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
