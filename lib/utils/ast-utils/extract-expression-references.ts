import type { Rule } from "eslint"
import type { Variable } from "eslint-scope"
import type {
    ArrayPattern,
    ArrowFunctionExpression,
    CallExpression,
    ConditionalExpression,
    Expression,
    ForOfStatement,
    FunctionDeclaration,
    FunctionExpression,
    Identifier,
    IfStatement,
    LogicalExpression,
    MemberExpression,
    ObjectPattern,
    Pattern,
    UnaryExpression,
} from "estree"
import { findFunction, findVariable, getParent } from "./utils"

export type ExpressionReference =
    | {
          // The result of the expression is not referenced.
          type: "unused"
          node: Expression
      }
    | {
          // Unknown what the expression was referenced for.
          type: "unknown"
          node: Expression
      }
    | {
          // The expression is exported.
          type: "exported"
          node: Expression
      }
    | {
          // The expression is referenced for member access.
          type: "member"
          node: Expression
          memberExpression: MemberExpression
      }
    | {
          // The expression is referenced for destructuring.
          type: "destructuring"
          node: Expression
          pattern: ObjectPattern | ArrayPattern
      }
    | {
          // The expression is referenced to give as an argument.
          type: "argument"
          node: Expression
          callExpression: CallExpression
      }
    | {
          // The expression is referenced to call.
          type: "call"
          node: Expression
      }
    | {
          // The expression is referenced for iteration.
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
): Iterable<ExpressionReference> {
    yield* iterateReferencesForExpression(node, context, {
        variables: new Set(),
        functions: new Map(),
    })
}

/** Extract references from the given identifier */
export function* extractExpressionReferencesForVariable(
    node: Identifier,
    context: Rule.RuleContext,
): Iterable<ExpressionReference> {
    yield* iterateReferencesForVariable(node, context, {
        variables: new Set(),
        functions: new Map(),
    })
}

/* eslint-disable complexity -- ignore */
/** Iterate references from the given expression */
function* iterateReferencesForExpression(
    /* eslint-enable complexity -- ignore */
    expression: Expression,
    context: Rule.RuleContext,
    alreadyChecked: AlreadyChecked,
): Iterable<ExpressionReference> {
    let node = expression
    let parent = getParent(node)
    while (
        parent?.type === "ChainExpression" ||
        // @ts-expect-error -- TS AST
        parent?.type === "TSNonNullExpression" ||
        // @ts-expect-error -- TS AST
        parent?.type === "TSAsExpression"
    ) {
        node = parent
        parent = getParent(node)
    }
    if (!parent || parent.type === "ExpressionStatement") {
        yield { node, type: "unused" }
        return
    }
    if (parent.type === "MemberExpression") {
        if (parent.object === node) {
            yield { node, type: "member", memberExpression: parent }
        } else {
            yield { node, type: "unknown" }
        }
    } else if (parent.type === "AssignmentExpression") {
        if (parent.right === node && parent.operator === "=") {
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
        if (parent.init === node) {
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
        const argIndex = parent.arguments.indexOf(node)
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
        if (parent.right === node) {
            yield { node, type: "iteration", for: parent }
        } else {
            yield { node, type: "unknown" }
        }
    } else if (
        parent.type === "IfStatement" ||
        parent.type === "ConditionalExpression" ||
        parent.type === "LogicalExpression" ||
        parent.type === "UnaryExpression"
    ) {
        if (isUsedInTest(parent, node)) {
            // The expression used in the test does not need to be tracked and returns nothing.
        } else {
            yield { node, type: "unknown" }
        }
    } else {
        yield { node, type: "unknown" }
    }
}

/** Checks whether the expression is used in the test. */
function isUsedInTest(
    parent:
        | IfStatement
        | ConditionalExpression
        | LogicalExpression
        | UnaryExpression,
    node: Expression,
) {
    if (parent.type === "IfStatement") {
        return parent.test === node
    }
    if (parent.type === "ConditionalExpression") {
        return parent.test === node
    }
    if (parent.type === "LogicalExpression") {
        return parent.operator === "&&" && parent.left === node
    }
    if (parent.type === "UnaryExpression") {
        return parent.operator === "!" && parent.argument === node
    }
    return false
}

/** Iterate references for the given pattern node. */
function* iterateReferencesForESPattern(
    expression: Expression,
    pattern: Pattern,
    context: Rule.RuleContext,
    alreadyChecked: AlreadyChecked,
): Iterable<ExpressionReference> {
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
        yield { node: expression, type: "destructuring", pattern: target }
    } else {
        yield { node: expression, type: "unknown" }
    }
}

/** Iterate references for the given variable id node. */
function* iterateReferencesForVariable(
    identifier: Identifier,
    context: Rule.RuleContext,
    alreadyChecked: AlreadyChecked,
): Iterable<ExpressionReference> {
    const variable = findVariable(context, identifier)
    if (!variable) {
        yield { node: identifier, type: "unknown" }
        return
    }
    if (alreadyChecked.variables.has(variable)) {
        return
    }
    alreadyChecked.variables.add(variable)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- expect
    if ((variable as any).eslintUsed) {
        yield { node: identifier, type: "exported" }
    }
    const readReferences = variable.references.filter((ref) => ref.isRead())
    if (!readReferences.length) {
        yield { node: identifier, type: "unused" }
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
    expression: Expression,
    fn: FunctionDeclaration | FunctionExpression | ArrowFunctionExpression,
    argIndex: number,
    context: Rule.RuleContext,
    alreadyChecked: AlreadyChecked,
): Iterable<ExpressionReference> {
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
        yield { node: expression, type: "unknown" }
        return
    }
    yield* iterateReferencesForESPattern(
        expression,
        argNode,
        context,
        alreadyChecked,
    )
}
