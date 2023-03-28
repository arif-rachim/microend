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
     * Handler asal si pemanggil navigasi
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
     * Handler dari navigasi yang ingin dituju
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
     * Handler dari navigasi yang ingin dituju
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
     * dependency yang digunakan oleh module
     */
    dependencies: string[],
    /**
     * ID dari module source yang memiliki content dari module
     */
    moduleSourceId: string
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
    createService: <T extends { [key: string]: (params: any) => Promise<any> }>(handler: T) => T
    connectService: <T extends { [key: string]: (params: any) => Promise<any> }>(module: string) => T,
    createNavigation: <Handler extends { [k: string]: (param: any) => () => any }>(handler: Handler) => Navigator<Handler, keyof Handler>
    connectNavigation: <T>(module: string) => NavigatorConnector<Omit<T, 'current'>>
}

type ExtractParams<T> = T extends { params: infer R } ? R : never;
type ExtractResults<T> = T extends { navigateBack: (params: infer R) => void } ? R : never;
type NavigatorConnector<T> = {
    [K in keyof T]: (params: ExtractParams<T[K]>, type: 'default' | 'modal') => Promise<ExtractResults<T[K]>>
}

type Parameter<T> = T extends (params: infer P) => any ? P : never;
type ReturnValue<T> = T extends (params: any) => () => infer P ? P : never;
type Navigator<Handler, HandlerKey extends keyof Handler> = {
    [Key in HandlerKey]: {
        params: Parameter<Handler[Key]>,
        navigateBack: (param: ReturnValue<Handler[Key]>) => void
    }
} & { current: HandlerKey };


/**
 * Tipe dari message yang bisa berupa NavigateToMessage atau NavigateBackMessage
 */
export type MessageData = NavigateToMessage | NavigateBackMessage;

export interface Module {
    title: string;
    name: string;
    description: string;
    path: string;
    version: string;
    dependencies: string[];
    missingDependencies: string[];
    installedOn: number,
    size: number,
    lastModified: number;
    active: boolean;
    deleted: boolean;
    author: string;
    moduleSourceId: string;
    iconDataURI: string;
    visibleInHomeScreen: boolean;
}

export interface ModuleSource {
    id: string;
    srcdoc: string
}

export interface AppContext {
    id?: string;
    // home module berisikan informasi mengenai module yang dipakai sebagai home address
    homeModule: string;
}




