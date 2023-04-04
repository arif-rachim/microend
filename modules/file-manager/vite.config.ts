import {defineConfig} from 'vite'
import react from '@vitejs/plugin-react'
import {viteMicroEnd} from "@microend/vite-plugin-microend"

export default defineConfig({
    plugins: [react(), viteMicroEnd({
        author: 'a.arif.r@gmail.com',
        iconFile: './src/icon.svg',
        version: '1.0.0',
        title: 'File Manager',
        name: 'file-manager',
        dependencies: {},
        description: 'File Manager to store file and retrieve file and to interact with user',
        visibleInHomeScreen:true
    })],
    build: {
        target: 'es2015'
    },
    server : {
        port:5175
    }
})
