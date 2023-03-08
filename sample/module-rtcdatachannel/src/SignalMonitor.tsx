import {Store, StoreValueRenderer} from "./useStore";
import {ConnectionState} from "./debug";
import {CSSProperties} from "react";

const cellStyle: CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    width: '20%',
    paddingBottom: 0,
    alignItems: 'center',
    textAlign: 'center',
    flexShrink: 0
}
const cellTitleStyle: CSSProperties = {
    fontSize: 10, fontWeight: 'bold',
    display: 'flex', alignItems: 'flex-end',
    height:30
};
const cellValueStyle:CSSProperties = {
    fontSize: 12,
    display: 'flex', alignItems: 'flex-end',
}

export function SignalMonitor(props: { $connectionState: Store<ConnectionState> }) {
    const {$connectionState} = props;
    return <StoreValueRenderer store={$connectionState} selector={s => s} render={(s: ConnectionState) => {
        return <div style={{display: 'flex', flexWrap: 'wrap', marginBottom: 10, marginTop: 0, width: '100%'}}>
            <div style={cellStyle}>
                <div style={cellTitleStyle}>Connection</div>
                <div style={cellValueStyle}>{s.connectionState}</div>
            </div>
            <div style={cellStyle}>
                <div style={cellTitleStyle}>Ice Connection</div>
                <div style={cellValueStyle}>{s.iceConnectionState}</div>
            </div>
            <div style={cellStyle}>
                <div style={cellTitleStyle}>Ice Gathering</div>
                <div style={cellValueStyle}>{s.iceGatheringState}</div>
            </div>
            <div style={cellStyle}>
                <div style={cellTitleStyle}>Signal</div>
                <div style={cellValueStyle}>{s.signallingState}</div>
            </div>
            <div style={cellStyle}>
                <div style={cellTitleStyle}>Data</div>
                <div style={cellValueStyle}>{s.dataState}</div>
            </div>
        </div>
    }}/>;
}