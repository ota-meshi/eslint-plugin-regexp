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
import {
    createRule,
    defineRegexpVisitor,
    fixRemoveCharacterClassElement,
    fixRemoveAlternative,
} from "../utils"
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
    isDisjointWith,
} from "refa"
import type { ReadonlyFlags } from "regexp-ast-analysis"
import {
    hasSomeAncestor,
    hasSomeDescendant,
    getMatchingDirection,
    getEffectiveMaximumRepetition,
} from "regexp-ast-analysis"
import { RegExpParser } from "regexpp"
import { UsageOfPattern } from "../utils/get-usage-of-pattern"
import { canReorder } from "../utils/reorder-alternatives"
import { mention, mentionChar } from "../utils/mention"
import type { NestedAlternative } from "../utils/partial-parser"
import { PartialParser } from "../utils/partial-parser"
import type { Rule } from "eslint"
import { getAllowedCharRanges, inRange } from "../utils/char-ranges"

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

/**
 * Returns whether the given nodes contains any features that cannot be
 * expressed by pure regular expression. This mainly includes assertions and
 * backreferences.
 */
function isNonRegular(node: Node): boolean {
    return hasSomeDescendant(
        node,
        (d) => d.type === "Assertion" || d.type === "Backreference",
    )
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
 * Yields all nested alternatives in the given root alternative.
 *
 * This will yield actual alternative nodes as well as character class
 * elements. The elements of a non-negated character class (e.g. `[abc]`) can
 * be thought of as an alternative. That's why they are returned.
 *
 * Note: If a group contains only a single alternative, then this group won't
 * be yielded by this function. This is because the partial NFA of that single
 * alternative is that same as the partial NFA of the parent alternative of the
 * group. A similar condition applies for the elements of character classes.
 */
function* iterateNestedAlternatives(
    alternative: Alternative,
): Iterable<NestedAlternative> {
    for (const e of alternative.elements) {
        if (e.type === "Group" || e.type === "CapturingGroup") {
            for (const a of e.alternatives) {
                if (e.alternatives.length > 1) {
                    yield a
                }

                yield* iterateNestedAlternatives(a)
            }
        }

        if (e.type === "CharacterClass" && !e.negate) {
            const nested: NestedAlternative[] = []
            for (const charElement of e.elements) {
                if (charElement.type === "CharacterClassRange") {
                    const min = charElement.min
                    const max = charElement.max
                    if (min.value === max.value) {
                        nested.push(charElement)
                    } else if (min.value + 1 === max.value) {
                        nested.push(min, max)
                    } else {
                        nested.push(charElement, min, max)
                    }
                } else {
                    nested.push(charElement)
                }
            }
            if (nested.length > 1) yield* nested
        }
    }
}

/**
 * A nested alternative + the partial NFA of that nested alternatives.
 *
 * The partial NFA is generated by {@link PartialParser}.
 */
interface PartialAlternative {
    nested: NestedAlternative
    nfa: NFA
}

/**
 * This will return all partial alternatives.
 *
 * A partial alternative is the NFA of the given alternative but with one
 * nested alternative missing.
 */
function* iteratePartialAlternatives(
    alternative: Alternative,
    parser: JS.Parser,
): Iterable<PartialAlternative> {
    if (isNonRegular(alternative)) {
        return
    }

    const maxCharacter = parser.ast.flags.unicode ? 0x10ffff : 0xffff
    const partialParser = new PartialParser(parser, {
        assertions: "throw",
        backreferences: "throw",
    })

    for (const nested of iterateNestedAlternatives(alternative)) {
        try {
            const expression = partialParser.parse(alternative, nested)
            const nfa = NFA.fromRegex(expression, { maxCharacter })
            yield { nested, nfa }
        } catch (error) {
            // ignore error and skip this
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
interface NestedSubsetResult extends ResultBase {
    type: "NestedSubset"
    nested: NestedAlternative
}
interface PrefixSubsetResult extends ResultBase {
    type: "PrefixSubset"
}
interface PrefixNestedSubsetResult extends ResultBase {
    type: "PrefixNestedSubset"
    nested: NestedAlternative
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
    | NestedSubsetResult
    | PrefixSubsetResult
    | PrefixNestedSubsetResult
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
    flags: ReadonlyFlags,
): Iterable<Result> {
    // eslint-disable-next-line func-style -- x
    const shortCircuit: Parameters<typeof isEqualNodes>[3] = (a) => {
        return a.type === "CapturingGroup" ? false : null
    }

    for (let i = 0; i < alternatives.length; i++) {
        const alternative = alternatives[i]

        for (let j = 0; j < i; j++) {
            const other = alternatives[j]

            if (isEqualNodes(other, alternative, flags, shortCircuit)) {
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
    flags: ReadonlyFlags,
    hasNothingAfter: boolean,
): Iterable<Result> {
    const isCoveredOptions: Parameters<typeof isCoveredNode>[2] = {
        flags,
        canOmitRight: hasNothingAfter,
    }
    const isCoveredOptionsNoPrefix: Parameters<typeof isCoveredNode>[2] = {
        flags,
        canOmitRight: false,
    }

    for (let i = 0; i < alternatives.length; i++) {
        const alternative = alternatives[i]

        for (let j = 0; j < i; j++) {
            const other = alternatives[j]

            if (isCoveredNode(other, alternative, isCoveredOptions)) {
                if (isEqualNodes(other, alternative, flags)) {
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
    parser: JS.Parser,
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
                .filter(([otherNfa]) => !isDisjointWith(nfa, otherNfa))

            if (overlapping.length >= 1) {
                const othersNfa = unionAll(overlapping.map(([n]) => n))
                const others = overlapping.map(([, , a]) => a)

                // Only checking for a subset relation is sufficient here.
                // Duplicates are VERY unlikely. (Who would use alternatives
                // like `a|a[^]*`?)

                if (isSubsetOf(othersNfa, nfa)) {
                    yield { type: "PrefixSubset", alternative, others }
                } else {
                    const nested = tryFindNestedSubsetResult(
                        overlapping.map((o) => [o[0], o[2]]),
                        othersNfa,
                        alternative,
                        parser,
                    )

                    if (nested) {
                        yield { ...nested, type: "PrefixNestedSubset" }
                    }
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
    flags: ReadonlyFlags,
    { hasNothingAfter, parser, ignoreOverlap }: Options,
): Iterable<Result> {
    const previous: [NFA, boolean, Alternative][] = []
    for (let i = 0; i < alternatives.length; i++) {
        const alternative = alternatives[i]
        const { nfa, partial } = toNFA(parser, alternative)

        const overlapping = previous.filter(
            ([otherNfa]) => !isDisjointWith(nfa, otherNfa),
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

                case SubsetRelation.leftSupersetOfRight: {
                    const reorder = canReorder([alternative, ...others], flags)

                    if (reorder) {
                        // We are allowed to freely reorder the alternatives.
                        // This means that we can reverse the order of our
                        // alternatives to convert the superset into a subset.
                        for (const other of others) {
                            yield {
                                type: "Subset",
                                alternative: other,
                                others: [alternative],
                            }
                        }
                    } else {
                        yield { type: "Superset", alternative, others }
                    }
                    break
                }

                case SubsetRelation.none:
                case SubsetRelation.unknown: {
                    const nested = tryFindNestedSubsetResult(
                        overlapping.map((o) => [o[0], o[2]]),
                        othersNfa,
                        alternative,
                        parser,
                    )
                    if (nested) {
                        yield nested
                        break
                    }

                    if (!ignoreOverlap) {
                        yield {
                            type: "Overlap",
                            alternative,
                            others,
                            overlap: NFA.fromIntersection(nfa, othersNfa),
                        }
                    }
                    break
                }

                default:
                    throw new Error(relation)
            }
        }

        previous.push([nfa, partial, alternative])
    }

    if (hasNothingAfter) {
        yield* findPrefixDuplicationNfa(previous, parser)
    }
}

/**
 * Given an alternative and list of overlapping other alternatives, this will
 * try to find a nested alternative within the given alternative such that the
 * nested alternative is a subset of the other alternatives.
 */
function tryFindNestedSubsetResult(
    others: [ReadonlyNFA, Alternative][],
    othersNfa: ReadonlyNFA,
    alternative: Alternative,
    parser: JS.Parser,
): NestedSubsetResult | undefined {
    const disjointElements = new Set<Node>()

    for (const { nested, nfa: nestedNfa } of iteratePartialAlternatives(
        alternative,
        parser,
    )) {
        if (hasSomeAncestor(nested, (a) => disjointElements.has(a))) {
            // there's no point in trying because the partial NFA of an
            // ancestor of this nested alternative was disjoint with the
            // target (others) NFA
            continue
        }

        if (isDisjointWith(othersNfa, nestedNfa)) {
            disjointElements.add(nested)
            continue
        }

        if (isSubsetOf(othersNfa, nestedNfa)) {
            return {
                type: "NestedSubset",
                alternative,
                nested,
                others: others
                    .filter((o) => !isDisjointWith(o[0], nestedNfa))
                    .map((o) => o[1]),
            }
        }
    }

    return undefined
}

/**
 * Tries to find duplication in the given alternatives
 */
function* findDuplication(
    alternatives: Alternative[],
    flags: ReadonlyFlags,
    options: Options,
): Iterable<Result> {
    // AST-based approach
    if (options.fastAst) {
        yield* findDuplicationAstFast(alternatives, flags)
    } else {
        yield* findDuplicationAst(alternatives, flags, options.hasNothingAfter)
    }

    // NFA-based approach
    if (!options.noNfa) {
        yield* findDuplicationNfa(alternatives, flags, options)
    }
}

const RESULT_TYPE_ORDER: Result["type"][] = [
    "Duplicate",
    "Subset",
    "NestedSubset",
    "PrefixSubset",
    "PrefixNestedSubset",
    "Superset",
    "Overlap",
]

/**
 * Returns an array of the given results that is sorted by result type from
 * most important to least important.
 */
function deduplicateResults(
    unsorted: Iterable<Result>,
    { reportExp }: FilterInfo,
): Result[] {
    const results = [...unsorted].sort(
        (a, b) =>
            RESULT_TYPE_ORDER.indexOf(a.type) -
            RESULT_TYPE_ORDER.indexOf(b.type),
    )

    const seen = new Map<Alternative, Result["type"]>()
    return results.filter(({ alternative, type }) => {
        const firstSeen = seen.get(alternative)

        if (firstSeen === undefined) {
            seen.set(alternative, type)
            return true
        }

        if (
            reportExp &&
            firstSeen === "PrefixSubset" &&
            type !== "PrefixSubset"
        ) {
            // Prefix subset might overshadow some other results (Superset or
            // Overlap) that report exponential backtracking. In this case, we
            // want to report BOTH the Prefix subset and one Superset or
            // Overlap.
            seen.set(alternative, type)
            return true
        }

        return false
    })
}

/**
 * Throws if called.
 */
function assertNever(value: never): never {
    throw new Error(`Invalid value: ${value}`)
}

/** Mentions the given nested alternative. */
function mentionNested(nested: NestedAlternative): string {
    if (nested.type === "Alternative") {
        return mention(nested)
    }
    return mentionChar(nested)
}

/**
 * Returns a fix that removes the given alternative.
 */
function fixRemoveNestedAlternative(
    context: RegExpContext,
    alternative: NestedAlternative,
) {
    switch (alternative.type) {
        case "Alternative":
            return fixRemoveAlternative(context, alternative)

        case "Character":
        case "CharacterClassRange":
        case "CharacterSet": {
            if (alternative.parent.type !== "CharacterClass") {
                // This isn't supposed to happen. We can't just remove the only
                // alternative of its parent
                return () => null
            }

            return fixRemoveCharacterClassElement(context, alternative)
        }

        default:
            throw assertNever(alternative)
    }
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
const enum ReportUnreachable {
    certain = "certain",
    potential = "potential",
}

const enum MaybeBool {
    false = 0,
    true = 1,
    maybe = 2,
}

interface FilterInfo {
    stared: MaybeBool
    nothingAfter: MaybeBool

    reportExp: boolean
    reportPrefix: boolean
}

export default createRule("no-dupe-disjunctions", {
    meta: {
        docs: {
            description: "disallow duplicate disjunctions",
            category: "Possible Errors",
            recommended: true,
        },
        hasSuggestions: true,
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
                    reportUnreachable: {
                        enum: ["certain", "potential"],
                    },
                },
                additionalProperties: false,
            },
        ],
        messages: {
            duplicate:
                "Unexpected duplicate alternative. This alternative can be removed.{{cap}}{{exp}}",
            subset: "Unexpected useless alternative. This alternative is a strict subset of {{others}} and can be removed.{{cap}}{{exp}}",
            nestedSubset:
                "Unexpected useless element. All paths of {{root}} that go through {{nested}} are a strict subset of {{others}}. This element can be removed.{{cap}}{{exp}}",
            prefixSubset:
                "Unexpected useless alternative. This alternative is already covered by {{others}} and can be removed.{{cap}}",
            prefixNestedSubset:
                "Unexpected useless element. All paths of {{root}} that go through {{nested}} are already covered by {{others}}. This element can be removed.{{cap}}",
            superset:
                "Unexpected superset. This alternative is a superset of {{others}}. It might be possible to remove the other alternative(s).{{cap}}{{exp}}",
            overlap:
                "Unexpected overlap. This alternative overlaps with {{others}}. The overlap is {{expr}}.{{cap}}{{exp}}",

            remove: "Remove the {{alternative}} {{type}}.",
            replaceRange: "Replace {{range}} with {{replacement}}.",
        },
        type: "suggestion", // "problem",
    },
    create(context) {
        const reportExponentialBacktracking: ReportExponentialBacktracking =
            context.options[0]?.reportExponentialBacktracking ??
            ReportExponentialBacktracking.potential
        const reportUnreachable: ReportUnreachable =
            context.options[0]?.reportUnreachable ?? ReportUnreachable.certain
        const report: ReportOption =
            context.options[0]?.report ?? ReportOption.trivial

        const allowedRanges = getAllowedCharRanges(undefined, context)

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
                            (flagsString || "").replace(/[^gimsuy]/gu, ""),
                        ),
                    ].join(""),
                ),
            })

            /** Returns the filter information for the given node */
            function getFilterInfo(parentNode: ParentNode): FilterInfo {
                const usage = getUsageOfPattern()

                let stared: MaybeBool
                if (isStared(parentNode)) {
                    stared = MaybeBool.true
                } else if (
                    usage === UsageOfPattern.partial ||
                    usage === UsageOfPattern.mixed
                ) {
                    stared = MaybeBool.maybe
                } else {
                    stared = MaybeBool.false
                }

                // eslint-disable-next-line one-var -- false positive
                let nothingAfter: MaybeBool
                if (!hasNothingAfterNode(parentNode)) {
                    nothingAfter = MaybeBool.false
                } else if (
                    usage === UsageOfPattern.partial ||
                    usage === UsageOfPattern.mixed
                ) {
                    nothingAfter = MaybeBool.maybe
                } else {
                    nothingAfter = MaybeBool.true
                }

                // eslint-disable-next-line one-var -- false positive
                let reportExp: boolean
                switch (reportExponentialBacktracking) {
                    case ReportExponentialBacktracking.none:
                        reportExp = false
                        break

                    case ReportExponentialBacktracking.certain:
                        reportExp = stared === MaybeBool.true
                        break

                    case ReportExponentialBacktracking.potential:
                        reportExp = stared !== MaybeBool.false
                        break

                    default:
                        assertNever(reportExponentialBacktracking)
                }

                // eslint-disable-next-line one-var -- false positive
                let reportPrefix: boolean
                switch (reportUnreachable) {
                    case ReportUnreachable.certain:
                        reportPrefix = nothingAfter === MaybeBool.true
                        break

                    case ReportUnreachable.potential:
                        reportPrefix = nothingAfter !== MaybeBool.false
                        break

                    default:
                        assertNever(reportUnreachable)
                }

                return { stared, nothingAfter, reportExp, reportPrefix }
            }

            /** Verify group node */
            function verify(parentNode: ParentNode) {
                const info = getFilterInfo(parentNode)

                const rawResults = findDuplication(
                    parentNode.alternatives,
                    flags,
                    {
                        fastAst: false,
                        noNfa: false,
                        ignoreOverlap:
                            !info.reportExp && report !== ReportOption.all,
                        hasNothingAfter: info.reportPrefix,
                        parser,
                    },
                )

                let results = filterResults([...rawResults], info)
                results = deduplicateResults(results, info)
                results.forEach((result) => reportResult(result, info))
            }

            /** Filters the results of a parent node. */
            function filterResults(
                results: Result[],
                { nothingAfter, reportExp, reportPrefix }: FilterInfo,
            ): Result[] {
                switch (report) {
                    case ReportOption.all: {
                        // We really want to report _everything_.
                        return results
                    }
                    case ReportOption.trivial: {
                        // For "trivial", we want to filter out all results
                        // where the user cannot just remove the reported
                        // alternative. So "Overlap" and "Superset" types are
                        // removed.

                        return results.filter(({ type }) => {
                            switch (type) {
                                case "Duplicate":
                                case "Subset":
                                case "NestedSubset":
                                    return true

                                case "Overlap":
                                case "Superset":
                                    return reportExp

                                case "PrefixSubset":
                                case "PrefixNestedSubset":
                                    return reportPrefix

                                default:
                                    throw assertNever(type)
                            }
                        })
                    }
                    case ReportOption.interesting: {
                        // For "interesting", we want to behave like "trivial"
                        // but we also want to retain "Superset" results like
                        // `\b(?:Foo|\w+)\b`. So "Overlap" types are always
                        // removed and "Superset" types are removed if there is
                        // nothing after it.

                        return results.filter(({ type }) => {
                            switch (type) {
                                case "Duplicate":
                                case "Subset":
                                case "NestedSubset":
                                    return true

                                case "Overlap":
                                    return reportExp

                                case "Superset":
                                    return (
                                        reportExp ||
                                        nothingAfter === MaybeBool.false
                                    )

                                case "PrefixSubset":
                                case "PrefixNestedSubset":
                                    return reportPrefix

                                default:
                                    throw assertNever(type)
                            }
                        })
                    }
                    default:
                        throw assertNever(report)
                }
            }

            /** Prints the given character. */
            function printChar(char: number): string {
                if (inRange(allowedRanges, char)) {
                    return String.fromCodePoint(char)
                }

                if (char === 0) return "\\0"
                if (char <= 0xff)
                    return `\\x${char.toString(16).padStart(2, "0")}`
                if (char <= 0xffff)
                    return `\\u${char.toString(16).padStart(4, "0")}`

                return `\\u{${char.toString(16)}}`
            }

            /** Returns suggestions for fixing the given report */
            function getSuggestions(
                result: Result,
            ): Rule.SuggestionReportDescriptor[] {
                const alternative =
                    result.type === "NestedSubset" ||
                    result.type === "PrefixNestedSubset"
                        ? result.nested
                        : result.alternative

                const containsCapturingGroup = hasSomeDescendant(
                    alternative,
                    (d) => d.type === "CapturingGroup",
                )
                if (containsCapturingGroup) {
                    // we can't just remove a capturing group
                    return []
                }

                if (result.type === "Overlap" || result.type === "Superset") {
                    // the types of results cannot be trivially fixed by
                    // removing an alternative.
                    return []
                }

                if (
                    alternative.type === "Character" &&
                    alternative.parent.type === "CharacterClassRange"
                ) {
                    const range = alternative.parent

                    let replacement
                    if (range.min.value + 1 === range.max.value) {
                        replacement =
                            range.min === alternative
                                ? range.max.raw
                                : range.min.raw
                    } else {
                        if (range.min === alternative) {
                            // replace with {min+1}-{max}
                            const min = printChar(range.min.value + 1)
                            replacement = `${min}-${range.max.raw}`
                        } else {
                            // replace with {min}-{max-1}
                            const max = printChar(range.max.value - 1)
                            replacement = `${range.min.raw}-${max}`
                        }
                    }

                    return [
                        {
                            messageId: "replaceRange",
                            data: {
                                range: mentionChar(range),
                                replacement: mention(replacement),
                            },
                            fix: regexpContext.fixReplaceNode(
                                range,
                                replacement,
                            ),
                        },
                    ]
                }

                return [
                    {
                        messageId: "remove",
                        data: {
                            alternative: mentionNested(alternative),
                            type:
                                alternative.type === "Alternative"
                                    ? "alternative"
                                    : "element",
                        },
                        fix: fixRemoveNestedAlternative(
                            regexpContext,
                            alternative,
                        ),
                    },
                ]
            }

            /** Report the given result. */
            function reportResult(result: Result, { stared }: FilterInfo) {
                let exp
                if (stared === MaybeBool.true) {
                    exp =
                        " This ambiguity is likely to cause exponential backtracking."
                } else if (stared === MaybeBool.maybe) {
                    exp =
                        " This ambiguity might cause exponential backtracking."
                } else {
                    exp = ""
                }

                const reportAlternative =
                    result.type === "NestedSubset" ||
                    result.type === "PrefixNestedSubset"
                        ? result.nested
                        : result.alternative

                const loc = getRegexpLocation(reportAlternative)

                const cap = hasSomeDescendant(
                    reportAlternative,
                    (d) => d.type === "CapturingGroup",
                )
                    ? " Careful! This alternative contains capturing groups which might be difficult to remove."
                    : ""

                const others = mention(
                    result.others.map((a) => a.raw).join("|"),
                )

                const suggest = getSuggestions(result)

                switch (result.type) {
                    case "Duplicate":
                        context.report({
                            node,
                            loc,
                            messageId: "duplicate",
                            data: { exp, cap, others },
                            suggest,
                        })
                        break

                    case "Subset":
                        context.report({
                            node,
                            loc,
                            messageId: "subset",
                            data: { exp, cap, others },
                            suggest,
                        })
                        break

                    case "NestedSubset":
                        context.report({
                            node,
                            loc,
                            messageId: "nestedSubset",
                            data: {
                                exp,
                                cap,
                                others,
                                root: mention(result.alternative),
                                nested: mentionNested(result.nested),
                            },
                            suggest,
                        })
                        break

                    case "PrefixSubset":
                        context.report({
                            node,
                            loc,
                            messageId: "prefixSubset",
                            data: { exp, cap, others },
                            suggest,
                        })
                        break

                    case "PrefixNestedSubset":
                        context.report({
                            node,
                            loc,
                            messageId: "prefixNestedSubset",
                            data: {
                                exp,
                                cap,
                                others,
                                root: mention(result.alternative),
                                nested: mentionNested(result.nested),
                            },
                            suggest,
                        })
                        break

                    case "Superset":
                        context.report({
                            node,
                            loc,
                            messageId: "superset",
                            data: { exp, cap, others },
                            suggest,
                        })
                        break

                    case "Overlap":
                        context.report({
                            node,
                            loc,
                            messageId: "overlap",
                            data: {
                                exp,
                                cap,
                                others,
                                expr: mention(
                                    faToSource(result.overlap, flags),
                                ),
                            },
                            suggest,
                        })
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
