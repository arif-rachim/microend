import { defineConfig } from 'vite'
import {viteMicroEnd} from "@microend/vite-plugin-microend";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [viteMicroEnd({
    author:'arif.rachim@gmail.com',
    dependencies : {
      'identity' : '0.0.1'
    },
    version : '1.0.0',
    title : 'Fault',
    name : 'fault',
    description:'Fault Management',
    iconFile : './public/icon.svg'
  })],
})
