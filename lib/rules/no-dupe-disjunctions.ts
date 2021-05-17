import type { RegExpVisitor } from "regexpp/visitor"
import type {
    Alternative,
    CapturingGroup,
    Group,
    LookaroundAssertion,
    Node,
    Pattern,
    Quantifier,
} from "regexpp/ast"
import type { RegExpContext } from "../utils"
import { createRule, defineRegexpVisitor } from "../utils"
import { isCoveredNode, isEqualNodes } from "../utils/regexp-ast"
import type { Expression, FiniteAutomaton, NoParent, ReadonlyNFA } from "refa"
import {
    combineTransformers,
    Transformers,
    DFA,
    NFA,
    JS,
    visitAst,
    transform,
} from "refa"
import type { ReadonlyFlags } from "regexp-ast-analysis"
import {
    hasSomeDescendant,
    getMatchingDirection,
    getEffectiveMaximumRepetition,
} from "regexp-ast-analysis"
import { RegExpParser } from "regexpp"
import { UsageOfPattern } from "../utils/get-usage-of-pattern"

type ParentNode = Group | CapturingGroup | Pattern | LookaroundAssertion

/**
 * Returns whether the node or the elements of the node are effectively
 * quantified with a star.
 */
function isStared(node: Node): boolean {
    let max = getEffectiveMaximumRepetition(node)
    if (node.type === "Quantifier") {
        max *= node.max
    }
    return max > 10
}

/**
 * Check has after pattern
 */
function hasNothingAfterNode(node: ParentNode): boolean {
    const md = getMatchingDirection(node)

    for (
        let p:
            | Group
            | Pattern
            | CapturingGroup
            | LookaroundAssertion
            | Quantifier
            | Alternative = node;
        ;
        p = p.parent
    ) {
        if (p.type === "Assertion" || p.type === "Pattern") {
            return true
        }

        if (p.type !== "Alternative") {
            const parent: Quantifier | Alternative = p.parent
            if (parent.type === "Quantifier") {
                if (parent.max > 1) {
                    return false
                }
            } else {
                const lastIndex: number =
                    md === "ltr" ? parent.elements.length - 1 : 0
                if (parent.elements[lastIndex] !== p) {
                    return false
                }
            }
        }
    }
}

/**
 * Returns whether the given RE AST contains assertions.
 */
function containsAssertions(expression: NoParent<Expression>): boolean {
    try {
        visitAst(expression, {
            onAssertionEnter() {
                throw new Error()
            },
        })
        return false
    } catch (error) {
        return true
    }
}

/**
 * Returns whether the given RE AST contains assertions or unknowns.
 */
function containsAssertionsOrUnknowns(
    expression: NoParent<Expression>,
): boolean {
    try {
        visitAst(expression, {
            onAssertionEnter() {
                throw new Error()
            },
            onUnknownEnter() {
                throw new Error()
            },
        })
        return false
    } catch (error) {
        return true
    }
}

const creationOption: Transformers.CreationOptions = {
    ignoreAmbiguity: true,
    ignoreOrder: true,
}
const assertionTransformer = combineTransformers([
    Transformers.applyAssertions(creationOption),
    Transformers.removeUnnecessaryAssertions(creationOption),
    Transformers.inline(creationOption),
    Transformers.removeDeadBranches(creationOption),
])

/**
 * Create an NFA from the given element.
 *
 * The `partial` value determines whether the NFA perfectly represents the given
 * element. Some elements might contain features that cannot be represented
 * using NFA in which case a partial NFA will be created (e.g. the NFA of
 * `a|\bfoo\b` is equivalent to the NFA of `a`).
 */
