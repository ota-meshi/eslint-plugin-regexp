import type { Node } from "regexpp/ast"
export type ShortCircuit = (aNode: Node, bNode: Node) => boolean | null
