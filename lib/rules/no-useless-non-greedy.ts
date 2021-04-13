import { createRule } from "../utils"

import nonUselessLazy from "./no-useless-lazy"

export default createRule("no-useless-non-greedy", {
    meta: {
        ...nonUselessLazy.meta,
        docs: {
            ...nonUselessLazy.meta.docs,
            recommended: false,
            replacedBy: ["no-useless-lazy"],
        },
        // TODO Switch to deprecated in the major version.
        // deprecated: true,
    },
    create(context) {
        return nonUselessLazy.create(context)
    },
})
