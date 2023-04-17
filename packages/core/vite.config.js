import {defineConfig, loadEnv} from "vite"
import {viteMicroEndPWA, viteMicroEnd} from "@microend/vite-plugin-microend"

export default async ({mode}) => {
    process.env = {...process.env, ...loadEnv(mode, process.cwd())}

    return defineConfig({
        plugins: [ viteMicroEnd({
            name: process.env.VITE_APP_NAME,
            title: process.env.VITE_APP_TITLE,
            description: process.env.VITE_APP_DESCRIPTION,
            version: process.env.VITE_APP_VERSION,
            author: process.env.VITE_APP_AUTHOR,
            dependencies: {},
            iconFile: process.env.VITE_APP_ICON
        }), viteMicroEndPWA({
            title: process.env.VITE_APP_TITLE,
            description: process.env.VITE_APP_DESCRIPTION,
            icon192 : process.env.VITE_APP_ICON_192,
            icon512 : process.env.VITE_APP_ICON_512,
            origin : process.env.VITE_APP_ORIGIN,
            icon180: process.env.VITE_APP_ICON_180,
            favIcon32: process.env.VITE_APP_FAVICON_32,
            favIcon: process.env.VITE_APP_FAVICON,
            favIcon16: process.env.VITE_APP_FAVICON_16,
            maskIcon: process.env.VITE_APP_MASK_ICON,
            socialLogo: process.env.VITE_APP_SOCIAL_LOGO
        })],
        build: {
            target: 'es2015'
        }
    })
}
