import type { Rule } from "eslint"
import type {
    Expression,
    Identifier,
    Literal,
    MemberExpression,
    ObjectPattern,
} from "estree"
import { getStringIfConstant, extractExpressionReferences } from "./ast-utils"

export enum UsageOfPattern {
    /** The pattern was only used via `.source`. */
    partial,
    /** The pattern was (probably) used the whole pattern as a regular expression. */
    whole,
    /** The pattern was used partial and whole. */
    mixed,
    /** The pattern cannot determine how was used. */
    unknown,
}
type InternalUsageOfPattern =
    | UsageOfPattern.partial
    | UsageOfPattern.whole
    | UsageOfPattern.unknown
/**
 * Returns the usage of pattern.
 */
export function getUsageOfPattern(
    node: Expression,
    context: Rule.RuleContext,
): UsageOfPattern {
    const usageSet = new Set<UsageOfPattern.partial | UsageOfPattern.whole>()
    for (const usage of iterateUsageOfPattern(node, context)) {
        if (usage === UsageOfPattern.unknown) {
            return UsageOfPattern.unknown
        }
        usageSet.add(usage)
    }

    if (usageSet.has(UsageOfPattern.partial)) {
        return usageSet.has(UsageOfPattern.whole)
            ? UsageOfPattern.mixed
            : UsageOfPattern.partial
    }
    return usageSet.has(UsageOfPattern.whole)
        ? UsageOfPattern.whole
        : UsageOfPattern.unknown
}

/** Iterate the usage of pattern for the given expression node. */
function* iterateUsageOfPattern(
    node: Expression,
    context: Rule.RuleContext,
): IterableIterator<InternalUsageOfPattern> {
    for (const ref of extractExpressionReferences(node, context)) {
        if (ref.type === "member") {
            yield* iterateUsageOfPatternForMemberExpression(
                ref.memberExpression,
                context,
            )
        } else if (ref.type === "destructuring") {
            if (ref.pattern.type === "ObjectPattern")
                yield* iterateUsageOfPatternForObjectPattern(
                    ref.pattern,
                    context,
                )
        } else if (ref.type === "unused") {
            // noop
        } else if (ref.type === "argument") {
            // It could be a call to a known method that uses a regexp (`match`, `matchAll`, `split`, `replace`, `replaceAll`, and `search`),
            // or it could use an unknown method, both of which are considered to have used a regexp.
            yield UsageOfPattern.whole
        } else {
            yield UsageOfPattern.unknown
        }
    }
}

/** Iterate the usage of pattern for the given member expression node. */
function* iterateUsageOfPatternForMemberExpression(
    node: MemberExpression,
    context: Rule.RuleContext,
): IterableIterator<InternalUsageOfPattern> {
    const propName: string | null = !node.computed
        ? (node.property as Identifier).name
        : getStringIfConstant(context, node.property)
    yield* iterateUsageOfPatternForPropName(propName)
}

/** Iterate the usage of pattern for the given member expression node. */
function* iterateUsageOfPatternForPropName(
    propName: string | null,
): IterableIterator<InternalUsageOfPattern> {
    const regexpPropName: keyof RegExp | null = propName as never
    if (regexpPropName === "source") {
        yield UsageOfPattern.partial
        return
    }

    if (
        regexpPropName === "compile" ||
        regexpPropName === "dotAll" ||
        regexpPropName === "flags" ||
        regexpPropName === "global" ||
        regexpPropName === "ignoreCase" ||
        regexpPropName === "multiline" ||
        regexpPropName === "sticky" ||
        regexpPropName === "unicode"
    ) {
        // Probably haven't used a regular expression yet.
        return
    }

    // It's probably `exec`,` test`, or `lastIndex`,
    // but it's considered to have been used as a regular expression in other cases as well.
    yield UsageOfPattern.whole
}

/** Iterate the usage of pattern for the given object pattern node. */
function* iterateUsageOfPatternForObjectPattern(
    node: ObjectPattern,
    context: Rule.RuleContext,
): IterableIterator<InternalUsageOfPattern> {
    for (const prop of node.properties) {
        if (prop.type === "RestElement") {
            continue
        }
        let propName: string | null
        if (!prop.computed) {
            propName =
                prop.key.type === "Identifier"
                    ? prop.key.name
                    : String((prop.key as Literal).value)
        } else {
            propName = getStringIfConstant(context, prop.key)
        }
        yield* iterateUsageOfPatternForPropName(propName)
    }
}
