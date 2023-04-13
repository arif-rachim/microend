import {defineConfig, loadEnv} from "vite"
import {viteMicroEnd} from "@microend/vite-plugin-microend"
import {VitePWA} from 'vite-plugin-pwa'

export default ({mode}) => {
    process.env = {...process.env, ...loadEnv(mode, process.cwd())}
    return defineConfig({
        plugins: [VitePWA({
            registerType: 'autoUpdate',
            workbox: {
                globPatterns: ['**/*.{js,css,html,ico,png,svg}'],
                sourcemap: true
            },
            manifest: {
                name: process.env.VITE_APP_TITLE,
                short_name: process.env.VITE_APP_TITLE,
                description: process.env.VITE_APP_DESCRIPTION,
                start_url: "https://microend.org",
                display: "fullscreen",
                background_color: "#f8f8f8",
                theme_color: "#f8f8f8",
                orientation: "portrait",
                icons: [
                    {
                        src: '/assets/pwa-192x192.png',
                        sizes: '192x192',
                        type: 'image/png'
                    },
                    {
                        src: '/assets/pwa-512x512.png',
                        sizes: '512x512',
                        type: 'image/png'
                    },
                    {
                        src: '/assets/pwa-512x512.png',
                        sizes: '512x512',
                        type: 'image/png',
                        purpose: 'any maskable'
                    }
                ]
            }
        }), viteMicroEnd({
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
