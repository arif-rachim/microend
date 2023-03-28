import {defineConfig} from 'vite'
import react from '@vitejs/plugin-react'
import {viteMicroEnd} from "@microend/vite-plugin-microend"
// https://vitejs.dev/config/
export default defineConfig({
    plugins: [react(), viteMicroEnd({
        author: 'a.arif.r@gmail.com',
        iconFile: './src/icon.svg',
        version: '1.0.0',
        title: 'Launcher',
        name: 'launcher',
        dependencies: {'*': '*'},
        description: 'Application Launcher',
        visibleInHomeScreen:false
    })],
})
