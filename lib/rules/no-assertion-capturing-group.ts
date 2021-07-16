import { createRule } from "../utils"

import noEmptyCapturingGroup from "./no-empty-capturing-group"

export default createRule("no-assertion-capturing-group", {
    meta: {
        ...noEmptyCapturingGroup.meta,
        docs: {
            ...noEmptyCapturingGroup.meta.docs,
            recommended: false,
            replacedBy: ["no-empty-capturing-group"],
        },
        deprecated: true,
    },
    create(context) {
        return noEmptyCapturingGroup.create(context)
    },
})
