import {useState} from "react";
import {ConnectionState} from "./debug";
import {useStore, useStoreListener} from "./useStore";
import {SendReceiveFile} from "./SendReceiveFile";
import {SignalMonitor} from "./SignalMonitor";
import {PeerConnectionSetupDialog} from "./PeerConnectionSetupDialog";


export function Peer() {
    const $connectionState = useStore<ConnectionState>({});
    const $dataChannel = useStore<RTCDataChannel | null>(null)
    const [readyToSendFile, setReadyToSendFile] = useState(false);
    useStoreListener($connectionState, s => s, (value) => {
        setReadyToSendFile(value.connectionState === 'connected' && value.iceConnectionState === 'connected' && value.iceGatheringState === 'complete' && value.dataState === 'open');
    })
    return <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        height: '100%'
    }}>
        <SignalMonitor $connectionState={$connectionState}/>
        {readyToSendFile && <SendReceiveFile $dataChannel={$dataChannel}/>}
        <PeerConnectionSetupDialog
            visible={!readyToSendFile}
            $connectionState={$connectionState}
            onDataChannelChange={(dataChannel) => $dataChannel.set(dataChannel)}
        />

    </div>
}