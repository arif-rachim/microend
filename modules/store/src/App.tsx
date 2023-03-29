import {IoAddCircleOutline} from "react-icons/io5";
import {motion} from "framer-motion";
import {StoreValueRenderer, useSlidePanel, useStore} from "@microend/utils";
import {getAllModules, Module, saveModuleCodes} from "@microend/lib";
import {useEffect, useState} from "react";
import {ModuleDetailPanel} from "./ModuleDetailPanel";
import {ServerModuleDetailPanel} from "./ServerModuleDetailPanel";

const BASE_URL = 'http://localhost:5173';

export interface ServerModule {
    author: string;//"arif.rachim@gmail.com"
    description: string; //"Identity Access Management allows user to add roles and user into the application"
    icon: string;//"stores/iam/1.html.icon.txt"
    moduleName: string;//:"iam@1.0.0"
    path: string;//:"iam"
    source: string;//:"stores/iam/1.html"
    title: string;//:"IAM"
    version: string;//:"1.0.0"
    visibleInHomeScreen: string;//:"true"
}

export function App() {
    const $modules = useStore<Module[]>([]);
    const $serverModules = useStore<ServerModule[]>([]);
    const [showPanel, SlidePanel] = useSlidePanel();
    useEffect(() => {
        (async () => {
            const modules = await getAllModules();
            $modules.set(modules);
        })();
        (async () => {
            const response = await fetch(`${BASE_URL}/stores.json`);
            const serverModules:ServerModule[] = await response.json();
            $serverModules.set(serverModules);
        })();
    }, []);
    return <div style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        alignItems: 'center',
        backgroundColor: '#f2f2f2'
    }}>
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            height: '100%',
            overflow: 'auto',
            width: '100%',
            maxWidth: 800,
            backgroundColor: 'white'
        }}>
            <div
                style={{display: 'flex', flexDirection: 'row', padding: 10, borderBottom: '1px solid rgba(0,0,0,0.1)'}}>
                <input style={{width: '100%', borderRadius: 10, padding: '5px 10px'}} type={'search'}
                       placeholder={'Search Modules'}/>
                <motion.label style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginLeft: 10
                }} whileHover={{scale: 1.03}} whileTap={{scale: 0.98}}>
                    <IoAddCircleOutline style={{fontSize: 25, color: 'rgba(0,0,0,0.8)'}}/>
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
                padding: 10,
                borderBottom: '1px solid rgba(0,0,0,0.1)'
            }}>
                <label style={{fontSize: 18, marginBottom: 10}}>Installed Modules</label>
                <StoreValueRenderer store={$modules} selector={s => s} render={(modules: Module[]) => {
                    return <div style={{display: 'flex', flexDirection: 'row'}}>
                        {modules.map(m => {
                            return <motion.div key={m.name}
                                               style={{display: 'flex', flexDirection: 'column', margin: 5}}
                                               initial={{scale: 0.8}} animate={{scale: 1}} whileHover={{scale: 1.05}}
                                               whileTap={{scale: 0.98}} onClick={async () => {
                                await showPanel(closePanel => {
                                    return <ModuleDetailPanel module={m} closePanel={closePanel}/>
                                })
                            }}>
                                <div style={{
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                }}>
                                    <img alt={m.title} src={m.iconDataURI} width={32} height={32}/>
                                </div>
                                <label style={{textAlign: 'center'}}>{m.title}</label>
                            </motion.div>
                        })}
                    </div>
                }}/>
            </div>
            <div style={{
                display: 'flex',
                flexDirection: 'column',
                padding: 10,
                borderBottom: '1px solid rgba(0,0,0,0.1)'
            }}>
                <label style={{fontSize: 18, marginBottom: 10}}>Modules</label>
                <StoreValueRenderer store={$serverModules} selector={s => s} render={(modules: ServerModule[]) => {
                    return <div style={{display: 'flex', flexDirection: 'row'}}>
                        {modules.map(m => {
                            return <motion.div key={m.moduleName}
                                               style={{display: 'flex', flexDirection: 'column', margin: 5}}
                                               initial={{scale: 0.8}} animate={{scale: 1}} whileHover={{scale: 1.05}}
                                               whileTap={{scale: 0.98}} onClick={async () => {
                                await showPanel(closePanel => {
                                    return <ServerModuleDetailPanel module={m} closePanel={closePanel}/>
                                })
                            }}>
                                <div style={{
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                }}>
                                    <ImageUrl module={m}/>
                                </div>
                                <label style={{textAlign: 'center'}}>{m.title}</label>
                            </motion.div>
                        })}
                    </div>
                }}/>
            </div>
        </div>
        {SlidePanel}
    </div>
}

function ImageUrl(props:{module:ServerModule}){
    const m = props.module;
    const [icon,setIcon] = useState('');
    useEffect(() => {
        (async () => {
            const response = await fetch(`${BASE_URL}/${m.icon}`);
            const iconText = await response.text();
            setIcon(iconText);
        })();
    },[m.icon])
    if(icon === ''){
        return <div style={{width:32,height:32,backgroundColor:'#f2f2f2',borderRadius:16}}></div>
    }
    return <img alt={m.title} src={icon} width={32} height={32}/>
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