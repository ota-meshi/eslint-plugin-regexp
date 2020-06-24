import path from "path"
import fs from "fs"
import { isDefined } from "../../lib/styles/utils"

type Config = {
    name: string
    configId: string
    config: any
    path: string
    extends: Config[]
}

/**
 * Get the all configs
 * @returns {Array} The all configs
 */
function readConfigs(): Config[] {
    const configsRoot = path.resolve(__dirname, "../../lib/configs")
    const result = fs.readdirSync(configsRoot)
    const configs = []
    for (const name of result) {
        const configName = name.replace(/\.ts$/u, "")
        const configId = `plugin:regexp/${configName}`
        const configPath = require.resolve(path.join(configsRoot, name))

        const config = require(configPath)
        configs.push({
            name: configName,
            configId,
            config,
            path: configPath,
            extends: [],
        })
    }
    return configs
}

export const configs = readConfigs()

for (const config of configs) {
    const extendsList: string[] = !config.config.extends
        ? []
        : Array.isArray(config.config.extends)
        ? config.config.extends
        : [config.config.extends]
    config.extends = extendsList
        .map(p => configs.find(c => c.path === p))
        .filter(isDefined)
}
