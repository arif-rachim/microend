import {defineConfig} from 'vite'
import react from '@vitejs/plugin-react'
import {viteMicroEnd} from "@microend/vite-plugin-microend"

export default defineConfig({
    plugins: [react(), viteMicroEnd({
        author: 'a.arif.r@gmail.com',
        iconFile: './src/application-launcher.svg',
        version: '1.0.0',
        title: 'Store',
        name: 'store',
        dependencies: {'*': '*'},
        description: 'App Store',
        visibleInHomeScreen:true
    })],
})
