import {CallerIdOrigin, Context, MessageData, MicroEnd, NavigateToType, RoutingRegistry, StringKeyValue} from "./Types";
import {getAllModules, getModuleSource} from "./dataStore";
import {satisfies} from "compare-versions";
import {nanoid} from "nanoid";

export const DATABASE_NAME = 'routing-registry';
export type Table = 'module' | 'module-source' | 'app-context';

// warning use document write is slow, but the code is cleaner when displayed in the screen.
// const useDocumentWrite = true;

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

    origin: string;

    constructor() {
        super();
        this.routingRegistry = {};
        this.callerIdOrigin = {};
        this.currentActiveFrame = null;
        this.style.display = 'flex';
        this.style.flexDirection = 'column';
        this.style.boxSizing = 'border-box';
        //this.style.position = 'relative';
        this.suppressRenderBasedOnHash = false;
        this.debugMode = this.getAttribute('debug') === 'true';
        this.origin = this.getAttribute('origin') ?? '';
    }

    log = (...messages: any[]) => {
        if (this.debugMode) {
            console.log('[MicroEndRouter]', ...messages);
        }
    }
    splitSegment = (text: string) => {
        return text.split('/').filter(s => s)
    };

    render = async (pathAndQuery: string, type: NavigateToType, caller: string) => {

        const [path, query] = pathAndQuery.split('?');
        const queryParams = this.extractParamsFromQuery(query);
        // WE ARE REMOVING THE CALLER FROM HERE !
        if (CALLER_ID_KEY in queryParams) {
            caller = queryParams[CALLER_ID_KEY];
            delete queryParams[CALLER_ID_KEY];
        }
        const pathSegments = this.splitSegment(path).map(p => decodeURIComponent(p));
        if (pathSegments.length === 0) {
            return;
        }
        const {route, moduleSourceId, dependencies: dependency} = await this.findMostMatchingRoute(pathSegments);
        if (moduleSourceId === '' || moduleSourceId === undefined) {
            this.log('Rendering ', pathAndQuery, type);
            this.log('were not successful in locating the appropriate module or its version. Please check the module dependencies as well its name');
            return;
        }
        this.log('Handler match ', pathAndQuery, route);
        const pathParams = this.extractParamsFromPath(route, pathSegments);
        const params = ({...queryParams, ...pathParams});
        const dependencies = dependency.reduce((result: StringKeyValue, dep) => {
            const [path, version] = dep.split('@').filter(s => s);
            result[path] = version;
            return result;
        }, {});
        const moduleSource = await getModuleSource(moduleSourceId);
        this.log('moduleSource :', moduleSource);
        this.renderSourceHtml({route, type, caller, params, dependencies, srcdoc: moduleSource.srcdoc});
    }

    renderSourceHtml = (props: { route: string, type: "default" | "modal" | "service", caller: string, params: { [p: string]: string }, dependencies: StringKeyValue, srcdoc: string }) => {
        const {srcdoc, dependencies, caller, type, params, route} = props;
        const origin = this.origin;
        let nextFrame: HTMLIFrameElement | null = this.getFrame({route, type, caller});
        if (nextFrame === null) {
            const id = nanoid();
            nextFrame = document.createElement('iframe');
            nextFrame.setAttribute('id', id);
            nextFrame.setAttribute('data-route', route);
            nextFrame.setAttribute('data-type', type);
            nextFrame.setAttribute('data-caller', caller);
            nextFrame.setAttribute('data-focused', 'true');
            nextFrame.style.display = type === 'service' ? 'none' : 'flex';
            nextFrame.style.border = 'none';
            nextFrame.style.flexDirection = 'column';
            nextFrame.style.width = '100vw';
            nextFrame.style.height = '100vh'
            nextFrame.style.top = '0';
            nextFrame.style.left = '0';
            nextFrame.style.backgroundColor = '#FFF';
            nextFrame.style.position = 'fixed';
            nextFrame.style.zIndex = '0';

            window.scrollTo({top: 0, behavior: 'auto'});
            const contextScript = createContext({
                params,
                isFocused: true,
                dependencies,
                route,
                caller,
                type,
                id,
                origin
            });
            let headIndex = srcdoc.indexOf('<head>');
            if (headIndex > 0) {
                headIndex = headIndex + '<head>'.length
            }
            const sourceHtml = headIndex > 0 ? srcdoc.substring(0, headIndex) + contextScript + srcdoc.substring(headIndex + 1, srcdoc.length) : contextScript + srcdoc;
            if (!this.debugMode) {
                nextFrame.srcdoc = sourceHtml;
            }
            this.append(nextFrame);
            if (this.debugMode && nextFrame.contentWindow) {
                const doc = nextFrame.contentWindow.document;
                doc.open();
                doc.write(sourceHtml);
                doc.close();
            }
        } else if (nextFrame.contentWindow !== null) {
            nextFrame.setAttribute('data-route', route);
            nextFrame.setAttribute('data-type', type);
            nextFrame.setAttribute('data-caller', caller);
            nextFrame.setAttribute('data-focused', 'true');
            nextFrame.style.zIndex = '0';
            nextFrame.contentWindow.postMessage({intent: 'paramschange', params, route, type, caller}, '*');
            nextFrame.contentWindow.postMessage({intent: 'focuschange', value: true}, '*');
        }
        if (type === 'service') {
            // return we just ignore this, on server we don't bother the previous frame zIndex
            return;
        }
        let previousFrame: HTMLIFrameElement | null = this.currentActiveFrame;
        const previousFrameAndNextIsNotSame = previousFrame !== nextFrame;
        if (previousFrame && previousFrame.contentWindow && previousFrameAndNextIsNotSame) {
            // we cant do this, this is dangerous if we make it empty
            previousFrame.setAttribute('data-focused', 'false');
            previousFrame.style.zIndex = '-1';
            previousFrame.contentWindow.postMessage({intent: 'focuschange', value: false}, '*');
        }
        this.currentActiveFrame = nextFrame;
    }

    getFrame = (props: { route: string, type: NavigateToType, caller: string }): HTMLIFrameElement | null => {
        if (props.type === 'default') {
            return document.querySelector(`[data-route="${props.route}"][data-type="${props.type}"]`);
        }
        return document.querySelector(`[data-route="${props.route}"][data-type="${props.type}"][data-caller="${props.caller}"]`)
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

    findMostMatchingRoute = async (pathSegments: string[], retry: boolean = true): Promise<{
        route: string,
        moduleSourceId: string,
        dependencies: string[]
    }> => {
        const [path, version] = pathSegments;
        const mostMatchingPath = Object.keys(this.routingRegistry).find(key => {
            const [routingPath, routingVersion] = key.split('/').filter(s => s);
            if (version === '*') {
                return routingPath === path;
            }
            return routingPath === path && satisfies(routingVersion, version);
        });
        if (!mostMatchingPath) {
            if (retry) {
                await this.refreshRegistry();
                return this.findMostMatchingRoute(pathSegments, false);
            }
            throw new Error(`No available modules supporting ${path}/${version}`);
        }
        const routingRegistry = this.routingRegistry[mostMatchingPath] || {moduleSourceId: '', dependencies: []};
        return {
            route: mostMatchingPath,
            moduleSourceId: routingRegistry.moduleSourceId,
            dependencies: routingRegistry.dependencies
        };
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
            this.log('incoming message', event.data);
            const params = event.data.params;

            const originRoute = event.data.originRoute;
            const originCaller = event.data.originCaller;
            const originType = event.data.originType;
            this.log('Finding frame ', {route: originRoute, caller: originCaller, type: originType});
            const originalFrame = this.getFrame({route: originRoute, caller: originCaller, type: originType});
            if (originalFrame === null) {
                this.log('WE COULD NOT GET THE FRAME !!! this is wrong !!');
                console.warn('WE COULD NOT GET THE FRAME !!! this is wrong !!');
                return;
            }
            this.log('Frame Found');
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
                this.log(`event type is "${type}" so we are navigating using window.location.hash`, pathQueryAndCallerId);
                window.location.hash = pathQueryAndCallerId;
            } else if (type === 'modal' || type === 'service') {
                this.log(`event type is "${type}" so we are calling render directly`, pathAndQuery);
                this.render(pathAndQuery, type, callerId);
            }
        }
        if (event.data.intent === 'navigateBack') {
            this.log('incoming message', event.data);
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
                nextFrame.setAttribute('data-focused', 'true');
                nextFrame.style.zIndex = '0';
                nextFrame.contentWindow.postMessage({intent: 'focuschange', value: true}, '*');
            }
            const previousFrame = this.getFrame({route, type, caller});
            // THIS IS THE PREVIOUS DATA
            if (previousFrame && previousFrame.contentWindow) {
                previousFrame.setAttribute('data-focused', 'false');
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
        if (event.data.intent === 'reload') {
            window.location.reload();
        }
    }


    connectedCallback(): void {
        this.log('connected');
        window.addEventListener('hashchange', this.renderBasedOnHash);
        window.addEventListener('message', this.onMessage);
        this.refreshRegistry().then(() => {
            this.renderBasedOnHash();
        });
    }

    async refreshRegistry(): Promise<void> {
        const modules = await getAllModules();
        modules.filter(m => m.active && !m.deleted).sort((a, b) => a.version.localeCompare(b.version)).forEach(d => {
            this.routingRegistry[`/${d.path}/${d.version}`] = d;
        });
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
    id: 'anonymous',
    caller: 'anonymous',
    type: "service",
    route: 'unknown',
    dependencies: {},
    isFocused: true,
    params: {},
    origin : '',
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
     * navigateTo there is some behavior
     * <li>navigateTo default
     *      - open a new function via browser hash
     *      - this causes window history to update
     *      - This will reuse existing frames that have been opened
     *      - when the frame finishes summoning it won't be destroyed
     *
     * <li>navigateTo modal
     *      - open a new function without passing the browser hash
     *      - does not cause window history to update
     *      - will open a new frame
     *      - when the frame finishes being summoned it will be destroyed
     *
     * <li>navigateTo service
     *     - open a new function without passing the browser hash
     *     - does not display new frames
     *     - when finished the frame will be destroyed
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

            let dependencyVersion = me.dependencies[route];

            if(dependencyVersion === undefined && '*' in me.dependencies){
                dependencyVersion = me.dependencies['*'];
            }

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