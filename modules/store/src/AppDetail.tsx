import {Module} from "@microend/lib";
import {CSSProperties} from "react";

const LABEL_WIDTH = 100;
const labelStyle: CSSProperties = {display: 'flex', borderBottom: '1px solid rgba(0,0,0,0.1)', padding: '2px 5px'}

export function AppDetail(props: { module: Module, closePanel: (result: any) => void }) {
    const {module, closePanel} = props;
    return <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center'
    }}>
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            backgroundColor: 'white',
            height: '100%',
            width: '100%',
            maxWidth: 800,
            padding: 10,
            borderBottomLeftRadius: 10,
            borderBottomRightRadius: 10
        }}>
            <div style={{display: 'flex', alignItems: 'center'}}>
                <img src={module.iconDataURI} alt={module.title} width={50} height={50}/>
                <h1 style={{marginLeft: 10}}>{props.module.title}</h1>
            </div>
            <div style={labelStyle}>
                <div style={{width: LABEL_WIDTH, flexShrink: 0}}>Name</div>
                <div>{module.name}</div>
            </div>
            <div style={labelStyle}>
                <div style={{width: LABEL_WIDTH, flexShrink: 0}}>Description</div>
                <div>{module.description}</div>
            </div>
            <div style={labelStyle}>
                <div style={{width: LABEL_WIDTH, flexShrink: 0}}>Author</div>
                <div>{module.author}</div>
            </div>
            <div style={labelStyle}>
                <div style={{width: LABEL_WIDTH, flexShrink: 0}}>Dependencies</div>
                <div>{module.dependencies}</div>
            </div>
            <div style={labelStyle}>
                <div style={{width: LABEL_WIDTH, flexShrink: 0}}>Is Active</div>
                <div>{module.active.toString()}</div>
            </div>
            <div style={labelStyle}>
                <div style={{width: LABEL_WIDTH, flexShrink: 0}}>Is Deleted</div>
                <div>{module.deleted.toString()}</div>
            </div>
            <div style={labelStyle}>
                <div style={{width: LABEL_WIDTH, flexShrink: 0}}>Installed On</div>
                <div>{formatDate(module.installedOn)}</div>
            </div>
            <div style={labelStyle}>
                <div style={{width: LABEL_WIDTH, flexShrink: 0}}>Created On</div>
                <div>{formatDate(module.lastModified)}</div>
            </div>
            <div style={labelStyle}>
                <div style={{width: LABEL_WIDTH, flexShrink: 0}}>Path</div>
                <div>{module.path}</div>
            </div>
            <div style={labelStyle}>
                <div style={{width: LABEL_WIDTH, flexShrink: 0}}>Version</div>
                <div>{module.version}</div>
            </div>
            <div style={labelStyle}>
                <div style={{width: LABEL_WIDTH, flexShrink: 0}}>Title</div>
                <div>{module.title}</div>
            </div>
            <div style={labelStyle}>
                <div style={{width: LABEL_WIDTH, flexShrink: 0}}>Size</div>
                <div>{formatSize(module.size)}</div>
            </div>
            <div style={labelStyle}>
                <div style={{width: LABEL_WIDTH, flexShrink: 0}}>Viewable</div>
                <div>{module.visibleInHomeScreen.toString()}</div>
            </div>
            <div style={labelStyle}>
                <div style={{width: LABEL_WIDTH, flexShrink: 0}}>Navigate</div>
                <div>
                    <a href={`#/${module.path}/${module.version}`}
                       data-link="true">{`#/${module.path}/${module.version}`}</a>
                </div>
            </div>
            <button style={{marginTop: 10}} onClick={() => {
                closePanel('Okay')
            }}>Close
            </button>
        </div>
    </div>
}

const month = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];

function formatDate(time: number) {
    const date = new Date(time);
    const pad = (time: number) => time < 10 ? '0' + time : time.toString()
    return `${pad(date.getDate())}-${month[date.getMonth()]}-${date.getFullYear()} ${pad(date.getHours())}:${pad(date.getMinutes())}`
}

function formatSize(size: number) {
    const kiloBytes = Math.ceil(size / 1000);
    if (kiloBytes < 500) {
        return `${kiloBytes}Kb`;
    }
    const megaBytes = (kiloBytes / 1000).toFixed(1);
    return `${megaBytes}Mb`;
}
