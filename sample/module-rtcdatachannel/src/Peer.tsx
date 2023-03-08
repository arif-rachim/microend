import {Html5QrcodeScanner} from "html5-qrcode";
import {useEffect, useId, useState} from "react";
import {QRCodeSVG} from "qrcode.react";
import {ConnectionState, debug, debugChannel} from "./debug";
import {StoreValueRenderer, useStore} from "./useStore";


export function Peer(props: { isFocused: boolean }) {
    const {isFocused} = props;
    const elementId = useId();
    const [icesAndOffer, setIcesAndOffer] = useState<{ ices: RTCIceCandidate[], offer: RTCSessionDescriptionInit } | null>(null);
    const [answer, setAnswer] = useState<RTCSessionDescriptionInit | null>(null);
    const [dataChannel, setDataChannel] = useState<RTCDataChannel | null>(null);
    const $connectionState = useStore<ConnectionState>({});
    useEffect(() => {
        if (!isFocused) {
            return;
        }
        const html5QrcodeScanner = new Html5QrcodeScanner(elementId, {
            rememberLastUsedCamera: false,
            fps: 30,
            aspectRatio: 0.7,
            qrbox: 250,
            showZoomSliderIfSupported: true,
        }, false);
        html5QrcodeScanner.render(async (decodedText, result) => {
            const payload = JSON.parse(decodedText);
            if ('ices' in payload && 'offer' in payload) {
                setIcesAndOffer(payload);
                await html5QrcodeScanner.clear();
            }
        }, (errorMessage, error) => {
        });
        document.getElementById(elementId)!.style.border = 'unset';
        document.querySelectorAll('[alt="Info icon"]').forEach(e => (e as HTMLElement).style.display = 'none')

        return () => {
            html5QrcodeScanner.clear();
        }
    }, [isFocused]);
    useEffect(() => {

        if (!icesAndOffer) {
            return;
        }
        (async () => {

            const peerConnection = new RTCPeerConnection({iceServers: []});
            debug({peerConnection, name: 'Peer', $connectionState: $connectionState});
            await peerConnection.setRemoteDescription(new RTCSessionDescription(icesAndOffer.offer));
            peerConnection.addEventListener('datachannel', (event) => {
                const channel = event.channel;
                debugChannel({dataChannel: channel, name: 'Peer',$connectionState});
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
        height: '100%'
    }}>
        <div style={{marginLeft: 20, marginRight: 20, marginTop: 20}}>
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
                Ensure that your hotspot is already active so that your requester can connect to your device.
            </div>
            <ul>
                <li>After Requester's device has successfully connected, you can scan their QR code to accept their
                    connection offer.
                </li>
                <li>You will be prompted with a QR code that must be scanned by Requester to complete the connection
                    handshake.
                </li>
                <li>Once Requester has successfully scanned your QR code, you can begin receiving and sending files to
                    your Requester.
                </li>
            </ul>
        </div>
        {!icesAndOffer && isFocused && <div id={elementId} style={{width: 300, height: 500}}/>}
        {answer && <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center', paddingBottom: 20}}>
            <div style={{fontStyle: 'italic', fontSize: 14, padding: 20}}>Please request that the requester scan this QR
                Code to complete the handshake.
            </div>
            <QRCodeSVG size={300} value={JSON.stringify({answer})}/>
        </div>}
    </div>
}