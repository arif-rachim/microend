import {Store, StoreValueRenderer, useStore} from "./useStore";
import {useEffect} from "react";
import {produce} from "immer";

export function SendReceiveFile(props: { $dataChannel: Store<RTCDataChannel | null> }) {
    const {$dataChannel} = props;
    const $filesReceived = useStore<FileReceived[]>([]);
    useEffect(() => {
        const dataChannel = $dataChannel.get();

        function onMessage(event: MessageEvent) {
            onReceiveMessageCallback({event, $filesReceived});
        }

        if (dataChannel) {
            dataChannel.addEventListener('message', onMessage);
        }
        return () => {
            if (dataChannel) {
                dataChannel.removeEventListener('message', onMessage);
            }
        }
    }, []);
    return <div>
        <h3>You are now able to send files to your peer.</h3>
        <input type={'file'} onChange={async (event) => {
            const files: FileList | null = event.target.files;
            if (files === null) {
                return;
            }
            const dataChannel = $dataChannel.get()!;
            dataChannel.binaryType = 'arraybuffer';
            for (const file of files) {
                await sendData({
                    file, dataChannel, onSend: (progress) => {

                    }
                })
            }
        }}/>
        <StoreValueRenderer store={$filesReceived} selector={s => s} render={(files: FileReceived[]) => {
            return <div style={{display: 'flex', flexDirection: 'column'}}>
                {files.map(f => {
                    return <a key={f.name} href={f.objectUrl} target={'_blank'}>{`${f.progress}% : ${f.name}`} </a>
                })}
            </div>
        }}/>
    </div>
}

async function sendData(props: { file: File, onSend: (progress: number) => void, dataChannel: RTCDataChannel }) {
    return new Promise((resolve, reject) => {
        const {file, onSend, dataChannel} = props;
        if (file.size === 0) {
            return;
        }
        const sendProgressMax = file.size;
        const chunkSize = 16384;
        const fileReader = new FileReader();
        const enc = new TextEncoder();
        // first we send the file !
        dataChannel.send(enc.encode(JSON.stringify({name: file.name, size: file.size, type: file.type})));
        let offset = 0;
        fileReader.addEventListener('error', error => {
            console.error('Error reading file:', error);
            reject(error);
        });
        fileReader.addEventListener('abort', event => {
            console.log('File reading aborted:', event);
            reject(event)
        });
        fileReader.addEventListener('load', (e: ProgressEvent<FileReader>) => {
            console.log('FileRead.onload ', e);
            if (e.target === null) {
                return;
            }
            const fileReader: FileReader = e.target;
            const result: ArrayBuffer = fileReader.result as ArrayBuffer;
            dataChannel.send(result);
            offset += result.byteLength;
            if (offset < sendProgressMax) {
                onSend(Math.round(offset / sendProgressMax) * 100);
                readSlice(offset);
            } else {
                resolve(true);
            }
        });
        const readSlice = (o: number) => {
            const slice = file.slice(offset, o + chunkSize);
            fileReader.readAsArrayBuffer(slice);
        };
        readSlice(0);
    })

}

let receiveBuffer: any[] = [];
let receivedSize: number = 0;
let fileName: string = '';
let fileSize: number = 0;
let fileType: string = '';
let timestampStart: number = 0;

interface FileReceived {
    name: string,
    size: number,
    progress: number,
    objectUrl: string
}

function onReceiveMessageCallback(props: {
    event: MessageEvent, $filesReceived: Store<FileReceived[]>
}) {
    const {event, $filesReceived} = props;
    if (fileName === '' && fileSize === 0) {
        const te = new TextDecoder();
        const {name, size, type} = JSON.parse(te.decode(event.data));
        fileName = name;
        fileSize = size;
        fileType = type;
        $filesReceived.set(produce(old => {
            old.push({name: name, size: size, objectUrl: '', progress: 0});
        }))
        timestampStart = new Date().getTime();
        return;
    }
    receiveBuffer.push(event.data);
    receivedSize += event.data.byteLength;
    $filesReceived.set(produce(old => {
        const index = old.findIndex(s => s.name === fileName);
        old[index].progress = Math.round((receivedSize / fileSize) * 100);
    }))


    if (receivedSize === fileSize) {
        const received = new Blob(receiveBuffer, {type: fileType});

        $filesReceived.set(produce(old => {
            const index = old.findIndex(s => s.name === fileName);
            old[index].objectUrl = URL.createObjectURL(received);
        }));

        const bitrate = Math.round(receivedSize * 8 /
            ((new Date()).getTime() - timestampStart));
        fileName = '';
        fileSize = 0;
        receiveBuffer = [];
        receivedSize = 0;
        // bitrateDiv.innerHTML =
        //     `<strong>Average Bitrate:</strong> ${bitrate} kbits/sec (max: ${bitrateMax} kbits/sec)`;

    }
}