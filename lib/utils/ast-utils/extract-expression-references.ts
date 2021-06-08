import type { Rule } from "eslint"
import type { Variable } from "eslint-scope"
import type {
    ArrayPattern,
    ArrowFunctionExpression,
    CallExpression,
    Expression,
    ForOfStatement,
    FunctionDeclaration,
    FunctionExpression,
    Identifier,
    MemberExpression,
    ObjectPattern,
    Pattern,
} from "estree"
import { findVariable, getParent } from "."

export type ExpressionReference =
    | {
          // The result of the expression is not referenced.
          type: "unused"
          node: Expression
      }
    | {
          // The expression is referenced as a property name.
          type: "property"
          node: Expression
      }
    | {
          // Unknown how expression is referenced.
          type: "unknown"
          node: Expression
      }
    | {
          // Expression is exported.
          type: "exported"
          node: Expression
      }
    | {
          type: "member"
          node: Expression
          memberExpression: MemberExpression
      }
    | {
          type: "destructuring"
          node: Expression
          pattern: ObjectPattern | ArrayPattern
      }
    | {
          type: "argument"
          node: Expression
          callExpression: CallExpression
      }
    | {
          type: "call"
          node: Expression
      }
    | {
          type: "iteration"
          node: Expression
          for: ForOfStatement
      }

type AlreadyChecked = {
    variables: Set<Variable>
    functions: Map<
        FunctionDeclaration | FunctionExpression | ArrowFunctionExpression,
        Set<number>
    >
}
/** Extract references from the given expression */
export function* extractExpressionReferences(
    node: Expression,
    context: Rule.RuleContext,
): IterableIterator<ExpressionReference> {
    yield* iterateReferencesForExpression(node, context, {
        variables: new Set(),
        functions: new Map(),
    })
}

/** Extract references from the given identifier */
export function* extractExpressionReferencesForVariable(
    node: Identifier,
    context: Rule.RuleContext,
): IterableIterator<ExpressionReference> {
    yield* iterateReferencesForVariable(node, context, {
        variables: new Set(),
        functions: new Map(),
    })
}

/* eslint-disable complexity -- ignore */
/** Iterate references from the given expression */
function* iterateReferencesForExpression(
    /* eslint-enable complexity -- ignore */
    node: Expression,
    context: Rule.RuleContext,
    alreadyChecked: AlreadyChecked,
): IterableIterator<ExpressionReference> {
    let target = node
    let parent = getParent(target)
    while (parent?.type === "ChainExpression") {
        target = parent
        parent = getParent(target)
    }
    if (!parent || parent.type === "ExpressionStatement") {
        yield { node, type: "unused" }
        return
    }
    if (parent.type === "MemberExpression") {
        if (parent.object === target) {
            yield { node, type: "member", memberExpression: parent }
        } else {
            yield { node, type: "property" }
        }
    } else if (parent.type === "AssignmentExpression") {
        if (parent.right === target && parent.operator === "=") {
            yield* iterateReferencesForESPattern(
                node,
                parent.left,
                context,
                alreadyChecked,
            )
        } else {
            yield { node, type: "unknown" }
        }
    } else if (parent.type === "VariableDeclarator") {
        if (parent.init === target) {
            const pp = getParent(getParent(parent))
            if (pp?.type === "ExportNamedDeclaration") {
                yield { node, type: "exported" }
            }
            yield* iterateReferencesForESPattern(
                node,
                parent.id,
                context,
                alreadyChecked,
            )
        } else {
            yield { node, type: "unknown" }
        }
    } else if (parent.type === "CallExpression") {
        const argIndex = parent.arguments.indexOf(target)
        if (argIndex > -1) {
            // `foo(regexp)`
            if (parent.callee.type === "Identifier") {
                const fn = findFunction(context, parent.callee)
                if (fn) {
                    yield* iterateReferencesForFunctionArgument(
                        node,
                        fn,
                        argIndex,
                        context,
                        alreadyChecked,
                    )
                    return
                }
            }
            yield { node, type: "argument", callExpression: parent }
        } else {
            yield { node, type: "call" }
        }
    } else if (
        parent.type === "ExportSpecifier" ||
        parent.type === "ExportDefaultDeclaration"
    ) {
        yield { node, type: "exported" }
    } else if (parent.type === "ForOfStatement") {
        if (parent.right === target) {
            yield { node, type: "iteration", for: parent }
        } else {
            yield { node, type: "unknown" }
        }
    } else {
        yield { node, type: "unknown" }
    }
}

/** Iterate references for the given pattern node. */
function* iterateReferencesForESPattern(
    node: Expression,
    pattern: Pattern,
    context: Rule.RuleContext,
    alreadyChecked: AlreadyChecked,
): IterableIterator<ExpressionReference> {
    let target = pattern
    while (target.type === "AssignmentPattern") {
        target = target.left
    }
    if (target.type === "Identifier") {
        // e.g. const foo = expr
        yield* iterateReferencesForVariable(target, context, alreadyChecked)
    } else if (
        target.type === "ObjectPattern" ||
        target.type === "ArrayPattern"
    ) {
        yield { node, type: "destructuring", pattern: target }
    } else {
        yield { node, type: "unknown" }
    }
}

/** Iterate references for the given variable id node. */
function* iterateReferencesForVariable(
    node: Identifier,
    context: Rule.RuleContext,
    alreadyChecked: AlreadyChecked,
): IterableIterator<ExpressionReference> {
    const variable = findVariable(context, node)
    if (!variable) {
        yield { node, type: "unknown" }
        return
    }
    if (alreadyChecked.variables.has(variable)) {
        return
    }
    alreadyChecked.variables.add(variable)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- expect
    if ((variable as any).eslintUsed) {
        yield { node, type: "exported" }
    }
    const readReferences = variable.references.filter((ref) => ref.isRead())
    if (!readReferences.length) {
        yield { node, type: "unused" }
        return
    }
    for (const reference of readReferences) {
        yield* iterateReferencesForExpression(
            reference.identifier,
            context,
            alreadyChecked,
        )
    }
}

/** Iterate references for the given function argument. */
function* iterateReferencesForFunctionArgument(
    node: Expression,
    fn: FunctionDeclaration | FunctionExpression | ArrowFunctionExpression,
    argIndex: number,
    context: Rule.RuleContext,
    alreadyChecked: AlreadyChecked,
): IterableIterator<ExpressionReference> {
    let alreadyIndexes = alreadyChecked.functions.get(fn)
    if (!alreadyIndexes) {
        alreadyIndexes = new Set()
        alreadyChecked.functions.set(fn, alreadyIndexes)
    }
    if (alreadyIndexes.has(argIndex)) {
        // cannot check
        return
    }
    alreadyIndexes.add(argIndex)
    const params = fn.params.slice(0, argIndex + 1)
    const argNode = params[argIndex]
    if (!argNode || params.some((param) => param?.type === "RestElement")) {
        yield { node, type: "unknown" }
        return
    }
    yield* iterateReferencesForESPattern(node, argNode, context, alreadyChecked)
}

/**
 * Find function node
 */
function findFunction(
    context: Rule.RuleContext,
    id: Identifier,
): FunctionDeclaration | FunctionExpression | ArrowFunctionExpression | null {
    let target = id

    const set = new Set<Identifier>()
    for (;;) {
        if (set.has(target)) {
            return null
        }
        set.add(target)
        const calleeVariable = findVariable(context, target)
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
                    target = def.node.init
                    continue
                }
            }
        }
        return null
    }
}
