import {CSSProperties, useEffect, useState} from "react";
import {QRCodeSVG} from "qrcode.react";
import {debug, debugChannel} from "./debug";
import {Html5QrcodeScanner} from "html5-qrcode";

const buttonStyle: CSSProperties = {
    backgroundColor: 'white',
    border: '1px solid rgba(0,0,0,0.1)',
    padding: 10,
    borderRadius: 5
};
const qrcodeRegionId = "html5qr-code-full-region";

export function Host() {
    const [ices, setIces] = useState<RTCIceCandidate[]>([]);
    const [peerConnection, setPeerConnection] = useState<RTCPeerConnection | null>(null);
    const [offer, setOffer] = useState<RTCSessionDescriptionInit | null>(null);
    const [dataChannel, setDataChannel] = useState<RTCDataChannel | null>(null);
    const [scanQr, setScanQr] = useState(false);
    const hasIceAndOffer = ices.length > 0 && offer;

    useEffect(() => {
        if (scanQr && peerConnection) {
            const html5QrcodeScanner = new Html5QrcodeScanner(qrcodeRegionId, {
                rememberLastUsedCamera: true,
                fps: 30,
                aspectRatio: 0.7,
                qrbox: 250,
                showZoomSliderIfSupported: true
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
            document.getElementById(qrcodeRegionId)!.style.border = 'unset';
            (document.querySelector('[alt="Info icon"]') as HTMLImageElement).style.display = 'none'
        }
    }, [scanQr])

    return <div style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%'
    }}>
        <div style={{padding:10,width:'100vw'}}>
            <div>
                It is necessary to "handshake" with your peer by exchanging QR codes before we can begin transferring files between each other.
            </div>
            <ul>
                <li>First, check to see that the hotspot is turned on.</li>
                <li>Verify that your peer has been able to connect to your hotspot without any problems, and then your peer needs to open the Peer page.</li>
                <li>Generate QR code for your peer</li>
                <li>Your peer will first scan the QR code, and then he will send you another QR code that he has generated.</li>
                <li>Scan the QR code that your peer has generated.</li>
                <li>In the event that the connection is established successfully, you may then begin sending files.</li>
            </ul>
        </div>
        <div style={{display: 'flex',justifyContent:'center'}}>
            <button
                style={buttonStyle}
                onClick={async () => {
                    const peerConnection = new RTCPeerConnection({iceServers: []});
                    debug({peerConnection, name: 'Host'});
                    const dataChannel = peerConnection.createDataChannel('microend');
                    debugChannel({dataChannel: dataChannel, name: 'Host'});
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
                }}>{hasIceAndOffer ? 'Restart' : 'Start'}</button>
            {hasIceAndOffer &&
                <button style={{...buttonStyle, marginLeft: 10}} onClick={() => setScanQr(true)}>Scan Client QR</button>
            }
        </div>
        <div style={{marginTop: 20,paddingBottom:20,display:'flex',justifyContent:'center'}}>
            {hasIceAndOffer && !scanQr && <QRCodeSVG size={300} value={JSON.stringify({ices, offer})}/>}
            {scanQr && <div id={qrcodeRegionId} style={{width: 300, height: 500}}/>}
        </div>
    </div>
}