// @ts-expect-error -- Browser
if (typeof window !== "undefined") {
    if (typeof require === "undefined") {
        // @ts-expect-error -- Browser
        ;(window as any).require = () => {
            const e = new Error("require is not defined")
            ;(e as any).code = "MODULE_NOT_FOUND"
            throw e
        }
    }
}
import type { Theme } from "vitepress"
import DefaultTheme from "vitepress/theme"
import Layout from "./Layout.vue"

const theme: Theme = {
    ...DefaultTheme,
    Layout,
    async enhanceApp(ctx) {
        DefaultTheme.enhanceApp(ctx)

        const ESLintCodeBlock =
            await import("./components/eslint-code-block.vue").then(
                (m) => m.default ?? m,
            )
        const PlaygroundBlock =
            await import("./components/playground-block.vue").then(
                (m) => m.default ?? m,
            )
        ctx.app.component("eslint-code-block", ESLintCodeBlock)
        ctx.app.component("playground-block", PlaygroundBlock)
    },
}
export default theme
