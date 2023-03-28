import {defineConfig} from "vite"
import {viteMicroEnd} from "@microend/vite-plugin-microend"

export default defineConfig({
    plugins: [viteMicroEnd({
        title: 'Module Two',
        name: 'module-two',
        description: 'Module Two description',
        version: '0.0.1',
        author: 'a.arif.r@gmail.com',
        dependencies: {},
        iconFile: './src/icon.svg',
        visibleInHomeScreen : true
    })]
})