import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import {viteMicroEnd} from "@microend/vite-plugin-microend";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(),viteMicroEnd({
    author:'arif.rachim@gmail.com',
    dependencies : {},
    version : '1.0.0',
    title : 'IAM',
    name : 'iam',
    description:'Identity Access Management allows user to add roles and user into the application',
    iconFile : './src/identity-access-management.svg',
    visibleInHomeScreen : true
  })],
})
