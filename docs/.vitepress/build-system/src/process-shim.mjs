export let process = {
    env: {},
    cwd: () => "",
    stdout: {},
}
if (typeof window !== "undefined") {
    window.process = process
}
