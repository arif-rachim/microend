import {Host} from "./Host";
import './App.css';
import {useState} from "react";
import {Peer} from "./Peer";

export function App() {
    const [mode, setMode] = useState<'host' | 'peer'>('host');
    return <div style={{display: 'flex', flexDirection: 'column', height: '100%'}}>
        <div style={{display: 'flex', justifyContent: 'center', alignItems: 'center', marginTop:20}}>
            <div onClick={() => setMode('host')}
                 style={{
                     border: '1px solid rgba(0,0,0,0.1)',
                     padding: 5,
                     backgroundColor: 'white',
                     borderRadius: 5,
                     color: mode === 'host' ? '#333' : '#CCC'
                 }}>Host
            </div>
            <div onClick={() => setMode('peer')}
                 style={{
                     border: '1px solid rgba(0,0,0,0.1)',
                     padding: 5,
                     backgroundColor: 'white',
                     borderRadius: 5,
                     color: mode === 'peer' ? '#333' : '#CCC',
                     marginLeft:10
                 }}>Peer
            </div>
        </div>
        {mode === 'host' && <Host/>}
        {mode === 'peer' && <Peer/>}
    </div>
}