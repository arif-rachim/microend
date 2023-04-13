import {defineConfig,loadEnv} from "vite"
import {viteMicroEnd} from "@microend/vite-plugin-microend"

export default ({mode}) => {
    process.env = {...process.env,...loadEnv(mode,process.cwd())}
    return defineConfig({
        plugins: [viteMicroEnd({
            name: process.env.VITE_APP_NAME,
            title: process.env.VITE_APP_TITLE,
            description: process.env.VITE_APP_DESCRIPTION,
            version: process.env.VITE_APP_VERSION,
            author: process.env.VITE_APP_AUTHOR,
            dependencies: {},
            iconFile: process.env.VITE_APP_ICON
        })],
        build: {
            target: 'es2015'
        }
    })
}