function toNFA(
    parser: JS.Parser,
    element: JS.ParsableElement,
): { nfa: NFA; partial: boolean } {
    try {
        const { expression, maxCharacter } = parser.parseElement(element, {
            backreferences: "unknown",
            assertions: "parse",
        })

        let e
        if (containsAssertions(expression)) {
            e = transform(assertionTransformer, expression)
        } else {
            e = expression
        }

        return {
            nfa: NFA.fromRegex(
                e,
                { maxCharacter },
                { assertions: "disable", unknowns: "disable" },
            ),
            partial: containsAssertionsOrUnknowns(e),
        }
    } catch (error) {
        return {
            nfa: NFA.empty({
                maxCharacter: parser.ast.flags.unicode ? 0x10ffff : 0xffff,
            }),
            partial: true,
        }
    }
}

/**
 * Unions all given NFAs
 */
function unionAll(nfas: readonly ReadonlyNFA[]): ReadonlyNFA {
    if (nfas.length === 0) {
        throw new Error("Cannot union 0 NFAs.")
    } else if (nfas.length === 1) {
        return nfas[0]
    }

    const total = nfas[0].copy()
    for (let i = 1; i < nfas.length; i++) {
        total.union(nfas[i])
    }
    return total
}

const DFA_OPTIONS: DFA.CreationOptions = { maxNodes: 100_000 }

/**
 * Returns whether one NFA is a subset of another.
 */
function isSubsetOf(
    superset: ReadonlyNFA,
    subset: ReadonlyNFA,
): boolean | null {
    try {
        const a = DFA.fromIntersection(superset, subset, DFA_OPTIONS)
        const b = DFA.fromFA(subset, DFA_OPTIONS)
        a.minimize()
        b.minimize()
        return a.structurallyEqual(b)
    } catch (error) {
        return null
    }
}

const enum SubsetRelation {
    none,
    leftEqualRight,
    leftSubsetOfRight,
    leftSupersetOfRight,
    unknown,
}

/**
 * Returns the subset relation
 */
function getSubsetRelation(
    left: ReadonlyNFA,
    right: ReadonlyNFA,
): SubsetRelation {
    try {
        const inter = DFA.fromIntersection(left, right, DFA_OPTIONS)
        inter.minimize()

        const l = DFA.fromFA(left, DFA_OPTIONS)
        l.minimize()

        const r = DFA.fromFA(right, DFA_OPTIONS)
        r.minimize()

        const subset = l.structurallyEqual(inter)
        const superset = r.structurallyEqual(inter)

        if (subset && superset) {
            return SubsetRelation.leftEqualRight
        } else if (subset) {
            return SubsetRelation.leftSubsetOfRight
        } else if (superset) {
            return SubsetRelation.leftSupersetOfRight
        }
        return SubsetRelation.none
    } catch (error) {
        return SubsetRelation.unknown
    }
}

/**
 * The `getSubsetRelation` function assumes that both NFAs perfectly represent
 * their language.
 *
 * This function adjusts their subset relation to account for partial NFAs.
 */
function getPartialSubsetRelation(
    left: ReadonlyNFA,
    leftIsPartial: boolean,
    right: ReadonlyNFA,
    rightIsPartial: boolean,
): SubsetRelation {
    const relation = getSubsetRelation(left, right)

    if (!leftIsPartial && !rightIsPartial) {
        return relation
    }

    if (
        relation === SubsetRelation.none ||
        relation === SubsetRelation.unknown
    ) {
        return relation
    }

    if (leftIsPartial && !rightIsPartial) {
        switch (relation) {
            case SubsetRelation.leftEqualRight:
                return SubsetRelation.leftSupersetOfRight
            case SubsetRelation.leftSubsetOfRight:
                return SubsetRelation.none
            case SubsetRelation.leftSupersetOfRight:
                return SubsetRelation.leftSupersetOfRight

            default:
                throw new Error(relation)
        }
    }
    if (rightIsPartial && !leftIsPartial) {
        switch (relation) {
            case SubsetRelation.leftEqualRight:
                return SubsetRelation.leftSubsetOfRight
            case SubsetRelation.leftSubsetOfRight:
                return SubsetRelation.leftSubsetOfRight
            case SubsetRelation.leftSupersetOfRight:
                return SubsetRelation.none

            default:
                throw new Error(relation)
        }
    }

    // both are partial

    return SubsetRelation.none
}

