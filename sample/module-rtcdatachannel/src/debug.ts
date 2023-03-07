export function debug(props: { peerConnection: RTCPeerConnection, name: string }) {
    const {peerConnection, name} = props;
    peerConnection.addEventListener('icegatheringstatechange', (event) => console.log(name, 'icegatheringstatechange', peerConnection.iceGatheringState))
    peerConnection.addEventListener('iceconnectionstatechange', (event) => console.log(name, 'iceconnectionstatechange', peerConnection.iceConnectionState))
    peerConnection.addEventListener('icecandidateerror', (event) => console.log(name, 'icecandidateerror'))
    peerConnection.addEventListener('icecandidate', (event: RTCPeerConnectionIceEvent) => {
        const candidate = event.candidate;
        if (candidate) {
            console.log(name, 'icecandidate', candidate);
        }
    })
    peerConnection.addEventListener('connectionstatechange', (event) => console.log(name, 'connectionstatechange', peerConnection.connectionState))
    peerConnection.addEventListener('negotiationneeded', (event) => console.log(name, 'negotiationneeded'))
    peerConnection.addEventListener('signalingstatechange', (event) => console.log(name, 'signalingstatechange', peerConnection.signalingState))
}

export function debugChannel(props: { dataChannel: RTCDataChannel, name: string }) {
    const {dataChannel, name} = props;
    dataChannel.addEventListener('open', () => console.log(name, 'datachannel', 'open', dataChannel.readyState))
    dataChannel.addEventListener('close', () => console.log(name, 'datachannel', 'close', dataChannel.readyState))
    dataChannel.addEventListener('error', () => console.log(name, 'datachannel', 'error', dataChannel.readyState))
    dataChannel.addEventListener('closing', () => console.log(name, 'datachannel', 'closing', dataChannel.readyState))


}