const DATABASE_NAME = 'routing-registry';
const TABLE_MODULE_NAME = 'module';

/**
 * Ini adalah interface generic yang memiliki attribute string intent.
 */
interface Intent {
    intent: string
}

/**
 * Interface yang memiliki nilai property dan valuenya tipe string.
 */
interface StringKeyValue {
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
type NavigateToType = 'default' | 'modal' | 'service'

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
interface RoutingRegistry {
    [key: string]: RoutingRegistryValue
}

/**
 * Iframe who initiate the call
 */
interface CallerIdOrigin {
    [key: string]: HTMLIFrameElement
}

/**
 * Context object yang di inject kepada frame client
 */
interface Context {
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

/**
 * Tipe dari message yang bisa berupa NavigateToMessage atau NavigateBackMessage
 */
type MessageData = NavigateToMessage | NavigateBackMessage

/**
 * CustomElement dari MicroEndModule
 */
class MicroEndModuleLoader extends HTMLElement {

    /**
     * Constructor ini bertujuan membuat shadowRoot, kemudian menginject input element kedalam shadowRoot.
     */
    constructor() {
        super();
        this.attachShadow({mode: 'open'});
        if (this.shadowRoot === null) {
            console.warn('[MicroEndModuleLoader]', 'shadowRoot is null, exiting function');
            return;
        }
        this.shadowRoot.innerHTML = `<input type="file" >`;
        const input = this.shadowRoot.querySelector('input');
        if (input === null) {
            console.warn('[MicroEndModuleLoader]', 'Could not find input type file, exiting function');
            return;
        }
        input.addEventListener('change', this.onChange);
    }

    /**
     * Callback ketika input file menerima file baru. Fungsi ini akan membaca isi file, kemudian memparsing isi file tersebut.
     * Informasi yang diparsing keluar adalah :
     * <li> path dan versi dari file, ini didapatkan dari konvensi nama file xxxx@yyy. (path xxxx version yyy).
     * <li> dependency: ini didapatkan dari tag meta didalam content file <code><meta name="dependency" content="fault@0.0.1,mission@0.0.01"></code>
     *      content dari dependency dipisahkan dengan koma.
     * <li> params: ini didapatkan dari tag meta dengan nama "params" yang ada di dalam content file <code><meta name="params" content="commandId,missionId"></code>
     * Informasi dari file tersebut kemudian disimpan kedalam database IndexDB dengan nama table "module"
     * @param event : Event object yang diberikan oleh input element.
     */
    onChange = (event: Event) => {
        if (event === null || event.target == null) {
            console.warn('[MicroEndModuleLoader]', 'Event on onChange parameter is null, exiting function');
            return;
        }
        const input = event.target as HTMLInputElement;
        if (input.files === null) {
            console.warn('[MicroEndModuleLoader]', 'Files from HTMLInputElement is null, exiting function');
            return;
        }
        const file = input.files[0];
        const reader = new FileReader();
        const moduleName = file.name.split('.html')[0];
        const [path, version] = moduleName.split('@');

        reader.addEventListener('load', (event: ProgressEvent<FileReader>) => {
            if (event.target === null) {
                console.warn('[MicroEndModuleLoader]', 'unable to find target of reader to read file, exiting function');
                return;
            }
            const content = event.target.result as string;
            const dependency = this.getMetaInformation('dependency', content);
            const params = this.getMetaInformation('params', content);
            const req = indexedDB.open(DATABASE_NAME, 1)
            req.addEventListener('upgradeneeded', () => {
                const db = req.result;
                db.createObjectStore(TABLE_MODULE_NAME, {keyPath: 'name'});
            });
            req.addEventListener('success', () => {
                const db = req.result;
                const tx = db.transaction([TABLE_MODULE_NAME], 'readwrite');
                const moduleTable = tx.objectStore(TABLE_MODULE_NAME);
                moduleTable.put({
                    name: moduleName,
                    path: path,
                    version: version,
                    dependency: dependency.split(',').map(s => s.trim()),
                    params: params.split(',').map(s => s.trim()),
                    srcdoc: content
                });
                db.close();
            });
        });
        reader.readAsText(file, 'utf-8');
    };

