import {saveAllModules} from "./moduleQuery";

export class MicroEndModuleLoader extends HTMLElement {

    constructor() {
        super();
        this.attachShadow({mode: 'open'});
        if (this.shadowRoot === null) {
            console.warn('[MicroEndModuleLoader]', 'shadowRoot is null, exiting function');
            return;
        }
        this.style.display = 'flex';
        this.style.flexDirection = 'column';
        this.style.fontFamily = 'arial';
        this.style.fontSize = '14px';
        this.style.border = '1px solid rgba(0,0,0,0.1)';
        this.shadowRoot.innerHTML = `<label style="display: flex;flex-direction: column;padding: 10px">
<div style="display: flex;flex-direction: row;align-items: center">
<span style="margin-right: 10px;font-size: 20px">📥</span><span>Install</span>
</div>
<input type="file" multiple accept="text/html" style="display: none">
</label>`;
        const input = this.shadowRoot.querySelector('input');
        if (input === null) {
            console.warn('[MicroEndModuleLoader]', 'Could not find input type file, exiting function');
            return;
        }
        input.addEventListener('change', this.onChange);
    }


    onChange = async (event: Event) => {
        if (event === null || event.target == null) {
            console.warn('[MicroEndModuleLoader]', 'Event on onChange parameter is null, exiting function');
            return;
        }
        const input = event.target as HTMLInputElement;
        if (input.files === null) {
            console.warn('[MicroEndModuleLoader]', 'Files from HTMLInputElement is null, exiting function');
            return;
        }
        const files: FileList = input.files;
        await saveAllModules(files);
        this.dispatchEvent(new CustomEvent('change'));
    };
}

