import type { ToCharSetElement, ReadonlyFlags } from "regexp-ast-analysis"
import { toCharSet } from "regexp-ast-analysis"
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
import type { ShortCircuit } from "./common"

/**
 * Returns whether the two given character element as equal in the characters
 * that they accept.
 *
 * This is equivalent to `toCharSet(a).equals(toCharSet(b))` but implemented
 * more efficiently.
 */
function isEqualChar(
    a: ToCharSetElement,
    b: ToCharSetElement,
    flags: ReadonlyFlags,
): boolean {
    if (a.type === "Character") {
        if (b.type === "Character") {
            if (a.value === b.value) {
                return true
            }
        } else if (b.type === "CharacterSet") {
            return false
        }
    } else if (a.type === "CharacterSet") {
        if (b.type === "Character") {
            return false
        } else if (b.type === "CharacterSet") {
            return a.raw === b.raw
        }
    } else if (a.type === "CharacterClassRange") {
        if (b.type === "CharacterClassRange") {
            return a.min.value === b.min.value && a.max.value === b.max.value
        }
    }

    if (a.raw === b.raw) {
        return true
    }

    return toCharSet(a, flags).equals(toCharSet(b, flags))
}

const EQUALS_CHECKER = {
    Alternative(
        a: Alternative,
        b: Alternative,
        flags: ReadonlyFlags,
        shortCircuit?: ShortCircuit,
    ) {
        return isEqualElements(a.elements, b.elements, flags, shortCircuit)
    },
    Assertion(
        a: Assertion,
        b: Assertion,
        flags: ReadonlyFlags,
        shortCircuit?: ShortCircuit,
    ) {
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
                    flags,
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
        flags: ReadonlyFlags,
        shortCircuit?: ShortCircuit,
    ) {
        return (
            a.name === b.name &&
            isEqualAlternatives(
                a.alternatives,
                b.alternatives,
                flags,
                shortCircuit,
            )
        )
    },
    Character(a: Character, b: Character, flags: ReadonlyFlags) {
        return isEqualChar(a, b, flags)
    },
    CharacterClass(a: CharacterClass, b: CharacterClass, flags: ReadonlyFlags) {
        return isEqualChar(a, b, flags)
    },
    CharacterClassRange(
        a: CharacterClassRange,
        b: CharacterClassRange,
        flags: ReadonlyFlags,
    ) {
        return isEqualChar(a, b, flags)
    },
    CharacterSet(a: CharacterSet, b: CharacterSet, flags: ReadonlyFlags) {
        return isEqualChar(a, b, flags)
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
    Group(
        a: Group,
        b: Group,
        flags: ReadonlyFlags,
        shortCircuit?: ShortCircuit,
    ) {
        return isEqualAlternatives(
            a.alternatives,
            b.alternatives,
            flags,
            shortCircuit,
        )
    },
    Pattern(
        a: Pattern,
        b: Pattern,
        flags: ReadonlyFlags,
        shortCircuit?: ShortCircuit,
    ) {
        return isEqualAlternatives(
            a.alternatives,
            b.alternatives,
            flags,
            shortCircuit,
        )
    },
    Quantifier(
        a: Quantifier,
        b: Quantifier,
        flags: ReadonlyFlags,
        shortCircuit?: ShortCircuit,
    ) {
        return (
            a.min === b.min &&
            a.max === b.max &&
            a.greedy === b.greedy &&
            isEqualNodes(a.element, b.element, flags, shortCircuit)
        )
    },
    RegExpLiteral(
        a: RegExpLiteral,
        b: RegExpLiteral,
        flags: ReadonlyFlags,
        shortCircuit?: ShortCircuit,
    ) {
        return (
            isEqualNodes(a.pattern, b.pattern, flags, shortCircuit) &&
            isEqualNodes(a.flags, b.flags, flags, shortCircuit)
        )
    },
}

/**
 * Returns whether the given nodes is a `ToCharSetElement`
 */
function isToCharSetElement(node: Node): node is ToCharSetElement {
    return (
        node.type === "Character" ||
        node.type === "CharacterClass" ||
        node.type === "CharacterClassRange" ||
        node.type === "CharacterSet"
    )
}

/** Check whether given nodes is equals or not. */
export function isEqualNodes<N extends Node>(
    a: N,
    b: N,
    flags: ReadonlyFlags,
    shortCircuit?: ShortCircuit,
): boolean {
    if (isToCharSetElement(a) && isToCharSetElement(b)) {
        return isEqualChar(a, b, flags)
    }

    if (a.type !== b.type) {
        return false
    }
    if (shortCircuit) {
        const kind = shortCircuit(a, b)
        if (kind != null) {
            return kind
        }
    }
    if (/[(*+?[\\{|]/u.test(a.raw) || /[(*+?[\\{|]/u.test(b.raw)) {
        return EQUALS_CHECKER[a.type](
            a as never,
            b as never,
            flags,
            shortCircuit,
        )
    }
    return a.raw === b.raw
}

/** Check whether given elements are equals or not. */
function isEqualElements(
    a: Element[],
    b: Element[],
    flags: ReadonlyFlags,
    shortCircuit?: ShortCircuit,
) {
    if (a.length !== b.length) {
        return false
    }
    for (let index = 0; index < a.length; index++) {
        const ae = a[index]
        const be = b[index]
        if (!isEqualNodes(ae, be, flags, shortCircuit)) {
            return false
        }
    }
    return true
}

/** Check whether given alternatives are equals or not. */
function isEqualAlternatives<N extends Alternative | CharacterClassElement>(
    a: N[],
    b: N[],
    flags: ReadonlyFlags,
    shortCircuit?: ShortCircuit,
) {
    if (a.length !== b.length) {
        return false
    }
    const beList = [...b]
    for (const ae of a) {
        const bIndex = beList.findIndex((be) =>
            isEqualNodes(ae, be, flags, shortCircuit),
        )
        if (bIndex >= 0) {
            beList.splice(bIndex, 1)
        } else {
            return false
        }
    }
    return true
}
