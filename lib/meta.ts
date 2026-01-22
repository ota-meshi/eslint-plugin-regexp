import { default as pkg } from "../package.json" with { type: "json" }

export const name = pkg.name
export const version = pkg.version
