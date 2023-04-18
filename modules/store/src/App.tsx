import {IoAddCircleOutline, IoCheckmarkCircle} from "react-icons/io5";
import {AnimatePresence, motion} from "framer-motion";
import {ContentInfo, Store, StoreValueRenderer, useSlidePanel, useStore, useStoreValue} from "@microend/utils";
import {getAllModules, Module, saveModuleCodes, getMicroEnd, MicroEnd} from "@microend/lib";
import {useEffect, useState} from "react";
import {ModuleDetailPanel} from "./ModuleDetailPanel";
import {ServerModuleDetailPanel} from "./ServerModuleDetailPanel";
import {compareVersions, satisfies} from "compare-versions";
import background from "./background/background.jpg";

const me:MicroEnd = getMicroEnd();

export interface ServerModule extends ContentInfo {
    source: string;
}

type DownloadMessage = { module: ServerModule, percentage: number, status: 'running' | 'complete' };

function downloadedModules() {
    const listeners: ((message: DownloadMessage) => void)[] = [];

    function addListener(listener: (message: DownloadMessage) => void) {
        listeners.push(listener);
        return () => {
            listeners.splice(listeners.indexOf(listener), 1);
        }
    }

    function dispatchEvent(message: DownloadMessage) {
        listeners.forEach(listener => listener(message))
    }

    return {
        addListener,
        dispatchEvent
    }
}

const dm = downloadedModules();

async function initiateDownload(modules: ServerModule[]) {
    const responses = await Promise.all(modules.map(module => fetch(`${me.origin}/${module.source}`)));
    const contents = await Promise.all(responses.map((responses, index) => {
        const module = modules[index];
        let loaded = 0;
        let contentLength = responses.headers.get('content-length')!;
        const total = parseInt(contentLength, 10);
        const res = new Response(new ReadableStream({
            async start(controller) {
                const reader = responses.body!.getReader();
                for (; ;) {
                    const {done, value} = await reader.read();
                    if (done) {
                        break;
                    }
                    loaded += value.byteLength;
                    const percentage = Math.round((loaded / total) * 100);
                    dm.dispatchEvent({module, percentage, status: percentage === 100 ? 'complete' : 'running'})
                    controller.enqueue(value);
                }
                controller.close();
            }
        }))
        return res.text();
    }));
    return contents;
}

async function installModules(modules: ServerModule[]) {
    const contents = await initiateDownload(modules);
    await saveModuleCodes({contents: contents, autoAccept: false, skipIfItsAlreadyInstalled: false});
}

async function downloadModules(modules: ServerModule[]) {
    const contents = await initiateDownload(modules);
    contents.forEach((content, index) => {
        const module = modules[index];
        saveAs({content, fileName: `${module.path}@${module.version}.html`});
    })
}

function saveAs(props: { content: string, fileName: string }) {
    const {content, fileName} = props;
    const a = document.createElement('a');
    const url = URL.createObjectURL(new Blob([content], {type: 'text/plain'}));
    a.href = url;
    a.download = fileName;
    a.click();
    URL.revokeObjectURL(url);
}


/**
 * Mechanism to get all server modules
 */
function pushAllDependenciesToBucket<T extends ContentInfo>(props: { module: T, allModules: T[], bucket: T[] }) {
    const {module, allModules, bucket} = props;
    bucket.push(module);
    if (module.dependencies && module.dependencies.length > 0) {
        module.dependencies.forEach((dep: string) => {
            // dep can be like ~1.0.0;^1.0.0;>1.0.0
            const [path, range] = dep.split('@');
            const versions = allModules.filter(s => s.path === path);
            const sortedVersion = versions.sort((a, b) => compareVersions(a.version, b.version))
            const dependencyModule = sortedVersion.find(s => satisfies(s.version, range));
            if (dependencyModule) {
                const notExist = bucket.find(m => m.path === dependencyModule.path && m.version === dependencyModule.version) === undefined;
                if (notExist) {
                    pushAllDependenciesToBucket({bucket, allModules, module: dependencyModule});
                }
            }
        })
    }
}

