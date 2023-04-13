/// <reference types="vite/client" />

interface ImportMetaEnv {
    readonly VITE_APP_NAME: string;
    readonly VITE_APP_TITLE:string;
    readonly VITE_APP_DESCRIPTION:string;
    readonly VITE_APP_VERSION:string;
    readonly VITE_APP_AUTHOR:string;
    readonly VITE_APP_ORIGIN:string;
    readonly VITE_APP_ICON:string;
}

interface ImportMeta {
    readonly env: ImportMetaEnv;
}