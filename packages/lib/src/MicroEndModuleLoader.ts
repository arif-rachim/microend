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
        this.shadowRoot.innerHTML = `<label style="display: flex;flex-direction: column;padding:7px 10px">
<div style="display: flex;flex-direction: row;align-items: center">
<svg xmlns="http://www.w3.org/2000/svg" class="ionicon" width="26" height="26" viewBox="0 0 512 512"><title>Add</title><path d="M448 256c0-106-86-192-192-192S64 150 64 256s86 192 192 192 192-86 192-192z" fill="none" stroke="currentColor" stroke-miterlimit="10" stroke-width="32"/><path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="32" d="M256 176v160M336 256H176"/></svg>
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

