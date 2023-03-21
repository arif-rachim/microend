import {Module} from "../Types";
import {getModule} from "../moduleQuery";
import {MicroEndPackageManager} from "./MicroEndPackageManager";
import {renderIcon} from "./renderIcon";

export async function renderPackageDetails(packageManager: MicroEndPackageManager, moduleName: string) {
    return new Promise((resolve) => {
        (async () => {
            const module: Module | false = await getModule(moduleName);
            if (module === false) {
                alert('Module does not exit ' + moduleName);
                return;
            }
            packageManager.setFullScreen(true);
            const labelStyle = 'width: 150px;font-size: 12px;font-weight: bold;flex-shrink:0';
            const rowStyle = 'display: flex;flex-direction: row;border-bottom: 1px solid rgba(0,0,0,0.05);padding: 10px';
            packageManager.innerHTML = `<div style="display:flex;flex-direction:column ;width:100%;max-width: 800px">
        <div style="display: flex;flex-direction: row;align-items: center">
            <button style="border: 1px solid rgba(0,0,0,0);padding:5px;background-color: unset" data-exit-button="true;">
     <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" class="ionicon" viewBox="0 0 512 512"><title>Arrow Back</title><path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="48" d="M244 400L100 256l144-144M120 256h292"/></svg>    
</button>
            <div style="flex-grow: 1;margin-left: 10px">${moduleName}</div>
        </div>
        <div style="${rowStyle}">
            <img src="${module.iconDataURI}" alt="${module.title}" width="32" height="32">
        </div>
        <div style="${rowStyle}">
            <div style="${labelStyle}">Title</div>
            <div >${module.title}</div>
        </div>
        <div style="${rowStyle}">
            <div style="${labelStyle}">Description</div>
            <div >${module.description}</div>
        </div>
        <div style="${rowStyle}">
            <div style="${labelStyle}">Author</div>
            <div >${module.author}</div>
        </div>
        <div style="${rowStyle}">
            <div style="${labelStyle}">Path</div>
            <div>${module.path}</div>
        </div>
        <div style="${rowStyle}">
            <div style="${labelStyle}">Version</div>
            <div>${module.version}</div>
        </div>
        <div style="${rowStyle}">
            <div style="${labelStyle}">Is Active</div>
            <div>${module.active}</div>
        </div>
        <div style="${rowStyle};align-items: center">
            <div style="${labelStyle}">Dependencies</div>
            <div style="display: flex;flex-direction: row;flex-wrap: wrap">${module.dependencies.map(dep => {
                return `<div style="border: 1px solid rgba(0,0,0,0.1);padding:5px;font-weight: bold;font-size: 12px;border-radius: 3px;background-color: white;margin-right: 5px">${dep}</div>`
            }).join('')}</div>
        </div>
        <div style="${rowStyle}">
            <div style="${labelStyle}">Installed On</div>
            <div style="font-size: 13px">${formatDate(module.installedOn)}</div>
        </div>
        <div style="${rowStyle}">
            <div style="${labelStyle}">Last modified on</div>
            <div style="font-size: 13px">${formatDate(module.lastModified)}</div>
        </div>
        <div style="${rowStyle}">
            <div style="${labelStyle}">Size</div>
            <div>${formatSize(module.size)}</div>
        </div>
        <div style="${rowStyle}">
            <div style="${labelStyle}">Navigate</div>
            <a href="#/${module.path}/${module.version}" data-link="true">/${module.path}/${module.version}</a>
        </div>
    </div>`

            packageManager.querySelector('[data-exit-button]')!.addEventListener('click', () => {
                resolve(true);
            })
            packageManager.querySelectorAll('[data-link]').forEach(e => e.addEventListener('click', () => {
                renderIcon(packageManager);
            }))
        })()
    })
}


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

const month = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
