import {getAllModules} from "./getAllModules";
import {removeModule} from "./saveAllModules";

export class MicroEndPackageManager extends HTMLElement {

    debugMode: boolean;

    constructor() {
        super();
        this.style.boxSizing = 'border-box';
        this.style.display = 'flex';
        this.style.flexDirection = 'column';
        this.style.alignItems = 'center';
        this.style.fontFamily = 'arial';
        this.style.backgroundColor = '#f2f2f2';
        this.debugMode = this.getAttribute('debug') === 'true';
        this.render().then();
    }

    log = (...args: string[]) => {
        if (this.debugMode) {
            console.log('[MicroEndPackageManager]', ...args)
        }
    }

    render = async () => {
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
                This is the description of the package
            </div>
            
        </div>
    </div>
    <div style="display: flex;flex-direction: row">
        <button data-button-remove="true" data-module-name="${module.name}">Remove</button>
        <div style="flex-grow: 1"></div>
        <label style="display: flex;flex-direction: row">
        <div>Active</div>
        <input type="checkbox" />
        </label>
    </div>
</div>`
        })
        this.innerHTML = `<div style="font-size: 22px">Installed Modules</div><div style="display: flex;box-sizing: border-box;flex-direction: row;flex-wrap: wrap;justify-content: center;max-width: 1200px">${modules.join('')}</div>`
        this.querySelectorAll('[data-button-remove]').forEach(element => {
            element.addEventListener('click',(event) => {
                if(event.target && event.target instanceof HTMLButtonElement){
                    const moduleName = event.target.getAttribute('data-module-name');
                    const result = prompt(`Please type "${moduleName}" to remove the module`);
                    if(moduleName && result === moduleName){
                        removeModule(moduleName).then(() => {
                            this.render();
                        });
                    }
                }
            })
        })
    }

    connectedCallback() {

    }

    disconnectedCallback() {

    }
}