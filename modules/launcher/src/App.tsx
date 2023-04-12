import {getAllModules, getMicroEnd, Module} from "@microend/lib";
import {useEffect, useState} from "react";
import {AnimatePresence, motion} from "framer-motion";
import background from "./background/background.jpg";
const me = getMicroEnd();

export function App() {
    const [modules, setModules] = useState<Module[]>([]);
    useEffect(() => {
        (async () => {
            const modules = await getAllModules();
            const mods = modules.filter(m => (m.active && m.visibleInHomeScreen && !m.deleted));
            setModules(mods);
        })();
    }, []);
    const [search,setSearch] = useState('');
    return <div style={{display:'flex',flexDirection:'column',height:'100%',alignItems:'center'}}>
        <img src={background} style={{position:'fixed',top:0,left:0,width:'100%',height:'100%',minWidth:800,zIndex:-1}}/>
        <div style={{display:'flex',flexDirection:'column',width:'100%',maxWidth:800,padding:20}}>
            <input style={{padding:'10px 15px',borderRadius:20}} placeholder={'Search Modules'} type={'search'} value={search} onChange={(event) => {
                setSearch(event.target.value);
            }}/>
        </div>
        <div style={{
            display: 'flex',
            flexDirection: 'row',
            flexWrap: 'wrap',
            alignItems: 'flex-start',
            justifyContent: 'center',
            maxHeight: '100%',
            overflow: 'auto',
            maxWidth:800,
            width:'100%',
            padding: 10
        }}>
            <AnimatePresence>
            {modules.filter(m => {
                if(search){
                    return m.title.toUpperCase().indexOf(search.toUpperCase()) >= 0
                }
                return true;
            }).map(m => {
                return <motion.div key={m.name} style={{
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    margin: 7,
                    alignItems: 'center'
                }} initial={{scale: 0, opacity: 0}} animate={{scale: 1, opacity: 1}} whileHover={{scale: 1.05}} exit={{scale:0,opacity:0}}
                                   layout={true}
                                   whileTap={{scale: 0.95}}>
                    <div style={{
                        width: 60,
                        height: 60,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        borderRadius: 50,
                        overflow: 'hidden',
                        background:'rgba(255,255,255,0.5)',
                        boxShadow: '0 5px 5px -3px rgba(0,0,0,0.1)'
                    }} onClick={() => {
                        me.navigateTo(m.path, {}, 'default').then();
                    }}>
                        <img src={m.iconDataURI} width={50} height={50}/>
                    </div>
                    <div style={{fontSize: 12, maxWidth: 60, textAlign: 'center', marginTop: 5}}>{m.title}</div>
                </motion.div>
            })}
            </AnimatePresence>
        </div>
    </div>
}