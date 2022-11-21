export {
    getParent,
    findVariable,
    getStringIfConstant,
    getStaticValue,
    getScope,
    isKnownMethodCall,
    parseReplacements,
} from "./utils"
export type { KnownMethodCall, ReferenceElement } from "./utils"
export { extractExpressionReferences } from "./extract-expression-references"
export type { ExpressionReference } from "./extract-expression-references"
export { extractPropertyReferences } from "./extract-property-references"
export type { PropertyReference } from "./extract-property-references"