    /**
     * Utilities yang digunakan untuk meng-ekstrak informasi dari htmlText
     * @param metaName nama dari meta yang akan di extract dari htmlText
     * @param htmlText sumber dari htmlText yang mau di extract.
     */
    getMetaInformation = (metaName: string, htmlText: string) => {
        const indexOfContent = htmlText.indexOf(`name="${metaName}"`)
        const startTagIndex = htmlText.substring(0, indexOfContent).lastIndexOf('<');
        const endTagIndex = htmlText.substring(indexOfContent, htmlText.length).indexOf('>') + indexOfContent
        let dependency = '';
        if (startTagIndex >= 0 && endTagIndex > startTagIndex) {
            dependency = htmlText.substring(startTagIndex, endTagIndex).split('content="')[1].split('"')[0];
        }
        return dependency;
    }
}

/**
 * MicroEndRouter adalah CustomElement yang berfungsi untuk merender module ke element yang idnya di referensikan oleh attribute for.
 */
class MicroEndRouter extends HTMLElement {

    /**
     * Object yang berfungsi untuk menyimpan registry dari routing,
     * informasi yang disimpan antaralain srcdoc dan dependency dari module.
     */
    routingRegistry: RoutingRegistry;

    /**
     * Flag yang digunakan untuk mengindikasi frame yang sedang aktif saat ini
     */
    currentActiveFrame: HTMLIFrameElement | null;

    /**
     * Object yang berfungsi untuk menyimpan map antara Id dan Origin dari route si pemanggil.
     */

    callerIdOrigin: CallerIdOrigin;

    /**
     * Konstruktor dari MicroEndRouter. Apa yang dilakukan oleh konstruktur ini meliputi
     * <li> Membuat koneksi dengan IndexDB dan mengakses database "routing-registry"
     * <li> Membuat table "module" seandainya belum ada
     * <li> Membaca content dari table module, dan menyimpan data datanya kedalam routingRegistry.
     */
    constructor() {
        super();
        this.routingRegistry = {};
        this.callerIdOrigin = {};
        this.currentActiveFrame = null;

        const req = indexedDB.open(DATABASE_NAME, 1);
        req.addEventListener('upgradeneeded', () => {
            const db = req.result;
            db.createObjectStore(TABLE_MODULE_NAME, {keyPath: 'name'});
        });
        req.addEventListener('success', () => {
            const db = req.result;
            const tx = db.transaction([TABLE_MODULE_NAME], 'readonly');
            const moduleTable = tx.objectStore(TABLE_MODULE_NAME);
            const request = moduleTable.getAll();
            request.addEventListener('success', () => {
                const data = request.result;
                data.forEach(d => {
                    this.routingRegistry[`/${d.path}/${d.version}`] = {
                        srcdoc: d.srcdoc,
                        dependency: d.dependency
                    };
                });
                db.close();
                this.renderBasedOnHash();
            });
            request.addEventListener('error', (error) => {
                console.error('[MicroEndRouter]', 'Unable to read data ', error);
                db.close();
            })
        });
        this.attachShadow({mode: "open"});
        if (this.shadowRoot) {

            const style: any = {
                height: '100%',
                border: '1px solid #ccc',
                'box-sizing': 'border-box',
                overflow: 'auto',
                display: 'flex',
                'flex-direction': 'column',
                position: 'relative'
            }
            const styleString = Object.keys(style).map(key => `${key}:${style[key]}`).join(';')
            this.shadowRoot.innerHTML = '<div id="container" style="' + styleString + '"></div>';
        }

    }

    /**
     * Utilities untuk men-split string dengan pemisah tanda miring.
     * @param text
     */
    splitSegment = (text: string) => {
        return text.split('/').filter(s => s)
    };

