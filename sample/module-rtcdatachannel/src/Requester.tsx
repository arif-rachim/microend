import {useState} from "react";
import {ConnectionState} from "./debug";
import {useStore, useStoreListener} from "./useStore";
import {SendReceiveFile} from "./SendReceiveFile";
import {SignalMonitor} from "./SignalMonitor";
import {RequesterConnectionSetupDialog} from "./RequesterConnectionSetupDialog";


export function Requester() {
    const $connectionState = useStore<ConnectionState>({});
    const $dataChannel = useStore<RTCDataChannel | null>(null);
    const [readyToSendFile, setReadyToSendFile] = useState(false);
    useStoreListener($connectionState, s => s, (value) => {
        setReadyToSendFile(value.connectionState === 'connected' && value.iceConnectionState === 'connected' && value.iceGatheringState === 'complete' && value.dataState === 'open');
    })
    return <div style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%'
    }}>
        <SignalMonitor $connectionState={$connectionState}/>
        {readyToSendFile && <SendReceiveFile $dataChannel={$dataChannel}/>}
        <RequesterConnectionSetupDialog visible={!readyToSendFile} $connectionState={$connectionState}
                                        onDataChannelChange={dataChannel => $dataChannel.set(dataChannel)}/>
    </div>
}