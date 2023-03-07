import {Html5QrcodeScanner} from "html5-qrcode";
import {useEffect, useState} from "react";
import {QRCodeSVG} from "qrcode.react";
import {debug, debugChannel} from "./debug";

const qrcodeRegionId = "html5qr-code-full-region";

export function Peer() {
    const [icesAndOffer, setIcesAndOffer] = useState<{ ices: RTCIceCandidate[], offer: RTCSessionDescriptionInit } | null>(null);
    const [answer, setAnswer] = useState<RTCSessionDescriptionInit | null>(null);
    const [dataChannel, setDataChannel] = useState<RTCDataChannel | null>(null);
    useEffect(() => {
        const html5QrcodeScanner = new Html5QrcodeScanner(qrcodeRegionId, {
            rememberLastUsedCamera: true,
            fps: 30,
            aspectRatio: 0.7,
            qrbox: 300,
            showZoomSliderIfSupported: true
        }, false);
        html5QrcodeScanner.render(async (decodedText, result) => {
            const payload = JSON.parse(decodedText);
            if('ices' in payload && 'offer' in payload){
                setIcesAndOffer(payload);
                await html5QrcodeScanner.clear();
            }
        }, (errorMessage, error) => {
        });
        document.getElementById(qrcodeRegionId)!.style.border = 'unset';
        (document.querySelector('[alt="Info icon"]') as HTMLImageElement).style.display = 'none'
    }, []);
    useEffect(() => {
        if (!icesAndOffer) {
            return;
        }
        (async () => {
            const peerConnection = new RTCPeerConnection({iceServers: []});
            debug({peerConnection, name: 'Peer'});
            await peerConnection.setRemoteDescription(new RTCSessionDescription(icesAndOffer.offer));
            peerConnection.addEventListener('datachannel', (event) => {
                const channel = event.channel;
                debugChannel({dataChannel: channel, name: 'Peer'});
                channel.addEventListener('message', (event) => {
                    console.log('WE GOT DATA', event.data);
                });
                setDataChannel(channel);
            })
            const answer = await peerConnection.createAnswer();
            await peerConnection.setLocalDescription(answer);
            for (const ice of icesAndOffer.ices) {
                await peerConnection.addIceCandidate(ice);
            }
            setAnswer(answer);
        })();

    }, [icesAndOffer])
    return <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100%'
    }}>
        {!icesAndOffer && <div id={qrcodeRegionId} style={{width:'100%',maxWidth:800}}/>}
        {answer && <QRCodeSVG size={300} value={JSON.stringify({answer})}/>}
    </div>
}