function ServerModuleIcon(props: { serverModule: ServerModule, $installedModules: Store<Module[]> }) {
    const {serverModule, $installedModules} = props;
    const isInstalled = useStoreValue($installedModules, installedModules => {
        const installedModule = installedModules.find(im => im.path === serverModule.path);
        return installedModule !== undefined;
    });
    const [installationPercentage, setInstallationPercentage] = useState(0);
    useEffect(() => {
        return dm.addListener((message) => {
            if (message.module.name === serverModule.name) {
                setInstallationPercentage(message.percentage)
            }
        })
    }, [])
    return <div style={{display: 'flex', flexDirection: 'column', maxWidth: 50, alignItems: 'center'}}>
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative',
            border: '1px solid rgba(0,0,0,0.1)',
            borderRadius: 10,
            width: 40, height: 40,
            backgroundColor: 'rgba(255,255,255,0.5)'
        }}>
            <IconImage module={serverModule} width={32} height={32}/>
            {isInstalled &&
                <IoCheckmarkCircle width={10} height={10}
                                   style={{position: 'absolute', top: -5, right: -5, color: 'green'}}/>
            }
            {installationPercentage > 0 && installationPercentage < 100 &&
                <div style={{
                    position: 'absolute',
                    bottom: -10,
                    right: -5,
                    padding: '0px 3px',
                    color: 'white',
                    borderRadius: 3,
                    backgroundColor: 'red',
                    fontSize: 12
                }}>{installationPercentage}</div>
            }

        </div>
        <label style={{textAlign: 'center', fontSize: 12}}>{serverModule.title}</label>
    </div>;
}

