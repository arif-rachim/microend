import {defineConfig} from "vite"
import {viteMicroEnd} from "@microend/vite-plugin-microend"

export default defineConfig({
    plugins: [viteMicroEnd({
        name: 'microend',
        title: 'MicroEnd',
        description: 'Microend Base Application enables the installation of independent, modular applications that can communicate with one another and were created using any javascript framework.',
        version: '0.0.1',
        author: 'a.arif.r@gmail.com',
        dependencies: {},
        iconFile: './public/microend-logo.svg'
    })],
})