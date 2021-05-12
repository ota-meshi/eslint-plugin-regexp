import type { Rule } from "eslint"
import type {
    ArrowFunctionExpression,
    Expression,
    FunctionDeclaration,
    FunctionExpression,
    Identifier,
    Literal,
    MemberExpression,
    ObjectPattern,
    Pattern,
} from "estree"
import { findVariable, getParent, getStringIfConstant } from "./ast-utils"

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
    for (const usage of iterateUsageOfPatternForExpression(
        node,
        context,
        new Map(),
    )) {
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
function* iterateUsageOfPatternForExpression(
    node: Expression,
    context: Rule.RuleContext,
    alreadyFn: Map<
        FunctionDeclaration | FunctionExpression | ArrowFunctionExpression,
        Set<number>
    >,
): IterableIterator<InternalUsageOfPattern> {
    const parent = getParent(node)
    if (!parent) {
        return
    }
    if (parent.type === "MemberExpression") {
        if (parent.object === node) {
            yield* iterateUsageOfPatternForMemberExpression(parent, context)
        } else {
            // unknown.
            yield UsageOfPattern.unknown
        }
    } else if (parent.type === "AssignmentExpression") {
        if (parent.right === node) {
            yield* iterateUsageOfPatternForESPattern(
                parent.left,
                context,
                alreadyFn,
            )
        } else {
            // unknown.
            yield UsageOfPattern.unknown
        }
    } else if (parent.type === "VariableDeclarator") {
        if (parent.init === node) {
            yield* iterateUsageOfPatternForESPattern(
                parent.id,
                context,
                alreadyFn,
            )
        } else {
            // unknown.
            yield UsageOfPattern.unknown
        }
    } else if (parent.type === "CallExpression") {
        const argIndex = parent.arguments.indexOf(node)
        if (argIndex > -1) {
            // `foo(regexp)`
            if (parent.callee.type === "Identifier") {
                const fn = findFunction(context, parent.callee)
                if (fn) {
                    yield* iterateUsageOfPatternForFunctionArgument(
                        fn,
                        argIndex,
                        context,
                        alreadyFn,
                    )
                    return
                }
            }

            // It could be a call to a known method that uses a regexp (`match`, `matchAll`, `split`, `replace`, `replaceAll`, and `search`),
            // or it could use an unknown method, both of which are considered to have used a regexp.
            yield UsageOfPattern.whole
        } else {
            // unknown.
            yield UsageOfPattern.unknown
        }
    } else if (parent.type === "ChainExpression") {
        yield* iterateUsageOfPatternForExpression(parent, context, alreadyFn)
    } else {
        // unknown.
        yield UsageOfPattern.unknown
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

/** Iterate the usage of pattern for the given pattern node. */
function* iterateUsageOfPatternForESPattern(
    node: Pattern,
    context: Rule.RuleContext,
    alreadyFn: Map<
        FunctionDeclaration | FunctionExpression | ArrowFunctionExpression,
        Set<number>
    >,
): IterableIterator<InternalUsageOfPattern> {
    if (node.type === "Identifier") {
        // e.g. const foo = regexp
        yield* iterateUsageOfPatternForVariable(node, context, alreadyFn)
    } else if (node.type === "ObjectPattern") {
        yield* iterateUsageOfPatternForObjectPattern(node, context)
    } else {
        // unknown
        yield UsageOfPattern.unknown
    }
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

/** Iterate the usage of pattern for the given variable id node. */
function* iterateUsageOfPatternForVariable(
    node: Identifier,
    context: Rule.RuleContext,
    alreadyFn: Map<
        FunctionDeclaration | FunctionExpression | ArrowFunctionExpression,
        Set<number>
    >,
): IterableIterator<InternalUsageOfPattern> {
    const variable = findVariable(context, node)
    if (!variable) {
        // unknown.
        yield UsageOfPattern.unknown
        return
    }
    const readReferences = variable.references.filter((ref) => ref.isRead())
    if (!readReferences.length) {
        // The variable has not been read, so the usage cannot be determined.
        yield UsageOfPattern.unknown
        return
    }
    for (const reference of readReferences) {
        yield* iterateUsageOfPatternForExpression(
            reference.identifier,
            context,
            alreadyFn,
        )
    }
}

/** Iterate the usage of pattern for the given function argument. */
function* iterateUsageOfPatternForFunctionArgument(
    node: FunctionDeclaration | FunctionExpression | ArrowFunctionExpression,
    argIndex: number,
    context: Rule.RuleContext,
    alreadyFn: Map<
        FunctionDeclaration | FunctionExpression | ArrowFunctionExpression,
        Set<number>
    >,
): IterableIterator<InternalUsageOfPattern> {
    let alreadyIndexes = alreadyFn.get(node)
    if (!alreadyIndexes) {
        alreadyIndexes = new Set()
        alreadyFn.set(node, alreadyIndexes)
    }
    if (alreadyIndexes.has(argIndex)) {
        // cannot check
        return
    }
    alreadyIndexes.add(argIndex)
    const argNode = node.params[argIndex]
    if (argNode && argNode.type === "Identifier") {
        yield* iterateUsageOfPatternForVariable(argNode, context, alreadyFn)
    } else {
        // unknown.
        yield UsageOfPattern.unknown
    }
}

/**
 * Find function node
 */
function findFunction(
    context: Rule.RuleContext,
    id: Identifier,
): FunctionDeclaration | FunctionExpression | ArrowFunctionExpression | null {
    const calleeVariable = findVariable(context, id)
    if (!calleeVariable) {
        return null
    }
    if (calleeVariable.defs.length === 1) {
        const def = calleeVariable.defs[0]
        if (def.node.type === "FunctionDeclaration") {
            return def.node
        }
        if (
            def.type === "Variable" &&
            def.parent.kind === "const" &&
            def.node.init
        ) {
            if (
                def.node.init.type === "FunctionExpression" ||
                def.node.init.type === "ArrowFunctionExpression"
            ) {
                return def.node.init
            }
            if (def.node.init.type === "Identifier") {
                return findFunction(context, def.node.init)
            }
        }
    }
    return null
}
