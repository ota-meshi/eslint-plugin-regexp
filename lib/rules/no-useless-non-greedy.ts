import { createRule } from "../utils"

import nonUselessLazy from "./no-useless-lazy"

export default createRule("no-useless-non-greedy", {
    meta: {
        ...nonUselessLazy.meta,
        docs: {
            ...nonUselessLazy.meta.docs,
            recommended: false,
        },
        deprecated: true,
        replacedBy: ["no-useless-lazy"],
    },
    create(context) {
        return nonUselessLazy.create(context)
    },
})
