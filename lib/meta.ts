// note - cannot migrate this to an import statement because it will make TSC copy the package.json to the dist folder

import { default as pkg } from "../package.json" with { type: "json" }

export const name = pkg.name
export const version = pkg.version