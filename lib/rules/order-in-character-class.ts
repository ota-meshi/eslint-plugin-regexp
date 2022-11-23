import { createRule } from "../utils"

import sortCharacterClassElements from "./sort-character-class-elements"

export default createRule("order-in-character-class", {
    meta: {
        ...sortCharacterClassElements.meta,
        docs: {
            ...sortCharacterClassElements.meta.docs,
            recommended: false,
        },
        deprecated: true,
        replacedBy: ["sort-character-class-elements"],
    },
    create(context) {
        return sortCharacterClassElements.create(context)
    },
})
