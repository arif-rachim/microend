import {Store} from "./useStore";
import {ConnectionState, debug, debugChannel} from "./debug";
import {CSSProperties, useEffect, useId, useState} from "react";
import {Html5QrcodeScanner} from "html5-qrcode";
import {QRCodeSVG} from "qrcode.react";

const buttonStyle: CSSProperties = {
    backgroundColor: 'white',
    border: '1px solid rgba(0,0,0,0.1)',
    padding: 10,
    borderRadius: 5
};


export function RequesterConnectionSetupDialog(props: { visible: boolean, $connectionState: Store<ConnectionState>, onDataChannelChange: (dataChannel: RTCDataChannel) => void }) {
    //const {elementId,$connectionState,setPeerConnection,setIces,ices,offer,setOffer,setDataChannel,setScanQr,scanQr,hasIceAndOffer} = props;
    const {$connectionState, onDataChannelChange} = props;
    const elementId = useId();
    const [ices, setIces] = useState<RTCIceCandidate[]>([]);
    const [peerConnection, setPeerConnection] = useState<RTCPeerConnection | null>(null);
    const [offer, setOffer] = useState<RTCSessionDescriptionInit | null>(null);
    // const [dataChannel, setDataChannel] = useState<RTCDataChannel | null>(null);
    const [scanQr, setScanQr] = useState(false);
    const hasIceAndOffer = ices.length > 0 && offer;

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
                if ('answer' in json) {
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
        marginLeft: 20,
        marginRight: 20,
        marginTop: 20,
        display: props.visible ? 'flex' : 'none',
        flexDirection: 'column'
    }}>
        <div>
            It is necessary to "handshake" with your peer by exchanging QR codes before we can begin transferring files
            between each other.
        </div>
        <ul>
            <li>Verify that you have been able to connect to your peer hotspot without any problems.</li>
            <li>Generate QR code for your peer</li>
            <li>Your peer will first scan the QR code, and then he will send you another QR code that he has
                generated.
            </li>
            <li>Scan the QR code that your peer has generated.</li>
            <li>In the event that the connection is established successfully, you may then begin sending or receiving
                files.
            </li>
        </ul>
        <div style={{display: 'flex', justifyContent: 'center'}}>
            <button
                style={buttonStyle}
                onClick={async () => {
                    const peerConnection = new RTCPeerConnection({iceServers: []});
                    debug({peerConnection, name: 'Requester', $connectionState});
                    const dataChannel = peerConnection.createDataChannel('microend');
                    debugChannel({dataChannel: dataChannel, name: 'Requester', $connectionState});
                    peerConnection.addEventListener('icecandidate', (event) => {
                        const candidate = event.candidate;
                        if (candidate) {
                            setIces(old => [...old, candidate]);
                        }
                    });
                    const offer = await peerConnection.createOffer();
                    await peerConnection.setLocalDescription(offer);
                    setPeerConnection(peerConnection);
                    setOffer(offer);
                    onDataChannelChange(dataChannel);
                }}>{hasIceAndOffer ? 'Refresh QR for Peer' : 'Generate QR for Peer'}</button>
            {hasIceAndOffer &&
                <button style={{...buttonStyle, marginLeft: 10}} onClick={() => setScanQr(true)}>Scan Peer QR</button>
            }
        </div>
        <div style={{paddingBottom: 20, display: 'flex', justifyContent: 'center'}}>
            {hasIceAndOffer && !scanQr && <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center'}}>
                <div style={{fontStyle: 'italic', fontSize: 14, padding: 20}}>Please request that the peer scan this QR
                    Code to proceed the handshake.
                </div>
                <QRCodeSVG size={300} value={JSON.stringify({ices, offer})}/>
            </div>}
            {scanQr && <div id={elementId} style={{width: 300, height: 500}}/>}
        </div>
    </div>;
}
