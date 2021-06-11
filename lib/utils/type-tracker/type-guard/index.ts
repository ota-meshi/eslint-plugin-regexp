import type { Rule } from "eslint"
import type * as ES from "estree"
import type { TypeInfo } from "../type-data"
import { TypeUnionOrIntersection } from "../type-data"
import { CodePathContainer } from "./code-path-container"
import { TypeGuardAnalysis } from "./type-guard-analysis"

export class TypeGuardTracker {
    private readonly context: Rule.RuleContext

    private readonly codePathContainer: CodePathContainer

    private readonly cache = new WeakMap<
        ES.Identifier | ES.MemberExpression,
        TypeGuardAnalysis
    >()

    public constructor(context: Rule.RuleContext) {
        this.context = context
        this.codePathContainer = new CodePathContainer(context)
    }

    public getVisitor(): Rule.RuleListener {
        return this.codePathContainer.getVisitor()
    }

    /**
     * Gets the type of the given identifier with the type guard.
     */
    public getTypeGuard(
        node: ES.Identifier | ES.MemberExpression,
    ): TypeInfo | null {
        let typeGuardAnalysis = this.cache.get(node)
        if (!typeGuardAnalysis) {
            typeGuardAnalysis = new TypeGuardAnalysis(
                node,
                this.context,
                this.codePathContainer,
            )
            for (const ref of typeGuardAnalysis.references) {
                this.cache.set(ref, typeGuardAnalysis)
            }
        }

        const types = typeGuardAnalysis.getTypeGuardTypes(node)
        if (types.length) {
            return TypeUnionOrIntersection.buildType(function* () {
                for (const t of types) {
                    yield t
                }
            })
        }

        return null
    }
}