/**
 * Returns the regex source of the given FA.
 */
function faToSource(fa: FiniteAutomaton, flags: ReadonlyFlags): string {
    try {
        return JS.toLiteral(fa.toRegex(), { flags }).source
    } catch (error) {
        return "<ERROR>"
    }
}

interface ResultBase {
    alternative: Alternative
    others: Alternative[]
}
interface DuplicateResult extends ResultBase {
    type: "Duplicate"
    others: [Alternative]
}
interface SubsetResult extends ResultBase {
    type: "Subset"
}
interface PrefixSubsetResult extends ResultBase {
    type: "PrefixSubset"
}
interface SupersetResult extends ResultBase {
    type: "Superset"
}
interface OverlapResult extends ResultBase {
    type: "Overlap"
    overlap: NFA
}
type Result =
    | DuplicateResult
    | SubsetResult
    | PrefixSubsetResult
    | SupersetResult
    | OverlapResult

interface Options {
    parser: JS.Parser
    hasNothingAfter: boolean
    fastAst: boolean
    noNfa: boolean
    ignoreOverlap: boolean
}

/**
 * Tries to find duplication in the given alternatives
 */
function* findDuplicationAstFast(
    alternatives: Alternative[],
    { toCharSet }: RegExpContext,
): Iterable<Result> {
    // eslint-disable-next-line func-style -- x
    const shortCircuit: Parameters<typeof isEqualNodes>[3] = (a) => {
        return a.type === "CapturingGroup" ? false : null
    }

    for (let i = 0; i < alternatives.length; i++) {
        const alternative = alternatives[i]

        for (let j = 0; j < i; j++) {
            const other = alternatives[j]

            if (isEqualNodes(other, alternative, toCharSet, shortCircuit)) {
                yield { type: "Duplicate", alternative, others: [other] }
            }
        }
    }
}

/**
 * Tries to find duplication in the given alternatives
 */
function* findDuplicationAst(
    alternatives: Alternative[],
    context: RegExpContext,
    hasNothingAfter: boolean,
): Iterable<Result> {
    const { flags, toCharSet } = context

    const isCoveredOptions: Parameters<typeof isCoveredNode>[2] = {
        flags,
        canOmitRight: hasNothingAfter,
        toCharSet,
    }
    const isCoveredOptionsNoPrefix: Parameters<typeof isCoveredNode>[2] = {
        flags,
        canOmitRight: false,
        toCharSet,
    }

    for (let i = 0; i < alternatives.length; i++) {
        const alternative = alternatives[i]

        for (let j = 0; j < i; j++) {
            const other = alternatives[j]

            if (isCoveredNode(other, alternative, isCoveredOptions)) {
                if (isEqualNodes(other, alternative, toCharSet)) {
                    yield {
                        type: "Duplicate",
                        alternative,
                        others: [other],
                    }
                } else if (
                    hasNothingAfter &&
                    !isCoveredNode(other, alternative, isCoveredOptionsNoPrefix)
                ) {
                    yield {
                        type: "PrefixSubset",
                        alternative,
                        others: [other],
                    }
                } else {
                    yield { type: "Subset", alternative, others: [other] }
                }
            }
        }
    }
}

/**
 * Tries to find duplication in the given alternatives.
 *
 * It will search for prefix duplications. I.e. the alternative `ab` in `a|ab`
 * is a duplicate of `a` because if `ab` accepts, `a` will have already accepted
 * the input string. This makes `ab` effectively useless.
 *
 * This operation will modify the given NFAs.
 */
