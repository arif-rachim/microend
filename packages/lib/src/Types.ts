/**
 * Ini adalah interface generic yang memiliki attribute string intent.
 */
interface Intent {
    intent: string
}

/**
 * Interface yang memiliki nilai property dan valuenya tipe string.
 */
export interface StringKeyValue {
    [key: string]: string
}

/**
 * Sebuah intent yang digunakan sebagai tipe data ketika client frame ingin navigasi ke module atau memanggil module lain.
 */
interface NavigateToMessage extends Intent {
    intent: 'navigateTo';
    /**
     * Parameter yang di berikan oleh frame yang digunakan untuk memanggil module yang lain.
     */
    params: StringKeyValue;
    /**
     * Route asal si pemanggil navigasi
     */
    originRoute: string;
    /**
     * Type asal si pemanggil navigasi
     */
    originType: NavigateToType;
    /**
     * Id asal si pemanggil navigasi
     */
    originCaller: string;
    /**
     * Id dari request, digunakan untuk identifikasi nilai kembalian dari hasil pemanggilan module yang lain
     */
    caller: string;
    /**
     * Route dari navigasi yang ingin dituju
     */
    route: string;
    /**
     * Tipe dari navigate to
     */
    type: NavigateToType;
}

/**
 * Navigate to type
 */
export type NavigateToType = 'default' | 'modal' | 'service'

/**
 * Sebuah intent yang digunakan sebagai tipe data ketika client frame ingin navigasi balik ke si pemanggilnya.
 */
interface NavigateBackMessage extends Intent {
    /**
     * Nama dari intent
     */
    intent: 'navigateBack',
    /**
     * Id dari si pemanggil
     */
    caller: string,
    /**
     * Route dari navigasi yang ingin dituju
     */
    route: string;
    /**
     * Tipe dari navigate to
     */
    type: NavigateToType;
    /**
     * Nilai dari yang akan dikembalikan kepada si pemanggil fungsi
     */
    value: any
}

/**
 * Type dari RoutingRegistry berisi srcdoc dan dependency
 */
interface RoutingRegistryValue {
    /**
     * srcdoc html code yang akan ditampilkan di layar
     */
    srcdoc: string,
    /**
     * dependency yang digunakan oleh module
     */
    dependency: string[]
}

/**
 * Interface dari Routing registry
 */
export interface RoutingRegistry {
    [key: string]: RoutingRegistryValue
}

/**
 * Iframe who initiate the call
 */
export interface CallerIdOrigin {
    [key: string]: HTMLIFrameElement
}

/**
 * Context object yang di inject kepada frame client
 */
export interface Context {
    /**
     * Parameter yang berisi informasi dari user
     */
    params: StringKeyValue,
    /**
     * informasi berisikan apakah frame sedang dalam kondisi fokus
     */
    isFocused: boolean,
    /**
     * Dependency dari module
     */
    dependencies: StringKeyValue,
    /**
     * route dari frame, informasi route berasal dari routing registry key
     */
    route: string,
    /**
     * Id dari caller yang meng-initiate request
     */
    caller: string,
    /**
     * Tipe dari navigation yang meng-initiate request
     */
    type: NavigateToType
}

export interface MicroEnd extends Context {
    onMount: (callback: () => (() => void) | void) => (() => void);
    onParamsChange: (callback: (newValue: any, oldValue: any) => void) => (() => void);
    onFocusChange: (callback: () => (() => void) | void) => (() => void);
    navigateTo: (route: string, params: any, type: NavigateToType) => Promise<any>;
    navigateBack: (value: any) => void;
    createService: <T>(handler: T) => T
    connectService: <T>(module: string) => T
}


/**
 * Tipe dari message yang bisa berupa NavigateToMessage atau NavigateBackMessage
 */
export type MessageData = NavigateToMessage | NavigateBackMessage;

export interface Module {
    name: string;
    description:string;
    path: string;
    version: string;
    dependency: string[];
    srcdoc: string,
    installedOn : number,
    size : number,
    lastModified : number;
    active:boolean;
}



