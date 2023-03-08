import {CSSProperties, useEffect, useId, useState} from "react";
import {QRCodeSVG} from "qrcode.react";
import {ConnectionState, debug, debugChannel} from "./debug";
import {Html5QrcodeScanner} from "html5-qrcode";
import {StoreValueRenderer, useStore} from "./useStore";
const buttonStyle: CSSProperties = {
    backgroundColor: 'white',
    border: '1px solid rgba(0,0,0,0.1)',
    padding: 10,
    borderRadius: 5
};


export function Requester() {
    const elementId = useId();
    const [ices, setIces] = useState<RTCIceCandidate[]>([]);
    const [peerConnection, setPeerConnection] = useState<RTCPeerConnection | null>(null);
    const [offer, setOffer] = useState<RTCSessionDescriptionInit | null>(null);
    const [dataChannel, setDataChannel] = useState<RTCDataChannel | null>(null);
    const [scanQr, setScanQr] = useState(false);
    const hasIceAndOffer = ices.length > 0 && offer;
    const $connectionState = useStore<ConnectionState>({});
    useEffect(() => {
        if (scanQr && peerConnection) {
            const html5QrcodeScanner = new Html5QrcodeScanner(elementId, {
                rememberLastUsedCamera: false,
                fps: 30,
                aspectRatio: 0.7,
                qrbox: 250,
                showZoomSliderIfSupported: true,
            }, false);
            html5QrcodeScanner.render(async (decodedText, result) => {
                const json = JSON.parse(decodedText);
                if('answer' in json){
                    await peerConnection.setRemoteDescription(new RTCSessionDescription(json.answer));
                    await html5QrcodeScanner.clear();
                    setScanQr(false);
                }
            }, (errorMessage, error) => {
            });
            document.getElementById(elementId)!.style.border = 'unset';
            document.querySelectorAll('[alt="Info icon"]').forEach(e => (e as HTMLElement).style.display = 'none')
        }
    }, [scanQr])

    return <div style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%'
    }}>
        <div style={{marginLeft:20,marginRight:20,marginTop:20}}>
            <StoreValueRenderer store={$connectionState} selector={s => s} render={(s:ConnectionState) => {
                return <div style={{display:'flex',marginBottom:10,height:30}}>
                    <div style={{display:'flex',flexDirection:'column',marginRight:10,width:'20%',alignItems:'center',flexShrink:0}}>
                        <div style={{fontSize:12,fontWeight:'bold'}}>Connection</div>
                        <div>{s.connectionState}</div>
                    </div>

                    <div style={{display:'flex',flexDirection:'column',marginRight:10,width:'20%',alignItems:'center',flexShrink:0}}>
                        <div style={{fontSize:12,fontWeight:'bold'}}>Ice Connection</div>
                        <div>{s.iceConnectionState}</div>
                    </div>
                    <div style={{display:'flex',flexDirection:'column',marginRight:10,width:'20%',alignItems:'center',flexShrink:0}}>
                        <div style={{fontSize:12,fontWeight:'bold'}}>Ice Gathering</div>
                        <div>{s.iceGatheringState}</div>
                    </div>
                    <div style={{display:'flex',flexDirection:'column',marginRight:10,width:'20%',alignItems:'center',flexShrink:0}}>
                        <div style={{fontSize:12,fontWeight:'bold'}}>Signal</div>
                        <div>{s.signallingState}</div>
                    </div>
                    <div style={{display:'flex',flexDirection:'column',marginRight:10,width:'20%',alignItems:'center',flexShrink:0}}>
                        <div style={{fontSize:12,fontWeight:'bold'}}>Data</div>
                        <div>{s.dataState}</div>
                    </div>
                </div>
            }} />

            <div>
                It is necessary to "handshake" with your peer by exchanging QR codes before we can begin transferring files between each other.
            </div>
            <ul>
                <li>Verify that you have been able to connect to your peer hotspot without any problems.</li>
                <li>Generate QR code for your peer</li>
                <li>Your peer will first scan the QR code, and then he will send you another QR code that he has generated.</li>
                <li>Scan the QR code that your peer has generated.</li>
                <li>In the event that the connection is established successfully, you may then begin sending or receiving files.</li>
            </ul>
        </div>
        <div style={{display: 'flex',justifyContent:'center'}}>
            <button
                style={buttonStyle}
                onClick={async () => {
                    const peerConnection = new RTCPeerConnection({iceServers: []});
                    debug({peerConnection, name: 'Requester',$connectionState});
                    const dataChannel = peerConnection.createDataChannel('microend');
                    debugChannel({dataChannel: dataChannel, name: 'Requester',$connectionState});
                    dataChannel.addEventListener('message', (event) => {
                        console.log('WE GOT MESSAGE', event.data);
                    })
                    peerConnection.addEventListener('icecandidate', (event) => {
                        const candidate = event.candidate;
                        if (candidate) {
                            setIces(old => [...old, candidate]);
                        }
                    });
                    const offer = await peerConnection.createOffer();
                    await peerConnection.setLocalDescription(offer);
                    setPeerConnection(peerConnection);
                    setDataChannel(dataChannel);
                    setOffer(offer);
                }}>{hasIceAndOffer ? 'Refresh QR for Peer' : 'Generate QR for Peer'}</button>
            {hasIceAndOffer &&
                <button style={{...buttonStyle, marginLeft: 10}} onClick={() => setScanQr(true)}>Scan Peer QR</button>
            }
        </div>
        <div style={{paddingBottom:20,display:'flex',justifyContent:'center'}}>
            {hasIceAndOffer && !scanQr && <div style={{display:'flex',flexDirection:'column',alignItems:'center'}}>
                <div style={{fontStyle:'italic',fontSize:14,padding:20}}>Please request that the peer scan this QR Code to proceed the handshake.</div>
                <QRCodeSVG size={300} value={JSON.stringify({ices, offer})} />
            </div>}
            {scanQr && <div id={elementId} style={{width: 300, height: 500}}/>}
        </div>
    </div>
}