import {CSSProperties} from "react";
import {IconImage, ServerModule} from "./App";
import {IoDownloadOutline,IoFolderOutline} from "react-icons/io5";
import {motion} from "framer-motion";

const LABEL_WIDTH = 100;
const labelStyle: CSSProperties = {display: 'flex', borderBottom: '1px solid rgba(0,0,0,0.1)', padding: '2px 5px'}

export function ServerModuleDetailPanel(props: { module: ServerModule, closePanel: (result: any) => void, onDownload: (module: ServerModule) => void ,onInstall: (module: ServerModule) => void }) {
    const {module, closePanel} = props;


    return <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center'
    }}>
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            backgroundColor: 'white',
            height: '100%',
            width: '100%',
            maxWidth: 800,
            padding: 10,
            borderBottomLeftRadius: 10,
            borderBottomRightRadius: 10
        }}>
            <div style={{display: 'flex', alignItems: 'center', borderBottom: '1px solid rgba(0,0,0,0.1)'}}>
                <IconImage module={module} width={50} height={50}/>
                <h1 style={{marginLeft: 10, flexGrow: 1}}>{props.module.title}</h1>
                <div style={{display:'flex',flexDirection:'column',alignItems:'center',marginRight:10}}>
                    <motion.div style={{
                        backgroundColor: '#f2f2f2',
                        borderRadius: 50,
                        padding: 3,
                        width: 40,
                        height: 40,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        userSelect: 'none'
                    }} animate={{scale: 1, boxShadow: '0 5px 5px -3px rgba(0,0,0,0.5)'}}
                                whileTap={{scale: 0.9, boxShadow: '0 5px 5px -3px rgba(0,0,0,0.5) inset'}}
                                onClick={() => {
                                    props.onInstall(module);
                                }}>
                        <IoDownloadOutline style={{fontSize: 25}}/>
                    </motion.div>
                    <div style={{fontSize:12,marginTop:5,textAlign:'center'}}>Install into device</div>
                </div>
                <div style={{display:'flex',flexDirection:'column',alignItems:'center'}}>
                    <motion.div style={{
                        backgroundColor: '#f2f2f2',
                        borderRadius: 50,
                        padding: 3,
                        width: 40,
                        height: 40,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        userSelect: 'none'
                    }} animate={{scale: 1, boxShadow: '0 5px 5px -3px rgba(0,0,0,0.5)'}}
                                whileTap={{scale: 0.9, boxShadow: '0 5px 5px -3px rgba(0,0,0,0.5) inset'}}
                                onClick={() => {
                                    props.onDownload(module);
                                }}>
                        <IoFolderOutline style={{fontSize: 25}}/>
                    </motion.div>
                    <div style={{fontSize:12,marginTop:5,textAlign:'center'}}>Download Package</div>
                </div>
            </div>
            <div style={labelStyle}>
                <div style={{width: LABEL_WIDTH, flexShrink: 0}}>Title</div>
                <div>{module.title}</div>
            </div>
            <div style={labelStyle}>
                <div style={{width: LABEL_WIDTH, flexShrink: 0}}>Name</div>
                <div>{module.name}</div>
            </div>
            <div style={labelStyle}>
                <div style={{width: LABEL_WIDTH, flexShrink: 0}}>Description</div>
                <div>{module.description}</div>
            </div>
            <div style={labelStyle}>
                <div style={{width: LABEL_WIDTH, flexShrink: 0}}>Author</div>
                <div>{module.author}</div>
            </div>
            <div style={labelStyle}>
                <div style={{width: LABEL_WIDTH, flexShrink: 0}}>Dependencies</div>
                <div style={{display: 'flex', flexDirection: 'row'}}>{module.dependencies.map(dep => {
                    return <div key={dep} style={{
                        border: '1px solid rgba(0,0,0,0.1)',
                        marginRight: 5,
                        padding: '0px 5px',
                        borderRadius: 5,
                        backgroundColor: '#f2f2f2'
                    }}>{dep}</div>
                })}</div>
            </div>

            <div style={labelStyle}>
                <div style={{width: LABEL_WIDTH, flexShrink: 0}}>Path</div>
                <div>{module.path}</div>
            </div>
            <div style={labelStyle}>
                <div style={{width: LABEL_WIDTH, flexShrink: 0}}>Version</div>
                <div>{module.version}</div>
            </div>

            <div style={labelStyle}>
                <div style={{width: LABEL_WIDTH, flexShrink: 0}}>Size</div>
                <div>{formatSize(module.size)}</div>
            </div>
            <div style={labelStyle}>
                <div style={{width: LABEL_WIDTH, flexShrink: 0}}>Viewable</div>
                <div>{module.visibleInHomeScreen.toString()}</div>
            </div>
            <button style={{marginTop: 10, borderRadius: 10, backgroundColor: '#f2f2f2'}} onClick={() => {
                closePanel('Okay')
            }}>Close
            </button>
        </div>
    </div>
}

const month = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];

function formatDate(time: number) {
    const date = new Date(time);
    const pad = (time: number) => time < 10 ? '0' + time : time.toString()
    return `${pad(date.getDate())}-${month[date.getMonth()]}-${date.getFullYear()} ${pad(date.getHours())}:${pad(date.getMinutes())}`
}

function formatSize(size: number) {
    const kiloBytes = Math.ceil(size / 1000);
    if (kiloBytes < 500) {
        return `${kiloBytes}Kb`;
    }
    const megaBytes = (kiloBytes / 1000).toFixed(1);
    return `${megaBytes}Mb`;
}