    /**
     * Function yang dipanggil untuk me-render seandainya alamat dari hash berubah.
     * <li> Pertama path dan query akan di extract dari hash dengan menggunakan tanda pemisah "?"
     * <li> Dari path dan query di extract object "params" yang berisikan parameter string key value
     * <li> berdasarkan "path", kemudian kita cari route yang paling matching berdasarkan key yang terdaftar di routing registry
     * <li> mengambil container sesuai dengan nilai yang ada di attribute "for" yang akan digunakan untuk placeholder dari module.
     * <li> merender isi container dengan frame dan srcdoc yang didapat dari hasil extract routing registry.
     */
    render = (pathAndQuery: string, type: NavigateToType, caller: string) => {
        const [path, query] = pathAndQuery.split('?');
        const queryParams = this.extractParamsFromQuery(query);
        const pathSegments = this.splitSegment(path);

        const {route, srcdoc, dependency} = this.findMostMatchingRoute(pathSegments);
        if (srcdoc === '' || srcdoc === undefined) {
            return;
        }
        const pathParams = this.extractParamsFromPath(route, pathSegments);
        const params = ({...queryParams, ...pathParams});
        const dependencies = dependency.reduce((result: StringKeyValue, dep) => {
            const [path, version] = dep.split('@');
            result[path] = version;
            return result;
        }, {});
        if (this.shadowRoot === null) {
            console.error('[MicroEndRouter]', 'ShadowRoot is null we cant render this');
            return;
        }
        let previousFrame: HTMLIFrameElement | null = this.currentActiveFrame;
        let nextFrame: HTMLIFrameElement | null = this.getFrame({route, type, caller});
        if (nextFrame === null) {
            nextFrame = document.createElement('iframe');
            nextFrame.setAttribute('data-route', route);
            nextFrame.setAttribute('data-type', type);
            nextFrame.setAttribute('data-caller', caller);
            nextFrame.style.display = type === 'service' ? 'none' : 'flex';
            nextFrame.style.border = 'none';
            nextFrame.style.flexDirection = 'column';
            nextFrame.style.height = '100%';
            nextFrame.style.width = '100%';
            nextFrame.style.backgroundColor = '#FFF';
            //nextFrame.style.position = 'absolute';
            nextFrame.style.overflow = 'auto';
            nextFrame.style.zIndex = '0';
            const contextScript = createContext({
                params,
                isFocused: true,
                dependencies,
                route,
                caller,
                type
            });
            let headIndex = srcdoc.indexOf('<head>');
            if (headIndex > 0) {
                headIndex = headIndex + '<head>'.length
            }
            nextFrame.srcdoc = headIndex > 0 ? srcdoc.substring(0, headIndex) + contextScript + srcdoc.substring(headIndex + 1, srcdoc.length) : contextScript + srcdoc;
            // THIS IS NOT REQUIRED BECAUSE THIS WILL CONFUSE THE ORIGINAL BEHAVIOUR
            // nextFrame.addEventListener('load',(evt) => {
            //     const nextFrame:any = evt.target;
            //     if(nextFrame){
            //         nextFrame.style.zIndex = '0';
            //         nextFrame.contentWindow.postMessage({intent: 'paramschange', params: result.params}, '*');
            //         nextFrame.contentWindow.postMessage({intent: 'focuschange', value: true}, '*');
            //     }
            // });
            const container = this.getContainer();
            if (container) {
                container.append(nextFrame);
            }
        } else if (nextFrame.contentWindow !== null) {
            nextFrame.setAttribute('data-route', route);
            nextFrame.setAttribute('data-type', type);
            nextFrame.setAttribute('data-caller', caller);
            nextFrame.style.zIndex = '0';
            nextFrame.contentWindow.postMessage({intent: 'paramschange', params, route, type, caller}, '*');
            nextFrame.contentWindow.postMessage({intent: 'focuschange', value: true}, '*');
        }
        if (previousFrame && previousFrame.contentWindow) {
            // we cant do this, this is dangerous if we make it empty
            previousFrame.style.zIndex = '-1';
            previousFrame.contentWindow.postMessage({intent: 'focuschange', value: false}, '*');
        }
        this.currentActiveFrame = nextFrame;

    }
    getContainer = (): HTMLElement | null => {
        if (this.shadowRoot) {
            return this.shadowRoot.getElementById('container')
        }
        return null;
    }
    getFrame = (props: { route: string, type: NavigateToType, caller: string }): HTMLIFrameElement | null => {
        const container = this.getContainer()
        if (container) {
            if (props.type === 'default') {
                return container.querySelector(`[data-route="${props.route}"][data-type="${props.type}"]`);
            }
            return container.querySelector(`[data-route="${props.route}"][data-type="${props.type}"][data-caller="${props.caller}"]`)
        }
        return null;
    }

    /**
     * Utility untuk meng-extract params dari path, yang memiliki tanda dollar $.
     * @param route
     * @param pathSegments
     */
    extractParamsFromPath = (route: string, pathSegments: string[]) => {
        const params: StringKeyValue = {};
        this.splitSegment(route).forEach((segment, index) => {
            if (segment.startsWith('$')) {
                params[segment.substring(1)] = pathSegments[index];
            }
        });
        return params;
    }

