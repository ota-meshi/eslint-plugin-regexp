// eslint-disable-next-line node/no-unsupported-features/es-syntax -- demo
export default () =>
    // {
    //     Vue, // the version of Vue being used in the VuePress app
    //     options, // the options for the root Vue instance
    //     router, // the router instance for the app
    //     siteData, // site metadata
    // }
    {
        if (typeof window !== "undefined") {
            if (typeof window.global === "undefined") {
                window.global = {}
            }
            if (typeof window.process === "undefined") {
                window.process = new Proxy(
                    {
                        env: {},
                        cwd: () => undefined,
                    },
                    {
                        get(target, name) {
                            // For debug
                            // console.log(name)
                            return target[name]
                        },
                    },
                )
            }
        }
    }
