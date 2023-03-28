import {getAllModules, getMicroEnd, Module} from "@microend/lib";
import {useEffect, useState} from "react";
import {motion} from "framer-motion";

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

    return <div style={{
        display: 'flex',
        flexDirection: 'row',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'center',
        maxHeight: '100%',
        overflow: 'auto',
        padding: 10
    }}>
        {modules.map(m => {
            return <motion.div key={m.name} style={{
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                margin: 5,
                alignItems: 'center'
            }} whileHover={{scale: 1.05}} whileTap={{scale: 0.95}}>
                <div style={{
                    width: 60,
                    height: 60,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: '#f2f2f2',
                    border: '1px solid rgba(0,0,0,0.05)',
                    borderRadius: 50,
                    overflow: 'hidden',
                    boxShadow: '0 5px 5px -3px rgba(0,0,0,0.1)'
                }} onClick={() => {
                    me.navigateTo(m.path, {}, 'default').then();
                }}>
                    <img src={m.iconDataURI} width={50} height={50}/>
                </div>
                <div style={{fontSize: 12, maxWidth: 60}}>{m.title}</div>
            </motion.div>
        })}
    </div>
}