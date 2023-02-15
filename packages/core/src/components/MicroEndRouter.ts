import {CallerIdOrigin, Context, MessageData, NavigateToType, RoutingRegistry, StringKeyValue} from "./Types";

export const DATABASE_NAME = 'routing-registry';
export const TABLE_MODULE_NAME = 'module';


export class MicroEndRouter extends HTMLElement {


    routingRegistry: RoutingRegistry;

    currentActiveFrame: HTMLIFrameElement | null;


    callerIdOrigin: CallerIdOrigin;


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


    splitSegment = (text: string) => {
        return text.split('/').filter(s => s)
    };


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
            //nextFrame.srcdoc = headIndex > 0 ? srcdoc.substring(0, headIndex) + contextScript + srcdoc.substring(headIndex + 1, srcdoc.length) : contextScript + srcdoc;
            const sourceHtml = headIndex > 0 ? srcdoc.substring(0, headIndex) + contextScript + srcdoc.substring(headIndex + 1, srcdoc.length) : contextScript + srcdoc;
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
                if(nextFrame.contentWindow){
                    const doc = nextFrame.contentWindow.document;
                    doc.open();
                    doc.write(sourceHtml);
                    doc.close();
                }
            }
        } else if (nextFrame.contentWindow !== null) {
            nextFrame.setAttribute('data-route', route);
            nextFrame.setAttribute('data-type', type);
            nextFrame.setAttribute('data-caller', caller);
            nextFrame.style.zIndex = '0';
            nextFrame.contentWindow.postMessage({intent: 'paramschange', params, route, type, caller}, '*');
            nextFrame.contentWindow.postMessage({intent: 'focuschange', value: true}, '*');
        }
        if(type === 'service'){
            // return we just ignore this, on server we don't bother the previous frame zIndex
            return;
        }
        let previousFrame: HTMLIFrameElement | null = this.currentActiveFrame;
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


    extractParamsFromPath = (route: string, pathSegments: string[]) => {
        const params: StringKeyValue = {};
        this.splitSegment(route).forEach((segment, index) => {
            if (segment.startsWith('$')) {
                params[segment.substring(1)] = pathSegments[index];
            }
        });
        return params;
    }


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


    extractParamsFromQuery = (query: string) => {
        const params: StringKeyValue = {};
        (query || '').split('&').filter(s => s).forEach(qry => {
            const [key, value] = qry.split('=');
            params[key] = value;
        });
        return params;
    }


    renderBasedOnHash = () => this.render(window.location.hash.substring(1), "default", "hashchange");

    onMessage = (event: MessageEvent<MessageData>) => {
        if (event.data.intent === 'navigateTo') {

            const params = event.data.params;

            const originRoute = event.data.originRoute;
            const originCaller = event.data.originCaller;
            const originType = event.data.originType;

            const originalFrame = this.getFrame({route: originRoute, caller: originCaller, type: originType});
            if (originalFrame === null) {
                console.warn('WE COULDNT GET THE FRAME !!! this is wrong !!');
                return;
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
            const {caller, type, route} = event.data;

            const nextFrame = this.callerIdOrigin[caller];
            if (nextFrame && nextFrame.contentWindow) {
                delete this.callerIdOrigin[caller];
                nextFrame.contentWindow.postMessage(event.data)
            }
            if(type === 'service'){
                const previousFrame = this.getFrame({route, type, caller});
                if(previousFrame && previousFrame.contentWindow){
                    previousFrame.contentWindow.postMessage({intent: 'focuschange', value: false}, '*');
                    previousFrame.remove();
                }
                return;
            }
            if (nextFrame.contentWindow !== null) {
                nextFrame.style.zIndex = '0';
                nextFrame.contentWindow.postMessage({intent: 'focuschange', value: true}, '*');
            }
            const previousFrame = this.getFrame({route, type, caller});
            if (previousFrame && previousFrame.contentWindow) {
                previousFrame.style.zIndex = '-1';
                previousFrame.contentWindow.postMessage({intent: 'focuschange', value: false}, '*');
                if (type === "modal") {
                    previousFrame.remove();
                }
            }

            this.currentActiveFrame = nextFrame;
        }
    }


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
const onMountListeners = [];
let onBlurListeners = [];
let onUnMountListeners = [];

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

window.addEventListener("load", () => {
    onUnMountListeners = onMountListeners.map(callback => callback());
},{once:true});

window.addEventListener('unload',() => {
    onUnMountListeners.forEach(callback => {
        if(typeof callback){
            callback();
        }
    })
},{once:true})

window.addEventListener('message', messageListener);

context.onMount = (callback) => {
    onMountListeners.push(callback);
    return () => {
        const index = onMountListeners.indexOf(callback);
        onMountListeners.splice(index, 1);
    }
}
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