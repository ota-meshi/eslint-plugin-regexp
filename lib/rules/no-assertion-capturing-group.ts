import { createRule } from "../utils"

import noEmptyCapturingGroup from "./no-empty-capturing-group"

export default createRule("no-assertion-capturing-group", {
    meta: {
        ...noEmptyCapturingGroup.meta,
        docs: {
            ...noEmptyCapturingGroup.meta.docs,
            // TODO Switch to recommended in the major version.
            // recommended: false,
            recommended: true,
            replacedBy: ["no-empty-capturing-group"],
        },
        // TODO Switch to deprecated in the major version.
        // deprecated: true,
    },
    create(context) {
        return noEmptyCapturingGroup.create(context)
    },
})
