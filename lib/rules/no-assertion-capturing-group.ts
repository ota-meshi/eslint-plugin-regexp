import { createRule } from "../utils"

import noEmptyCapturingGroup from "./no-empty-capturing-group"

export default createRule("no-assertion-capturing-group", {
    meta: {
        ...noEmptyCapturingGroup.meta,
        docs: {
            ...noEmptyCapturingGroup.meta.docs,
            recommended: false,
        },
        deprecated: true,
        replacedBy: ["no-empty-capturing-group"],
    },
    create(context) {
        return noEmptyCapturingGroup.create(context)
    },
})
