import {CallerIdOrigin, Context, MessageData, MicroEnd, NavigateToType, RoutingRegistry, StringKeyValue} from "./Types";
import {getAllModules} from "./moduleQuery";

export const DATABASE_NAME = 'routing-registry';
export const TABLE_MODULE_NAME = 'module';

// warning use document write is slow, but the code is cleaner when displayed in the screen.
const useDocumentWrite = true;

const CALLER_ID_KEY = 'callerId';

/**
 * Attribute
 * @param debug : boolean flag to display debug logging
 */
export class MicroEndRouter extends HTMLElement {

    routingRegistry: RoutingRegistry;

    currentActiveFrame: HTMLIFrameElement | null;

    callerIdOrigin: CallerIdOrigin;

    debugMode: boolean;

    suppressRenderBasedOnHash: boolean;

    constructor() {
        super();
        this.routingRegistry = {};
        this.callerIdOrigin = {};
        this.currentActiveFrame = null;
        //height:100%;overflow: auto;display: flex;flex-direction: column;margin:10px
        this.style.height = '100%';
        this.style.display = 'flex';
        this.style.flexDirection = 'column';
        this.style.boxSizing = 'border-box';
        this.suppressRenderBasedOnHash = false;
        this.debugMode = this.getAttribute('debug') === 'true';
        this.attachShadow({mode: "open"});
        if (this.shadowRoot) {
            const style: any = {
                height: '100%',
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

    log = (...messages: string[]) => {
        if (this.debugMode) {
            console.log('[MicroEndRouter]', ...messages);
        }
    }
    splitSegment = (text: string) => {
        return text.split('/').filter(s => s)
    };

    render = (pathAndQuery: string, type: NavigateToType, caller: string) => {

        const [path, query] = pathAndQuery.split('?');
        const queryParams = this.extractParamsFromQuery(query);
        // WE ARE REMOVING THE CALLER FROM HERE !
        if (CALLER_ID_KEY in queryParams) {
            caller = queryParams[CALLER_ID_KEY];
            delete queryParams[CALLER_ID_KEY];
        }
        const pathSegments = this.splitSegment(path);
        const {route, srcdoc, dependencies: dependency} = this.findMostMatchingRoute(pathSegments);
        if (srcdoc === '' || srcdoc === undefined) {
            this.log('Rendering ', pathAndQuery, type);
            this.log('were not successful in locating the appropriate module or its version. Please check the module dependencies as well its name');
            return;
        }
        this.log('Handler match ', pathAndQuery, route);
        const pathParams = this.extractParamsFromPath(route, pathSegments);
        const params = ({...queryParams, ...pathParams});
        const dependencies = dependency.reduce((result: StringKeyValue, dep) => {
            const [path, version] = dep.split('@');
            result[path] = version;
            return result;
        }, {});
        if (this.shadowRoot === null) {
            console.error('[MicroEndRouter]', 'ShadowRoot is null we cant renderPackageList this');
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
            if (!this.debugMode) {
                nextFrame.style.position = 'absolute';
            }
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
                if (!useDocumentWrite) {
                    nextFrame.srcdoc = sourceHtml;
                }
                container.append(nextFrame);
                if (useDocumentWrite && nextFrame.contentWindow) {
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
        if (type === 'service') {
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
        const [path, version] = pathSegments;
        const mostMatchingPath = Object.keys(this.routingRegistry).find(key => {
            const [routingPath, routingVersion] = key.split('/').filter(s => s);
            return routingPath === path && routingVersion >= version;
        });
        if (!mostMatchingPath) {
            throw new Error(`No available modules supporting ${path}/${version}`);
        }
        const routingRegistry = this.routingRegistry[mostMatchingPath] || {srcdoc: '', dependencies: []};
        return {route: mostMatchingPath, srcdoc: routingRegistry.srcdoc, dependencies: routingRegistry.dependencies};
    }

    extractParamsFromQuery = (query: string) => {
        const params: StringKeyValue = {};
        (query || '').split('&').filter(s => s).forEach(qry => {
            const [key, value] = qry.split('=');
            params[key] = value;
        });
        return params;
    }

    renderBasedOnHash = () => {
        if (this.suppressRenderBasedOnHash) {
            this.suppressRenderBasedOnHash = false;
            return;
        }
        this.render(window.location.hash.substring(1), "default", "hashchange")
    };

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
            if (type === 'default') {
                const pathQueryAndCallerId = pathAndQuery + (pathAndQuery.indexOf('?') > 0 ? '&' : '?') + `${CALLER_ID_KEY}=${callerId}`;
                window.location.hash = pathQueryAndCallerId;
            } else if (type === 'modal' || type === 'service') {
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
            if (type === 'service') {
                const previousFrame = this.getFrame({route, type, caller});
                if (previousFrame && previousFrame.contentWindow) {
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
            // THIS IS THE PREVIOUS DATA
            if (previousFrame && previousFrame.contentWindow) {
                previousFrame.style.zIndex = '-1';
                previousFrame.contentWindow.postMessage({intent: 'focuschange', value: false}, '*');
                if (type === "modal") {
                    previousFrame.remove();
                }
            }
            this.currentActiveFrame = nextFrame;
            if (type === 'default') {
                // we disable this to avoid re-rendering on next change
                this.suppressRenderBasedOnHash = true;
                window.history.back();
            }
        }
    }

    connectedCallback(): void {
        this.log('connected');
        window.addEventListener('hashchange', this.renderBasedOnHash);
        window.addEventListener('message', this.onMessage);
        (async () => {
            const modules = await getAllModules();
            modules.forEach(d => {
                this.routingRegistry[`/${d.path}/${d.version}`] = d;
            });
            this.renderBasedOnHash();
        })();
    }

    disconnectedCallback(): void {
        this.log('disconnected');
        window.removeEventListener('hashchange', this.renderBasedOnHash);
        window.removeEventListener('message', this.onMessage);
    }
}


function createContext(context: Context): string {
    const template = clientTemplate;
    const newTemplate = template.replace('"@context@"', JSON.stringify(context));
    return newTemplate;
}

const message = (message: string) => `${message} was called from within the mock object; in order to test this correctly, please mount this page in the MicroEnd WebApp.`
const mockObject: MicroEnd = {
    caller: 'anonymous',
    type: "service",
    route: 'unknown',
    dependencies: {},
    isFocused: true,
    params: {},
    navigateBack: value => {
        console.log(message(`navigateBack(${JSON.stringify(value)})`));
    },
    navigateTo: async (route, params, type) => {
        console.log(message(`navigateTo("${route}",${JSON.stringify(params)},"${type}")`));
        return false;
    },
    onFocusChange: callback => {
        console.log(message(`onFocusChange()`));
        return () => {
        }
    },
    onMount: callback => {
        console.log(message(`onMount()`));
        return () => {
        }
    },
    onParamsChange: callback => {
        console.log(message(`onParamsChange()`));
        return () => {
        }
    },
    createService: handler => {
        console.log(message(`createService(${handler})`));
        return handler;
    },
    connectService: module => {
        console.log(message(`connectService("${module}")`));
        return {} as any;
    },
    createNavigation: handler => {
        console.log(message(`createNavigation("${handler}")`));
        return {} as any
    },
    connectNavigation: module => {
        console.log(message(`connectNavigation("${module}")`));
        return {} as any
    }
};

export function getMicroEnd(): MicroEnd {
    const self: any = window;
    if ('microend' in self) {
        return self.microend as MicroEnd;
    }
    if ('me' in self) {
        return self.me as MicroEnd;
    }
    return mockObject;
}

const clientTemplate = `
<script>
    const me = "@context@";
    const paramsChangeListener = [];
    const onFocusListeners = [];
    const onMountListeners = [];
    let onBlurListeners = [];
    let onUnMountListeners = [];

    window.microend = me;
    window.me = me;

    const log = (...args) => {
        console.log('[' + me.route + ']', ...args);
    }

    /**
     * @param event:MessageEvent
     */
    const messageListener = (event) => {
        if (event.data.intent === 'paramschange') {
            const old = me.params;
            const newValue = event.data.params;

            me.route = event.data.route;
            me.type = event.data.type;
            me.caller = event.data.caller;

            if (JSON.stringify(old) !== JSON.stringify(newValue)) {
                me.params = event.data.params;
                paramsChangeListener.forEach(callback => {
                    callback(newValue, old);
                })
            }
        }
        if (event.data.intent === 'focuschange') {
            const value = event.data.value;
            me.isFocused = value;
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
    }, {once: true});

    window.addEventListener('unload', () => {
        onUnMountListeners.forEach(callback => {
            if (callback && typeof callback === 'function') {
                callback();
            }
        })
    }, {once: true})

    window.addEventListener('message', messageListener);
    /**
     *
     * @param callback
     * @returns {(function(): void)|*}
     */
    me.onMount = (callback) => {
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
    me.onParamsChange = (callback) => {
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
    me.onFocusChange = (callback) => {
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
    me.navigateTo = (route, params, type = 'default') => {

        return new Promise((resolve) => {
            params = params || {};
            const caller = (Math.random() * 1000000000 + new Date().getTime()).toFixed(0);
            if (window.top === null) {
                return;
            }
            const dependencyVersion = me.dependencies[route];

            if(dependencyVersion === undefined){
                const [path,version] = me.route.split('/').filter(s => s);
                throw new Error('Please contact the author '+path+'@'+version+' to fix this module, as the author forgot to add a dependency. '+route+'@version');
            }
            route = '/' + route + '/' + dependencyVersion;
            const navigateTo = {
                intent: 'navigateTo',
                params,
                originRoute: me.route,
                originCaller: me.caller,
                originType: me.type,
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
     * @param value
     */
    me.navigateBack = (value) => {
        if (window.top === null) {
            return;
        }
        const navigateBack = {
            intent: 'navigateBack',
            value,
            caller: me.caller,
            type: me.type,
            route: me.route
        }
        window.top.postMessage(navigateBack);
    }

    me.createService = (handler) => {
        const deregister = me.onMount(() => {
            const __handler = handler;
            let action = 'action' in me.params ? me.params.action : '';
            // later on we need to be able to send json for service !!!!
            let args = 'args' in me.params ? me.params.args : '';
            if (me.type === 'service' && action && args) {
                const arrayArgs = JSON.parse(decodeURI(args));
                if (__handler && typeof __handler === 'object' && action in __handler && typeof __handler[action] === 'function') {
                    // this is to ensure we are calling this one time
                    deregister();
                    const promise = Promise.resolve(__handler[action].apply(null, arrayArgs));
                    promise.then(result => {
                        me.navigateBack({
                            success: true,
                            result
                        })
                    }).catch(err => {
                        me.navigateBack({
                            success: false,
                            message: err.message
                        });
                    })
                }
            }
        });
        return handler;
    }

    me.connectService = (module) => {
        const proxy = new Proxy({}, {
            get(_, action) {
                return async (...args) => {
                    const response = await me.navigateTo(module, {
                        action,
                        args: encodeURI(JSON.stringify(args))
                    }, "service");
                    if(response.success){
                        return response.result;
                    }
                    throw new Error(response.message);
                }
            }
        });
        return proxy;
    }
    me.createNavigation = (handler) => {
        const navigation = Object.keys(handler).reduce((navigation,key) => {
            navigation[key] = {
                params : {},
                navigateBack : (param) => me.navigateBack({success:true,result:param})
            }
            return navigation;
        },{current:''});

        const paramsChangeHandler = () => {
            const __handler = handler;
            
            let action = 'action' in me.params ? me.params.action : '';
            // later on we need to be able to send json for service !!!!
            let args = 'args' in me.params ? me.params.args : '';
            let callbackBeforeExit = () => {};
            if (['default','modal'].includes(me.type) && action && args) {
                const arrayArgs = JSON.parse(decodeURI(args));
                if (__handler && typeof __handler === 'object' && action in __handler && typeof __handler[action] === 'function') {
                    // this is to ensure we are calling this one time
                    try{
                        navigation.current = action;
                        navigation[action].params = arrayArgs.length > 0 ? arrayArgs[0] : {};
                        callbackBeforeExit = __handler[action].apply(null, arrayArgs)
                    }catch (err){
                        me.navigateBack({
                            success: false,
                            message: err.message
                        });
                    }
                }
            }
            // un-mounting
            return callbackBeforeExit;
        }
        me.onMount(paramsChangeHandler);
        me.onParamsChange(paramsChangeHandler);
        return navigation;
    }

    me.connectNavigation = (module) => {
        const proxy = new Proxy({}, {
            get(_, action) {
                return async (...args) => {
                    const type = args[args.length - 1];
                    args = args.splice(0,args.length - 1);
                    
                    const response = await me.navigateTo(module, {
                        action,
                        args: encodeURI(JSON.stringify(args))
                    }, type);
                    if(response.success){
                        return response.result;
                    }
                    throw new Error(response.message);
                }
            }
        });
        return proxy;
    }
</script>
`