    /**
     * Utility untuk mencari route yang paling matching dengan pathSegments.
     * @param pathSegments
     */
    findMostMatchingRoute = (pathSegments: string[]) => {
        const mostMatchingPath = Object.keys(this.routingRegistry).filter(key => this.splitSegment(key).length === pathSegments.length).reduce((mostMatchingPath, key) => {
            const routeSegments = this.splitSegment(key);
            let matchingSegment = 0;
            for (let i = 0; i < routeSegments.length; i++) {
                if (routeSegments[i] === pathSegments[i]) {
                    matchingSegment++;
                }
            }
            if (matchingSegment > mostMatchingPath.total) {
                return {path: key, total: matchingSegment};
            }
            return mostMatchingPath;
        }, {path: '', total: 0});
        const routingRegistry = this.routingRegistry[mostMatchingPath.path] || {srcdoc: '', dependency: []};
        return {route: mostMatchingPath.path, srcdoc: routingRegistry.srcdoc, dependency: routingRegistry.dependency};
    }

    /**
     * Utility untuk meng-extract params dari query.
     * @param query
     */
    extractParamsFromQuery = (query: string) => {
        const params: StringKeyValue = {};
        (query || '').split('&').filter(s => s).forEach(qry => {
            const [key, value] = qry.split('=');
            params[key] = value;
        });
        return params;
    }
    /**
     * Render when the hash is change
     */
    renderBasedOnHash = () => this.render(window.location.hash.substring(1), "default", "hashchange");

    onMessage = (event: MessageEvent<MessageData>) => {
        if (event.data.intent === 'navigateTo') {
            // WHAT IS THE IFRAME OF THIS !!!
            const params = event.data.params;

            const originRoute = event.data.originRoute;
            const originCaller = event.data.originCaller;
            const originType = event.data.originType;
            const originalFrame = this.getFrame({route: originRoute, caller: originCaller, type: originType});
            if (originalFrame === null) {
                console.warn('FUCK WE COULDNT GET THE FRAME !!! this is wrong !!');
                return null;
            }
            const type = event.data.type;
            const callerId = event.data.caller;
            const queryString = Object.keys(params).reduce((result: string[], key) => {
                result.push(`${key}=${params[key]}`);
                return result;
            }, []).join('&');
            const path = '/' + event.data.route.split('/').filter(s => s).join('/');
            this.callerIdOrigin[callerId] = originalFrame;
            const pathAndQuery = path + (path.indexOf('?') >= 0 ? '&' : '?') + queryString;
            if (type === 'default' || type === 'modal' || type === 'service') {
                this.render(pathAndQuery, type, callerId);
            }
        }
        if (event.data.intent === 'navigateBack') {
            const {caller, type, route, intent, value} = event.data;
            const previousFrame = this.getFrame({route, type, caller});
            const nextFrame = this.callerIdOrigin[caller];
            if (nextFrame && nextFrame.contentWindow) {
                delete this.callerIdOrigin[caller];
                nextFrame.contentWindow.postMessage(event.data)
            }
            if (nextFrame.contentWindow !== null) {
                nextFrame.style.zIndex = '0';
                nextFrame.contentWindow.postMessage({intent: 'focuschange', value: true}, '*');
            }
            if (previousFrame && previousFrame.contentWindow) {
                previousFrame.style.zIndex = '-1';
                previousFrame.contentWindow.postMessage({intent: 'focuschange', value: false}, '*');
                if (type === "modal" || type === "service") {
                    previousFrame.remove();
                }
            }

            this.currentActiveFrame = nextFrame;
        }
    }

    /**
     * Callack ketikan Component di mount oleh browser.
     */
    connectedCallback(): void {
        console.log('[MicroEndRouter]', 'connected');
        window.addEventListener('load', this.renderBasedOnHash);
        window.addEventListener('hashchange', this.renderBasedOnHash);
        window.addEventListener('message', this.onMessage);
    }

