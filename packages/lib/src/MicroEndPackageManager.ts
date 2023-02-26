import {deactivateModule, getAllModules, getModule, removeModule} from "./moduleQuery";
import {Module} from "./Types";

export class MicroEndPackageManager extends HTMLElement {

    debugMode: boolean;

    constructor() {
        super();
        this.style.boxSizing = 'border-box';
        this.style.display = 'flex';
        this.style.flexDirection = 'column';
        this.style.alignItems = 'center';
        this.style.fontFamily = 'arial';
        this.style.position = 'absolute';

        this.debugMode = this.getAttribute('debug') === 'true';

        this.renderIcon();
    }

    log = (...args: string[]) => {
        if (this.debugMode) {
            console.log('[MicroEndPackageManager]', ...args)
        }
    }

    renderPackageDetails = async (moduleName: string) => {
        const module: Module | false = await getModule(moduleName);
        if (module === false) {
            alert('Module does not exit ' + moduleName);
            return;
        }
        this.setFullScreen(true);
        const labelStyle = 'width: 150px;font-size: 13px;font-weight: bold';
        const rowStyle = 'display: flex;flex-direction: row;border-bottom: 1px solid rgba(0,0,0,0.05);padding: 10px';
        this.innerHTML = `<div style="display:flex;flex-direction:column ;width:100%;max-width: 800px">
        <div style="font-size: 22px;margin-bottom: 20px;margin-top: 10px;display: flex;flex-direction: row;align-items: center">
            <button style="border: 1px solid rgba(0,0,0,0.1);padding:5px 10px;border-radius: 5px;background-color: white;font-size:28px" data-exit-button="true;">🔙</button>
            <div style="flex-grow: 1;margin-left: 10px">${moduleName}</div>
        </div>
        <div style="${rowStyle}">
            <div style="${labelStyle}">Description</div>
            <div>${module.description}</div>
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
            <div style="${labelStyle}">Dependency</div>
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

        this.querySelector('[data-exit-button]')!.addEventListener('click', () => {
            this.renderPackageList();
        })
        this.querySelectorAll('[data-link]').forEach(e => e.addEventListener('click',() => {
            this.renderIcon();
        }))

    }

    renderIcon = () => {
        this.setFullScreen(false);
        this.innerHTML = `<div data-button-package="true" style="font-size: 40px">📦</div>`;
        this.querySelector('[data-button-package]')!.addEventListener('click', () => {
            this.renderPackageList().then();
        })
    }
    setFullScreen = (fullScreen: boolean) => {
        this.style.right = fullScreen ? 'unset' : '10px';
        this.style.top = fullScreen ? '0px':'unset';
        this.style.bottom = fullScreen ? 'unset':'10px';
        this.style.left = fullScreen ?'0px':'unset';
        this.style.width = fullScreen ?'100%':'unset';
        this.style.padding = fullScreen ?'10px':'unset';
        this.style.minHeight = fullScreen ?'100%':'unset';
        this.style.background = fullScreen ?'white':'unset';
        this.style.overflow = fullScreen ?'unset':'unset';
    }

    renderPackageList = async () => {
        this.setFullScreen(true);

        const allModules = await getAllModules();
        const modules = allModules.map(module => {
            return `<div style="display: flex;flex-direction:column;font-family: Arial;border:1px solid rgba(0,0,0,0.1);padding:10px;box-sizing: border-box;width: 300px;height:130px;border-radius: 5px;background-color: white;box-shadow: 0 0 5px -3px rgba(0,0,0,0.4);margin:5px">
    <div style="display: flex;flex-direction: row;margin-bottom: 10px;height: 100%">
        <div style="font-size: 18px;margin-right: 5px;box-sizing: border-box">
        </div>
        <div style="display: flex;flex-direction: column;box-sizing: border-box;">
            <div style="display: flex;flex-direction: row;align-items: flex-end;box-sizing: border-box;margin-bottom: 5px">
                <div style="font-size: 16px;margin-right: 5px;font-weight: bold">${module.path}</div>
                <div style="font-size: 12px;margin-bottom: 1px">${module.version}</div>
            </div>
            <div style="height:100%">
                ${module.description}
            </div>
        </div>
    </div>
    <div style="display: flex;flex-direction: row">
        <button data-button-details="true" data-module-name="${module.name}" style="margin-right: 10px;background-color: #f2f2f2;border:1px solid rgba(0,0,0,0.1);border-radius: 3px">
            <div>📂</div>
            <div>Details</div>
        </button>
        <button data-button-remove="true" data-module-name="${module.name}" style="background-color: #f2f2f2;border:1px solid rgba(0,0,0,0.1);border-radius: 3px">
            <div>🗑</div>
            <div>Remove</div>
        </button>
        <div style="flex-grow: 1"></div>
        <label style="display: flex;flex-direction: row;align-items: center">
            <div>Active</div>
            <input type="checkbox" ${module.active ? 'checked' : ''} data-module-name="${module.name}"/>
        </label>
    </div>
</div>`
        });

        this.innerHTML = `<div style="display:flex;flex-direction:column ;max-width: 1300px;width:100%">
<div style="font-size: 22px;margin-bottom: 20px;margin-top: 10px;display: flex;flex-direction: row;align-items: center">
  
    <button style="border: 1px solid rgba(0,0,0,0.1);padding:5px 10px;border-radius: 5px;background-color: white;font-size:28px" data-exit-button="true">🔙</button>
    <div style="flex-grow: 1;align-items: center">Installed Modules</div>
    <microend-moduleloader style="background-color: white;border-radius: 5px"></microend-moduleloader>
</div>

<div style="display: flex;box-sizing: border-box;flex-direction: row;flex-wrap: wrap;justify-content: center;">${modules.join('')}</div></div>`;

        this.querySelectorAll('[data-button-details]').forEach(element => {

            element.addEventListener('click', (event) => {

                if (event.currentTarget && event.currentTarget instanceof HTMLButtonElement) {
                    const moduleName = event.currentTarget.getAttribute('data-module-name');
                    if (moduleName) {
                        this.renderPackageDetails(moduleName);
                    }
                }
            });
        })

        this.querySelectorAll('[data-button-remove]').forEach(element => {
            element.addEventListener('click', (event) => {
                if (event.currentTarget && event.currentTarget instanceof HTMLButtonElement) {
                    const moduleName = event.currentTarget.getAttribute('data-module-name');
                    const result = prompt(`Please type "${moduleName}" to remove the module`);
                    if (moduleName && result === moduleName) {
                        removeModule(moduleName).then(() => {
                            this.renderPackageList();
                        });
                    }
                }
            })
        });

        this.querySelector('microend-moduleloader')!.addEventListener('change', (event) => {
            this.renderPackageList();
        });

        this.querySelectorAll('[type="checkbox"]').forEach(element => {
            element.addEventListener('change', async (event) => {
                const moduleName = (event.target! as HTMLInputElement).getAttribute('data-module-name');
                await deactivateModule(moduleName!, !(event.target! as HTMLInputElement).checked);
                this.renderPackageList();
            })
        });
        this.querySelector('[data-exit-button]')!.addEventListener('click', () => {
            this.renderIcon()
        })
    }

    connectedCallback() {

    }

    disconnectedCallback() {

    }
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