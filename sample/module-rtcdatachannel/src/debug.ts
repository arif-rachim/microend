import {Store} from "./useStore";

export interface ConnectionState {
    iceGatheringState?: RTCIceGatheringState,
    iceConnectionState?: RTCIceConnectionState,
    connectionState?: RTCPeerConnectionState,
    signallingState?: RTCSignalingState,
    dataState?: RTCDataChannelState
}

export function debug(props: { peerConnection: RTCPeerConnection, name: string, $connectionState: Store<ConnectionState> }) {
    const {peerConnection, name, $connectionState} = props;
    const refreshState = () => {
        $connectionState.set(old => {
            const newState = {...old};
            newState.signallingState = peerConnection.signalingState;
            newState.connectionState = peerConnection.connectionState;
            newState.iceGatheringState = peerConnection.iceGatheringState;
            newState.iceConnectionState = peerConnection.iceConnectionState;
            return newState;
        });
    }
    peerConnection.addEventListener('icegatheringstatechange', refreshState)
    peerConnection.addEventListener('iceconnectionstatechange', refreshState)
    peerConnection.addEventListener('icecandidateerror', refreshState)
    peerConnection.addEventListener('icecandidate', (event: RTCPeerConnectionIceEvent) => {
        const candidate = event.candidate;
        if (candidate) {
            console.log(name, 'icecandidate', candidate);
        }
    })
    peerConnection.addEventListener('connectionstatechange', refreshState)
    peerConnection.addEventListener('negotiationneeded', refreshState)
    peerConnection.addEventListener('signalingstatechange', refreshState)
}

export function debugChannel(props: { dataChannel: RTCDataChannel, name: string, $connectionState: Store<ConnectionState> }) {
    const {dataChannel, name, $connectionState} = props;
    const refreshState = () => $connectionState.set(data => ({...data, dataState: dataChannel.readyState}));
    dataChannel.addEventListener('open', refreshState);
    dataChannel.addEventListener('closing', refreshState);
    dataChannel.addEventListener('close', refreshState);
    dataChannel.addEventListener('error', refreshState);

}