    disconnectedCallback(): void {
        console.log('[MicroEndRouter]', 'disconnected');
        window.removeEventListener('load', this.renderBasedOnHash);
        window.removeEventListener('hashchange', this.renderBasedOnHash);
        window.removeEventListener('message', this.onMessage);
    }
}

function validateNonEmpty(params: StringKeyValue) {
    const errors: string[] = [];
    Object.keys(params).forEach(key => {
        const val = params[key];
        if (val === undefined || val === null || val === '') {
            errors.push(`attribute "${key}" is required`);
        }
    })
    return errors;
}

customElements.define('microend-moduleloader', MicroEndModuleLoader);
customElements.define('microend-router', MicroEndRouter);

function createContext(context: Context): string {
    const template = clientTemplate;
    const newTemplate = template.replace('"@context@"', JSON.stringify(context));
    return newTemplate;
}

const clientTemplate = `
<script>
const context = "@context@";
const paramsChangeListener = [];
const onFocusListeners = [];
let onBlurListeners = [];

window.context = context;

const log = (...args) => {
    console.log('[' + context.route + ']', ...args);
}

/**
 * @param event:MessageEvent
 */
const messageListener = (event) => {
    if (event.data.intent === 'paramschange') {
        const old = context.params;
        const newValue = event.data.params;
        
        context.route = event.data.route;
        context.type = event.data.type;
        context.caller = event.data.caller;
        
        if (JSON.stringify(old) !== JSON.stringify(newValue)) {
            context.params = event.data.params;
            paramsChangeListener.forEach(callback => {
                callback(newValue, old);
            })
        }
    }
    if (event.data.intent === 'focuschange') {
        const value = event.data.value;
        context.isFocused = value;
        if (value) {
            onBlurListeners = onFocusListeners.map(callback => callback());
        } else {
            onBlurListeners.forEach(callback => {
                if (typeof callback === 'function') {
                    callback();
                }
            });
            onBlurListeners = [];
        }
    }
};

window.addEventListener('message', messageListener);

/**
 *
 * @param callback : function(): function():void | void
 * @returns {(function(): void)|*}
 */
context.onParamsChange = (callback) => {
    paramsChangeListener.push(callback);
    return () => {
        const index = paramsChangeListener.indexOf(callback);
        paramsChangeListener.splice(index, 1);
    }
}

/**
 * @param callback : function(): function():void
 * @returns {(function(): void)|*}
 */
context.onFocusChange = (callback) => {
    onFocusListeners.push(callback);
    return () => {
        const index = onFocusListeners.indexOf(callback);
        onFocusListeners.splice(index, 1);
    }
}

/**
 * navigateTo ada beberapa behaviour
 * <li> navigateTo default
 *     - buka function baru lewat browser hash
 *     - ini mengakibatkan window history ke update
 *     - ini bakalan reuse existing frame yang sudah kebuka
 *     - ketika frame selesai dipanggil dia ga bakalan di destroy
 *
 * <li> navigateTo modal
 *     * buka function baru tanpa lewat browser hash
 *     - tidak menyebabkan window history ke update
 *     - bakalan buka frame yang baru
 *     - ketika frame selesai di panggil dia bakalan di destroy
 *
 * <li> navigateTo service
 *    - buka function baru tanpa lewat browser hash
 *    - tidak menampilkan frame baru
 *    - ketika selesai frame akan di destroy
 *
 * @param route : string
 * @param params : any
 * @param type : "default"|"modal"|"service"
 * @returns {Promise<any>}
 */
context.navigateTo = (route, params, type = 'default') => {

    return new Promise((resolve) => {
        params = params || {};
        const caller = (Math.random() * 1000000000 + new Date().getTime()).toFixed(0);
        if (window.top === null) {
            return;
        }
        const dependencyVersion = context.dependencies[route];
        route = '/' + route + '/' + dependencyVersion;
        const navigateTo = {
            intent: 'navigateTo',
            params,
            originRoute: context.route,
            originCaller: context.caller,
            originType : context.type,
            route,
            caller,
            type
        }
        window.top.postMessage(navigateTo);
        const listener = (event) => {
            if (event.data.intent === 'navigateBack' && event.data.caller === caller) {
                const value = event.data.value;
                window.removeEventListener('message', listener);
                resolve(value);
            }
        }
        window.addEventListener('message', listener);
    })
}

/**
 *
 * @param value : any
 */
context.navigateBack = (value) => {
    if (window.top === null) {
        return;
    }
    const navigateBack = {
        intent: 'navigateBack',
        value,
        caller: context.caller,
        type: context.type,
        route: context.route
    }
    window.top.postMessage(navigateBack);
}
</script>
`