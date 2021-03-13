import type {
    Alternative,
    Assertion,
    CapturingGroup,
    Quantifier,
    Group,
    CharacterClass,
    CharacterSet,
    Character,
    Backreference,
    CharacterClassRange,
    Node,
    RegExpLiteral,
    Pattern,
    Flags,
    Element,
    CharacterClassElement,
} from "regexpp/ast"

export type ShortCircuit = (aNode: Node, bNode: Node) => boolean | null

const EQUALS_CHECKER = {
    Alternative(a: Alternative, b: Alternative, shortCircuit?: ShortCircuit) {
        return isEqualElements(a.elements, b.elements, shortCircuit)
    },
    Assertion(a: Assertion, b: Assertion, shortCircuit?: ShortCircuit) {
        if (a.kind === "start" || a.kind === "end") {
            /* istanbul ignore next */
            return a.kind === b.kind
        }
        if (a.kind === "word") {
            return b.kind === "word" && a.negate === b.negate
        }
        if (a.kind === "lookahead" || a.kind === "lookbehind") {
            if (b.kind === a.kind && a.negate === b.negate) {
                return isEqualAlternatives(
                    a.alternatives,
                    b.alternatives,
                    shortCircuit,
                )
            }
            return false
        }
        /* istanbul ignore next */
        return false
    },
    Backreference(a: Backreference, b: Backreference) {
        return a.ref === b.ref
    },
    CapturingGroup(
        a: CapturingGroup,
        b: CapturingGroup,
        shortCircuit?: ShortCircuit,
    ) {
        return (
            a.name === b.name &&
            isEqualAlternatives(a.alternatives, b.alternatives, shortCircuit)
        )
    },
    Character(a: Character, b: Character) {
        return a.value === b.value
    },
    CharacterClass(
        a: CharacterClass,
        b: CharacterClass,
        shortCircuit?: ShortCircuit,
    ) {
        return (
            a.negate === b.negate &&
            isEqualAlternatives(a.elements, b.elements, shortCircuit)
        )
    },
    CharacterClassRange(
        a: CharacterClassRange,
        b: CharacterClassRange,
        shortCircuit?: ShortCircuit,
    ) {
        return (
            isEqualNodes(a.min, b.min, shortCircuit) &&
            isEqualNodes(a.max, b.max, shortCircuit)
        )
    },
    CharacterSet(a: CharacterSet, b: CharacterSet) {
        if (a.kind === "any") {
            return b.kind === "any"
        }
        if (a.kind === "digit" || a.kind === "space" || a.kind === "word") {
            return a.kind === b.kind && a.negate === b.negate
        }
        if (a.kind === "property") {
            return (
                b.kind === "property" &&
                a.negate === b.negate &&
                a.key === b.key &&
                a.value === b.value
            )
        }
        /* istanbul ignore next */
        return false
    },
    /* istanbul ignore next */
    Flags(a: Flags, b: Flags) {
        /* istanbul ignore next */
        return (
            a.dotAll === b.dotAll &&
            a.global === b.global &&
            a.ignoreCase === b.ignoreCase &&
            a.multiline === b.multiline &&
            a.sticky === b.sticky &&
            a.unicode === b.unicode
        )
    },
    Group(a: Group, b: Group, shortCircuit?: ShortCircuit) {
        return isEqualAlternatives(a.alternatives, b.alternatives, shortCircuit)
    },
    Pattern(a: Pattern, b: Pattern, shortCircuit?: ShortCircuit) {
        return isEqualAlternatives(a.alternatives, b.alternatives, shortCircuit)
    },
    Quantifier(a: Quantifier, b: Quantifier, shortCircuit?: ShortCircuit) {
        return (
            a.min === b.min &&
            a.max === b.max &&
            a.greedy === b.greedy &&
            isEqualNodes(a.element, b.element, shortCircuit)
        )
    },
    RegExpLiteral(
        a: RegExpLiteral,
        b: RegExpLiteral,
        shortCircuit?: ShortCircuit,
    ) {
        return (
            isEqualNodes(a.pattern, b.pattern, shortCircuit) &&
            isEqualNodes(a.flags, b.flags, shortCircuit)
        )
    },
}

/** Check whether given nodes is equals or not. */
export function isEqualNodes<N extends Node>(
    a: N,
    b: N,
    shortCircuit?: ShortCircuit,
): boolean {
    if (a.type !== b.type) {
        return false
    }
    if (shortCircuit) {
        const kind = shortCircuit(a, b)
        if (kind != null) {
            return kind
        }
    }
    if (/[(*+?[\\{|]/.test(a.raw) || /[(*+?[\\{|]/.test(b.raw)) {
        return EQUALS_CHECKER[a.type](a as never, b as never, shortCircuit)
    }
    return a.raw === b.raw
}

/** Check whether given elements are equals or not. */
function isEqualElements(
    a: Element[],
    b: Element[],
    shortCircuit?: ShortCircuit,
) {
    if (a.length !== b.length) {
        return false
    }
    for (let index = 0; index < a.length; index++) {
        const ae = a[index]
        const be = b[index]
        if (!isEqualNodes(ae, be, shortCircuit)) {
            return false
        }
    }
    return true
}

/** Check whether given alternatives are equals or not. */
function isEqualAlternatives<N extends Alternative | CharacterClassElement>(
    a: N[],
    b: N[],
    shortCircuit?: ShortCircuit,
) {
    if (a.length !== b.length) {
        return false
    }
    const beList = [...b]
    for (const ae of a) {
        const bIndex = beList.findIndex((be) =>
            isEqualNodes(ae, be, shortCircuit),
        )
        if (bIndex >= 0) {
            beList.splice(bIndex, 1)
        } else {
            return false
        }
    }
    return true
}