export function App() {
    const $installedModules = useStore<Module[]>([]);
    const $serverModules = useStore<ServerModule[]>([]);
    const [searchQuery, setSearchQuery] = useState('')
    const [showPanel, SlidePanel] = useSlidePanel();
    useEffect(() => {
        (async () => {
            const modules = await getAllModules();
            $installedModules.set(modules);
        })();
        (async () => {
            const response = await fetch(`${me.origin}/stores/index.json`);
            const serverModules: ServerModule[] = await response.json();
            $serverModules.set(serverModules);
        })();
    }, []);

    async function onInstall(module: ServerModule, allModules: ServerModule[]) {
        const bucket: ServerModule[] = [];
        pushAllDependenciesToBucket({module, allModules, bucket});
        await installModules(bucket);
    }

    async function onDownload(module: ServerModule, allModules: ServerModule[]) {
        const bucket: ServerModule[] = [];
        pushAllDependenciesToBucket({module, allModules, bucket});
        await downloadModules(bucket);
    }

    return <div style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        alignItems: 'center'
    }}>
        <img src={background} style={{position:'fixed',top:0,left:0,width:'100%',height:'100%',minWidth:800,zIndex:-1}}/>
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            height: '100%',
            overflow: 'auto',
            width: '100%',
            maxWidth: 800,
            padding : 20,
            backdropFilter:'blur(100px)',
            background:'rgba(255,255,255,0.1)',
        }}>
            <div
                style={{display: 'flex', flexDirection: 'row',marginBottom:20}}>
                <input style={{width: '100%', borderRadius: 20, padding: '10px 15px'}} type={'search'}
                       placeholder={'Search Modules'} value={searchQuery} onChange={(e) => {
                    const value = e.target.value;
                    setSearchQuery(value)
                }}/>
                <motion.label style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginLeft: 10
                }} whileHover={{scale: 1.03}} whileTap={{scale: 0.98}}>
                    <IoAddCircleOutline style={{fontSize: 38, color: 'rgba(255,255,255,0.9)',backgroundColor:'rgba(0,0,0,0.3)',borderRadius:20,boxShadow:'0 5px 5px -3px rgba(0,0,0,0.1)'}}/>
                    <input type={"file"} multiple accept={"text/html"} style={{display: 'none'}}
                           onChange={async (event) => {
                               const input = event.target as HTMLInputElement;
                               if (input.files === null) {
                                   console.warn('[MicroEndModuleLoader]', 'Files from HTMLInputElement is null, exiting function');
                                   return;
                               }
                               const files: FileList = input.files;
                               const contents = await Promise.all(Array.from(files).map(file => readFile(file)));
                               await saveModuleCodes({contents, autoAccept: false, skipIfItsAlreadyInstalled: false});
                           }}/>
                </motion.label>
            </div>
            <div style={{
                display: 'flex',
                flexDirection: 'column',
                marginBottom:20
            }}>
                <label style={{fontSize: 18, marginBottom: 10}}>Installed Modules</label>
                <StoreValueRenderer store={$installedModules} selector={s => s}
                                    render={(installedModules: Module[]) => {
                                        installedModules = installedModules.filter(m => m.title.toLowerCase().indexOf(searchQuery.toLowerCase()) >= 0)
                                        return <div style={{display: 'flex', flexDirection: 'row'}}>
                                            <AnimatePresence>
                                                {installedModules.map(installedModule => {
                                                    return <motion.div key={installedModule.name}
                                                                       style={{
                                                                           display: 'flex',
                                                                           flexDirection: 'column',
                                                                           margin: 5,
                                                                           alignItems:'center'
                                                                       }}
                                                                       initial={{scale: 0}} animate={{scale: 1}}
                                                                       exit={{scale: 0}}
                                                                       layout={'position'}
                                                                       whileHover={{scale: 1.05}}
                                                                       whileTap={{scale: 0.9}} onClick={async () => {
                                                        await showPanel(closePanel => {
                                                            return <ModuleDetailPanel module={installedModule}
                                                                                      closePanel={closePanel}/>
                                                        })
                                                    }}>
                                                        <div style={{
                                                            display: 'flex',
                                                            flexDirection: 'column',
                                                            alignItems: 'center',
                                                            justifyContent: 'center',
                                                            borderRadius: 10,
                                                            width: 40, height: 40,
                                                            backgroundColor: 'rgba(255,255,255,0.5)'
                                                        }}>
                                                            <img alt={installedModule.title}
                                                                 src={installedModule.iconDataURI} width={32}
                                                                 height={32}/>
                                                        </div>
                                                        <label
                                                            style={{textAlign: 'center',fontSize:12}}>{installedModule.title}</label>
                                                    </motion.div>
                                                })}
                                            </AnimatePresence>
                                        </div>
                                    }}/>
            </div>
            <div style={{
                display: 'flex',
                flexDirection: 'column'
            }}>
                <label style={{fontSize: 18, marginBottom: 10}}>Modules</label>
                <StoreValueRenderer store={$serverModules} selector={s => s}
                                    render={(serverModules: ServerModule[]) => {
                                        serverModules = serverModules.filter(m => m.title.toLowerCase().indexOf(searchQuery.toLowerCase()) >= 0)
                                        return <div style={{display: 'flex', flexDirection: 'row'}}>
                                            <AnimatePresence>
                                                {serverModules.map(serverModule => {
                                                    return <motion.div key={serverModule.name}
                                                                       style={{
                                                                           display: 'flex',
                                                                           flexDirection: 'column',
                                                                           margin: 5
                                                                       }}
                                                                       layout={'position'}
                                                                       initial={{scale: 0}} animate={{scale: 1}}
                                                                       exit={{scale: 0}}
                                                                       whileHover={{scale: 1.05}}
                                                                       whileTap={{scale: 0.9}} onClick={async () => {
                                                        await showPanel(closePanel => {
                                                            return <ServerModuleDetailPanel module={serverModule}
                                                                                            closePanel={closePanel}
                                                                                            onInstall={() => onInstall(serverModule, $serverModules.get())}
                                                                                            onDownload={() => onDownload(serverModule, $serverModules.get())}
                                                            />
                                                        })
                                                    }}>
                                                        <ServerModuleIcon serverModule={serverModule}
                                                                          $installedModules={$installedModules}/>
                                                    </motion.div>
                                                })}
                                            </AnimatePresence>
                                        </div>
                                    }}/>
            </div>
        </div>
        {SlidePanel}
    </div>
}

export function IconImage(props: { module: ContentInfo, width: number, height: number }) {
    const m = props.module;
    const [icon, setIcon] = useState('');
    useEffect(() => {
        (async () => {
            const response = await fetch(`${me.origin}/${m.iconDataURI}`);
            const iconText = await response.text();
            setIcon(iconText);
        })();
    }, [m.iconDataURI])
    if (icon === '') {
        return <div style={{
            width: props.width,
            height: props.height,
            backgroundColor: '#f2f2f2',
            borderRadius: props.width
        }}></div>
    }
    return <img alt={m.title} src={icon} width={props.width} height={props.height}/>
}

function readFile(file: File): Promise<string> {
    return new Promise((resolve) => {
        const reader = new FileReader();
        reader.addEventListener('load', async (event: ProgressEvent<FileReader>) => {
            resolve(event?.target?.result?.toString() || '');
        });
        reader.readAsText(file, 'utf-8');
    })
}
