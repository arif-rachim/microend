import {IoAddCircleOutline} from "react-icons/io5";
import {motion} from "framer-motion";
import {StoreValueRenderer, useSlidePanel, useStore} from "@microend/utils";
import {getAllModules, Module, saveModuleCodes} from "@microend/lib";
import {useEffect} from "react";
import {AppDetail} from "./AppDetail";


export function App() {
    const $modules = useStore<Module[]>([]);
    const [showPanel, SlidePanel] = useSlidePanel();
    useEffect(() => {
        (async () => {
            const modules = await getAllModules();
            $modules.set(modules);
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
                       placeholder={'Search Apps'}/>
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
                <label style={{fontSize: 18, marginBottom: 10}}>Installed Apps</label>
                <StoreValueRenderer store={$modules} selector={s => s} render={(modules: Module[]) => {
                    return <div style={{display: 'flex', flexDirection: 'row'}}>
                        {modules.map(m => {
                            return <motion.div key={m.name}
                                               style={{display: 'flex', flexDirection: 'column', margin: 5}}
                                               initial={{scale: 0.8}} animate={{scale: 1}} whileHover={{scale: 1.05}}
                                               whileTap={{scale: 0.98}} onClick={async () => {
                                await showPanel(closePanel => {
                                    return <AppDetail module={m} closePanel={closePanel}/>
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
                <label>Store Apps</label>
                <div style={{display: 'flex', flexDirection: 'row'}}>
                    THIS IS SAMPLE INSTALLED APPS
                </div>
            </div>
        </div>
        {SlidePanel}
    </div>
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