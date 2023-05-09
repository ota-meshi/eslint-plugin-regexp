// note - cannot migrate this to an import statement because it will make TSC copy the package.json to the dist folder
// eslint-disable-next-line @typescript-eslint/no-require-imports, @typescript-eslint/no-var-requires -- Get meta data
export const { name, version } = require("../package.json")
