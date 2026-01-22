import path from "node:path"
import getReleasePlan from "@changesets/get-release-plan"

/** Get new version string from changesets */
export async function getNewVersion(): Promise<string> {
    const releasePlan = await getReleasePlan(
        path.resolve(import.meta.dirname, "../.."),
    )

    return releasePlan.releases.find(
        ({ name }) => name === "eslint-plugin-regexp",
    )!.newVersion
}