function* findPrefixDuplicationNfa(
    alternatives: [NFA, boolean, Alternative][],
): Iterable<Result> {
    if (alternatives.length === 0) {
        return
    }

    // For two alternatives `A|B`, `B` is useless if `B` is a subset of `A[^]*`

    const all = NFA.all({ maxCharacter: alternatives[0][0].maxCharacter })

    for (let i = 0; i < alternatives.length; i++) {
        const [nfa, partial, alternative] = alternatives[i]

        if (!partial) {
            const overlapping = alternatives
                .slice(0, i)
                .filter(([otherNfa]) => !nfa.isDisjointWith(otherNfa))

            if (overlapping.length >= 1) {
                const othersNfa = unionAll(overlapping.map(([n]) => n))
                const others = overlapping.map(([, , a]) => a)

                // Only checking for a subset relation is sufficient here.
                // Duplicates are VERY unlikely. (Who would use alternatives
                // like `a|a[^]*`?)

                if (isSubsetOf(othersNfa, nfa)) {
                    yield { type: "PrefixSubset", alternative, others }
                }
            }
        }

        nfa.append(all)
    }
}

/**
 * Tries to find duplication in the given alternatives.
 */
function* findDuplicationNfa(
    alternatives: Alternative[],
    { hasNothingAfter, parser, ignoreOverlap }: Options,
): Iterable<Result> {
    const previous: [NFA, boolean, Alternative][] = []
    for (let i = 0; i < alternatives.length; i++) {
        const alternative = alternatives[i]
        const { nfa, partial } = toNFA(parser, alternative)

        const overlapping = previous.filter(
            ([otherNfa]) => !nfa.isDisjointWith(otherNfa),
        )

        if (overlapping.length >= 1) {
            const othersNfa = unionAll(overlapping.map(([n]) => n))
            const othersPartial = overlapping.some(([, p]) => p)
            const others = overlapping.map(([, , a]) => a)

            const relation = getPartialSubsetRelation(
                nfa,
                partial,
                othersNfa,
                othersPartial,
            )

            switch (relation) {
                case SubsetRelation.leftEqualRight:
                    if (others.length === 1) {
                        // only return "duplicate" if there is only one other
                        // alternative
                        yield {
                            type: "Duplicate",
                            alternative,
                            others: [others[0]],
                        }
                    } else {
                        yield { type: "Subset", alternative, others }
                    }
                    break

                case SubsetRelation.leftSubsetOfRight:
                    yield { type: "Subset", alternative, others }
                    break

                case SubsetRelation.leftSupersetOfRight:
                    yield { type: "Superset", alternative, others }
                    break

                case SubsetRelation.none:
                case SubsetRelation.unknown:
                    if (!ignoreOverlap) {
                        yield {
                            type: "Overlap",
                            alternative,
                            others,
                            overlap: NFA.fromIntersection(nfa, othersNfa),
                        }
                    }
                    break

                default:
                    throw new Error(relation)
            }
        }

        previous.push([nfa, partial, alternative])
    }

    if (hasNothingAfter) {
        yield* findPrefixDuplicationNfa(previous)
    }
}

/**
 * Tries to find duplication in the given alternatives
 */
function* findDuplication(
    alternatives: Alternative[],
    context: RegExpContext,
    options: Options,
): Iterable<Result> {
    // AST-based approach
    if (options.fastAst) {
        yield* findDuplicationAstFast(alternatives, context)
    } else {
        yield* findDuplicationAst(
            alternatives,
            context,
            options.hasNothingAfter,
        )
    }

    // NFA-based approach
    if (!options.noNfa) {
        yield* findDuplicationNfa(alternatives, options)
    }
}

const RESULT_TYPE_ORDER: Result["type"][] = [
    "Duplicate",
    "Subset",
    "PrefixSubset",
    "Superset",
    "Overlap",
]

/**
 * Returns an array of the given results that is sorted by result type from
 * most important to least important.
 */
function sortResultTypes(unsorted: Iterable<Result>): Result[] {
    return [...unsorted].sort(
        (a, b) =>
            RESULT_TYPE_ORDER.indexOf(a.type) -
            RESULT_TYPE_ORDER.indexOf(b.type),
    )
}

/**
 * Returns an array of the given results that is sorted by result type from
 * most important to least important.
 */
