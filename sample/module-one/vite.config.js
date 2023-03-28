import {defineConfig} from "vite"
import {viteMicroEnd} from "@microend/vite-plugin-microend"

export default defineConfig({
    plugins: [viteMicroEnd({
        iconFile: '',
        dependencies: {},
        author: 'a.arif.r@gmail.com',
        name: 'module-one',
        version: '0.0.1',
        description: 'Module One',
        title: 'Module One',
        visibleInHomeScreen: true
    })],
})