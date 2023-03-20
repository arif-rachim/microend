import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import {viteMicroEnd} from "@microend/vite-plugin-microend";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(),viteMicroEnd({
    author:'arif.rachim@gmail.com',
    dependencies : {
      'shit' : '1.0.0',
      'kotak' : '1.0.0'
    },
    version : '1.0.0',
    title : 'Iam App',
    name : 'iam',
    description:'Iam application',
    iconFile : './public/vite.svg'
  })],
})