function deduplicateResults(results: readonly Result[]): Result[] {
    const seen = new Set<Alternative>()
    return results.filter(({ alternative }) => {
        if (seen.has(alternative)) {
            return false
        }
        seen.add(alternative)
        return true
    })
}

const enum ReportOption {
    all = "all",
    trivial = "trivial",
    interesting = "interesting",
}
const enum ReportExponentialBacktracking {
    none = "none",
    certain = "certain",
    potential = "potential",
}
const enum ReportPrefixSubset {
    certain = "certain",
    potential = "potential",
}

export default createRule("no-dupe-disjunctions", {
    meta: {
        docs: {
            description: "disallow duplicate disjunctions",
            // TODO In the major version
            // recommended: true,
            recommended: false,
        },
        schema: [
            {
                type: "object",
                properties: {
                    report: {
                        type: "string",
                        enum: ["all", "trivial", "interesting"],
                    },
                    reportExponentialBacktracking: {
                        enum: ["none", "certain", "potential"],
                    },
                    reportPrefixSubset: {
                        enum: ["certain", "potential"],
                    },

                    // TODO remove in the next major version
                    alwaysReportExponentialBacktracking: { type: "boolean" },
                    // TODO remove in the next major version
                    disallowNeverMatch: { type: "boolean" },
                },
                additionalProperties: false,
            },
        ],
        messages: {
            duplicate:
                "Unexpected duplicate alternative. This alternative can be removed.{{cap}}{{exp}}",
            subset:
                "Unexpected useless alternative. This alternative is a strict subset of '{{others}}' and can be removed.{{cap}}{{exp}}",
            prefixSubset:
                "Unexpected useless alternative. This alternative is already covered by '{{others}}' and can be removed.{{cap}}",
            superset:
                "Unexpected superset. This alternative is a superset of '{{others}}'. It might be possible to remove the other alternative(s).{{cap}}{{exp}}",
            overlap:
                "Unexpected overlap. This alternative overlaps with '{{others}}'. The overlap is '{{expr}}'.{{cap}}{{exp}}",
        },
        type: "suggestion", // "problem",
    },
    create(context) {
        let reportExponentialBacktracking: ReportExponentialBacktracking =
            ReportExponentialBacktracking.potential
        if (context.options[0]?.reportExponentialBacktracking) {
            reportExponentialBacktracking =
                context.options[0]?.reportExponentialBacktracking
        } else {
            // backward compatibility
            if (
                context.options[0]?.alwaysReportExponentialBacktracking ===
                false
            ) {
                reportExponentialBacktracking =
                    ReportExponentialBacktracking.none
            }
        }
        let reportPrefixSubset = ReportPrefixSubset.potential
        if (context.options[0]?.reportPrefixSubset) {
            reportPrefixSubset = context.options[0]?.reportPrefixSubset
        }
        const report: ReportOption =
            context.options[0]?.report ?? ReportOption.trivial

        /**
         * Create visitor
         */
        function createVisitor(
            regexpContext: RegExpContext,
        ): RegExpVisitor.Handlers {
            const {
                patternAst,
                flagsString,
                flags,
                node,
                getRegexpLocation,
                getUsageOfPattern,
            } = regexpContext

            const parser = JS.Parser.fromAst({
                pattern: patternAst,
                flags: new RegExpParser().parseFlags(
                    [
                        ...new Set(
                            (flagsString || "").replace(/[^gimsuy]/g, ""),
                        ),
                    ].join(""),
                ),
            })

            /** Verify group node */
            function verify(parentNode: ParentNode) {
                // report all if the we report exp backtracking
                const nodeReport =
                    reportExponentialBacktracking !==
                        ReportExponentialBacktracking.none &&
                    isStared(parentNode)
                        ? ReportOption.all
                        : report

                const hasNothingAfter =
                    hasNothingAfterNode(parentNode) &&
                    (reportPrefixSubset === ReportPrefixSubset.potential ||
                        (reportPrefixSubset === ReportPrefixSubset.certain &&
                            getUsageOfPattern() !== UsageOfPattern.partial))

                const rawResults = findDuplication(
                    parentNode.alternatives,
                    regexpContext,
                    {
                        fastAst: false,
                        noNfa: false,
                        ignoreOverlap: nodeReport !== ReportOption.all,
                        hasNothingAfter,
                        parser,
                    },
                )

                let results = deduplicateResults(sortResultTypes(rawResults))

                if (nodeReport === ReportOption.trivial) {
                    // For "trivial", we want to filter out all results
                    // where the user cannot just remove the reported
                    // alternative. So "Overlap" and "Superset" types are
                    // removed.

                    results = results.filter(({ type }) => {
                        return !(type === "Overlap" || type === "Superset")
                    })
                } else if (nodeReport === ReportOption.interesting) {
                    // For "interesting", we want to behave like "trivial"
                    // but we also want to retain "Superset" results like
                    // `\b(?:Foo|\w+)\b`. So "Overlap" types are always
                    // removed and "Superset" types are removed if there is
                    // nothing after it.

                    results = results.filter(({ type }) => {
                        return !(
                            type === "Overlap" ||
                            (type === "Superset" && hasNothingAfter)
                        )
                    })
                }

                results.forEach(reportResult)
            }

            /** Report the given result. */
            function reportResult(result: Result) {
                const exp = isStared(result.alternative)
                    ? " This ambiguity is likely to cause exponential backtracking."
                    : ""
                const cap = hasSomeDescendant(
                    result.alternative,
                    (d) => d.type === "CapturingGroup",
                )
                    ? " Careful! This alternative contains capturing groups which might be difficult to remove."
                    : ""

                const others = result.others.map((a) => a.raw).join("|")

                switch (result.type) {
                    case "Duplicate":
                        context.report({
                            node,
                            loc: getRegexpLocation(result.alternative),
                            messageId: "duplicate",
                            data: { exp, cap, others },
                        })
                        break

                    case "Subset":
                        context.report({
                            node,
                            loc: getRegexpLocation(result.alternative),
                            messageId: "subset",
                            data: { exp, cap, others },
                        })
                        break

                    case "PrefixSubset":
                        if (
                            reportPrefixSubset ===
                                ReportPrefixSubset.potential ||
                            (reportPrefixSubset ===
                                ReportPrefixSubset.certain &&
                                getUsageOfPattern() !== UsageOfPattern.partial)
                        ) {
                            context.report({
                                node,
                                loc: getRegexpLocation(result.alternative),
                                messageId: "prefixSubset",
                                data: { exp, cap, others },
                            })
                        }
                        break

                    case "Superset":
                        context.report({
                            node,
                            loc: getRegexpLocation(result.alternative),
                            messageId: "superset",
                            data: { exp, cap, others },
                        })
                        break

                    case "Overlap":
                        if (
                            isStared(result.alternative) ||
                            reportExponentialBacktracking ===
                                ReportExponentialBacktracking.potential ||
                            (reportExponentialBacktracking ===
                                ReportExponentialBacktracking.certain &&
                                getUsageOfPattern() !== UsageOfPattern.partial)
                        ) {
                            context.report({
                                node,
                                loc: getRegexpLocation(result.alternative),
                                messageId: "overlap",
                                data: {
                                    exp,
                                    cap,
                                    others,
                                    expr: faToSource(result.overlap, flags),
                                },
                            })
                        }
                        break

                    default:
                        throw new Error(result)
                }
            }

            return {
                onPatternEnter: verify,
                onGroupEnter: verify,
                onCapturingGroupEnter: verify,
                onAssertionEnter(aNode) {
                    if (
                        aNode.kind === "lookahead" ||
                        aNode.kind === "lookbehind"
                    ) {
                        verify(aNode)
                    }
                },
            }
        }

        return defineRegexpVisitor(context, {
            createVisitor,
        })
    },
})
