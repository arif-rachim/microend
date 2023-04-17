/// <reference types="vite/client" />

interface ImportMetaEnv {
    readonly VITE_APP_NAME: string;
    readonly VITE_APP_TITLE:string;
    readonly VITE_APP_DESCRIPTION:string;
    readonly VITE_APP_VERSION:string;
    readonly VITE_APP_AUTHOR:string;
    readonly VITE_APP_ORIGIN:string;
    readonly VITE_APP_ICON:string;
    readonly VITE_APP_FAVICON:string;
    readonly VITE_APP_FAVICON_16:string;
    readonly VITE_APP_FAVICON_32:string
    readonly VITE_APP_MASK_ICON:string
    readonly VITE_APP_SOCIAL_LOGO:string
    readonly VITE_APP_ICON_180:string;
    readonly VITE_APP_ICON_192:string;
    readonly VITE_APP_ICON_512:string;
}

interface ImportMeta {
    readonly env: ImportMetaEnv;
}