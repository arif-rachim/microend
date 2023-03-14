import {Requester} from "./Requester";
import './App.css';
import {useState} from "react";
import {Peer} from "./Peer";
import {motion} from "framer-motion";

const border = '1px solid rgba(0,0,0,0.1)';

export function App() {
    const [mode, setMode] = useState<'requester' | 'peer'>('requester');
    const isRequesterActive = mode === "requester";
    return <div style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        width: '100%',
        maxWidth: 800,
        margin: 'auto',
        borderLeft: border,
        borderRight: border,
        backgroundColor: 'white'
    }}>
        <div style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            paddingTop: 20,
            paddingBottom: 20,
            borderBottom: border,
            boxShadow: '0 5px 5px -3px rgba(0,0,0,0.1)'
        }}>
            <div onClick={() => setMode('requester')}
                 style={{
                     border: '1px solid rgba(0,0,0,0.1)',
                     padding: 5,
                     backgroundColor: 'white',
                     borderRadius: 5,
                     color: mode === 'requester' ? '#333' : '#CCC'
                 }}>Requester
            </div>
            <div onClick={() => setMode('peer')}
                 style={{
                     border: '1px solid rgba(0,0,0,0.1)',
                     padding: 5,
                     backgroundColor: 'white',
                     borderRadius: 5,
                     color: mode === 'peer' ? '#333' : '#CCC',
                     marginLeft: 10
                 }}>Peer
            </div>
        </div>

        <div style={{
            display: 'flex',
            flexDirection: 'column',
            height: '100%',
            position: 'relative',
            overflow: 'hidden'
        }}>
            <motion.div style={{
                display: 'flex',
                flexDirection: 'column',
                height: '100%',
                overflow: 'auto',
                position: 'absolute',
                top: 0,
                width: '100%'
            }}
                        initial={{x: '-100%'}} animate={{x: isRequesterActive ? 0 : '-100%'}}><Requester/></motion.div>
            <motion.div style={{
                display: 'flex',
                flexDirection: 'column',
                height: '100%',
                overflow: 'auto',
                position: 'absolute',
                top: 0,
                width: '100%'
            }}
                        initial={{x: '100%'}} animate={{x: isRequesterActive ? '100%' : 0}}><Peer/></motion.div>

        </div>
    </div>
}