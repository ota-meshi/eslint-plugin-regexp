export {
    getParent,
    findVariable,
    getStringIfConstant,
    getStaticValue,
    getScope,
    isKnownMethodCall,
    parseReplacements,
} from "./utils.ts"
export type { KnownMethodCall, ReferenceElement } from "./utils.ts"
export { extractExpressionReferences } from "./extract-expression-references.ts"
export type { ExpressionReference } from "./extract-expression-references.ts"
export { extractPropertyReferences } from "./extract-property-references.ts"
export * from "./regex.ts"
export type { PropertyReference } from "./extract-property-references.ts"
