import type { CapturingGroup } from "@eslint-community/regexpp/ast"
import type { RegExpVisitor } from "@eslint-community/regexpp/visitor"
import { getCapturingGroupNumber } from "regexp-ast-analysis"
import type { ObjectOption } from "../types"
import type { RegExpContext } from "../utils"
import { createRule, defineRegexpVisitor } from "../utils"

/**
 * Returns an identifier for the given capturing group.
 *
 * This is either the name of the group or its number.
 */
function getCapturingGroupIdentifier(group: CapturingGroup): string {
    if (group.name) {
        return `'${group.name}'`
    }
    return `number ${getCapturingGroupNumber(group)}`
}

export default createRule("no-unused-capturing-group", {
    meta: {
        docs: {
            description: "disallow unused capturing group",
            category: "Best Practices",
            recommended: true,
        },
        fixable: "code",
        schema: [
            {
                type: "object",
                properties: {
                    fixable: { type: "boolean" },
                    allowNamed: { type: "boolean" },
                },
                additionalProperties: false,
            },
        ],
        messages: {
            unusedCapturingGroup:
                "Capturing group {{identifier}} is defined but never used.",

            // suggestions
            makeNonCapturing: "Making this a non-capturing group.",
        },
        type: "suggestion", // "problem",
        hasSuggestions: true,
    },
    create(context) {
        const fixable: boolean =
            (context.options[0] as ObjectOption)?.fixable ?? false
        const allowNamed: boolean =
            (context.options[0] as ObjectOption)?.allowNamed ?? false

        function reportUnused(
            unused: Set<CapturingGroup>,
            regexpContext: RegExpContext,
        ) {
            const {
                node,
                getRegexpLocation,
                fixReplaceNode,
                getAllCapturingGroups,
            } = regexpContext

            if (allowNamed) {
                for (const cgNode of unused) {
                    if (cgNode.name) {
                        unused.delete(cgNode)
                    }
                }
            }

            const fixableGroups = new Set<CapturingGroup>()
            for (const group of [...getAllCapturingGroups()].reverse()) {
                if (unused.has(group)) {
                    fixableGroups.add(group)
                } else {
                    break
                }
            }

            for (const cgNode of unused) {
                const fix = fixableGroups.has(cgNode)
                    ? fixReplaceNode(
                          cgNode,
                          cgNode.raw.replace(/^\((?:\?<[^<>]+>)?/u, "(?:"),
                      )
                    : null

                context.report({
                    node,
                    loc: getRegexpLocation(cgNode),
                    messageId: "unusedCapturingGroup",
                    data: { identifier: getCapturingGroupIdentifier(cgNode) },
                    fix: fixable ? fix : null,
                    suggest: fix
                        ? [{ messageId: "makeNonCapturing", fix }]
                        : null,
                })
            }
        }

        function getCapturingGroupReferences(regexpContext: RegExpContext) {
            const capturingGroupReferences =
                regexpContext.getCapturingGroupReferences()
            if (!capturingGroupReferences.length) {
                // unused regexp
                return null
            }
            const indexRefs: number[] = []
            const namedRefs: string[] = []
            let hasUnknownName = false
            let hasSplit = false
            for (const ref of capturingGroupReferences) {
                if (ref.type === "UnknownUsage" || ref.type === "UnknownRef") {
                    return null
                }
                if (
                    ref.type === "ArrayRef" ||
                    ref.type === "ReplacementRef" ||
                    ref.type === "ReplacerFunctionRef"
                ) {
                    if (ref.kind === "index") {
                        if (ref.ref != null) {
                            indexRefs.push(ref.ref)
                        } else {
                            return null
                        }
                    } else {
                        // named
                        if (ref.ref) {
                            namedRefs.push(ref.ref)
                        } else {
                            hasUnknownName = true
                        }
                    }
                } else if (ref.type === "Split") {
                    hasSplit = true
                }
            }

            return {
                unusedIndexRef(index: number): boolean {
                    if (hasSplit) {
                        return false
                    }
                    return !indexRefs.includes(index)
                },
                unusedNamedRef(name: string): boolean {
                    if (hasUnknownName) {
                        return false
                    }
                    return !namedRefs.includes(name)
                },
            }
        }

        function createVisitor(
            regexpContext: RegExpContext,
        ): RegExpVisitor.Handlers {
            const references = getCapturingGroupReferences(regexpContext)
            if (!references) {
                // unused regexp or unknown reference
                return {}
            }
            const unused = new Set<CapturingGroup>()
            const allCapturingGroups = regexpContext.getAllCapturingGroups()
            for (let index = 0; index < allCapturingGroups.length; index++) {
                const cgNode = allCapturingGroups[index]
                if (
                    cgNode.references.length ||
                    !references.unusedIndexRef(index + 1)
                ) {
                    continue
                }
                if (cgNode.name && !references.unusedNamedRef(cgNode.name)) {
                    continue
                }
                unused.add(cgNode)
            }

            reportUnused(unused, regexpContext)

            return {}
        }

        return defineRegexpVisitor(context, {
            createVisitor,
        })
    },
})
