import type { MemberExpression } from "estree"
import type { TYPES } from "eslint-utils"
import { READ, ReferenceTracker } from "eslint-utils"
import { createRule } from "../utils"
import { createTypeTracker } from "../utils/type-tracker"

type StaticProperty =
    | "input"
    | "$_"
    | "lastMatch"
    | "$&"
    | "lastParen"
    | "$+"
    | "leftContext"
    | "$`"
    | "rightContext"
    | "$'"
    | "$1"
    | "$2"
    | "$3"
    | "$4"
    | "$5"
    | "$6"
    | "$7"
    | "$8"
    | "$9"
type PrototypeMethod = "compile"
const STATIC_PROPERTIES: StaticProperty[] = [
    "input",
    "$_",
    "lastMatch",
    "$&",
    "lastParen",
    "$+",
    "leftContext",
    "$`",
    "rightContext",
    "$'",
    "$1",
    "$2",
    "$3",
    "$4",
    "$5",
    "$6",
    "$7",
    "$8",
    "$9",
]

const PROTOTYPE_METHODS: PrototypeMethod[] = ["compile"]

export default createRule("no-legacy-features", {
    meta: {
        docs: {
            description: "disallow legacy RegExp features",
            // TODO In the major version
            // recommended: true,
            recommended: false,
        },
        schema: [
            {
                type: "object",
                properties: {
                    staticProperties: {
                        type: "array",
                        items: { enum: STATIC_PROPERTIES },
                        uniqueItems: true,
                    },
                    prototypeMethods: {
                        type: "array",
                        items: { enum: PROTOTYPE_METHODS },
                        uniqueItems: true,
                    },
                },
                additionalProperties: false,
            },
        ],
        messages: {
            forbiddenStaticProperty: "'{{name}}' static property is forbidden.",
            forbiddenPrototypeMethods:
                "RegExp.prototype.{{name}} method is forbidden.",
        },
        type: "suggestion", // "problem",
    },
    create(context) {
        const staticProperties: StaticProperty[] =
            context.options[0]?.staticProperties ?? STATIC_PROPERTIES
        const prototypeMethods: PrototypeMethod[] =
            context.options[0]?.prototypeMethods ?? PROTOTYPE_METHODS
        const typeTracer = createTypeTracker(context)

        return {
            ...(staticProperties.length
                ? {
                      Program() {
                          const scope = context.getScope()
                          const tracker = new ReferenceTracker(scope)

                          const regexpTraceMap: TYPES.TraceMap = {}
                          for (const sp of staticProperties) {
                              regexpTraceMap[sp] = { [READ]: true }
                          }
                          for (const {
                              node,
                              path,
                          } of tracker.iterateGlobalReferences({
                              RegExp: regexpTraceMap,
                          })) {
                              context.report({
                                  node,
                                  messageId: "forbiddenStaticProperty",
                                  data: { name: path.join(".") },
                              })
                          }
                      },
                  }
                : {}),
            ...(prototypeMethods.length
                ? {
                      MemberExpression(node: MemberExpression) {
                          if (
                              node.computed ||
                              node.property.type !== "Identifier" ||
                              !(prototypeMethods as string[]).includes(
                                  node.property.name,
                              ) ||
                              node.object.type === "Super"
                          ) {
                              return
                          }
                          if (typeTracer.isRegExp(node.object)) {
                              context.report({
                                  node,
                                  messageId: "forbiddenPrototypeMethods",
                                  data: { name: node.property.name },
                              })
                          }
                      },
                  }
                : {}),
        }
    },
})
