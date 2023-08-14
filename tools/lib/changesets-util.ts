import getReleasePlan from "@changesets/get-release-plan"
import path from "path"

/** Get new version string from changesets */
export async function getNewVersion(): Promise<string> {
    const releasePlan = await getReleasePlan(path.resolve(__dirname, "../.."))

    return releasePlan.releases.find(
        ({ name }) => name === "eslint-plugin-regexp",
    )!.newVersion
}
