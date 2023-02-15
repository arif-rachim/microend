import {DATABASE_NAME, TABLE_MODULE_NAME} from "./MicroEndRouter";


export class MicroEndModuleLoader extends HTMLElement {

    constructor() {
        super();
        this.attachShadow({mode: 'open'});
        if (this.shadowRoot === null) {
            console.warn('[MicroEndModuleLoader]', 'shadowRoot is null, exiting function');
            return;
        }
        this.shadowRoot.innerHTML = `<input type="file" >`;
        const input = this.shadowRoot.querySelector('input');
        if (input === null) {
            console.warn('[MicroEndModuleLoader]', 'Could not find input type file, exiting function');
            return;
        }
        input.addEventListener('change', this.onChange);
    }


    onChange = (event: Event) => {
        if (event === null || event.target == null) {
            console.warn('[MicroEndModuleLoader]', 'Event on onChange parameter is null, exiting function');
            return;
        }
        const input = event.target as HTMLInputElement;
        if (input.files === null) {
            console.warn('[MicroEndModuleLoader]', 'Files from HTMLInputElement is null, exiting function');
            return;
        }
        const file = input.files[0];
        const reader = new FileReader();
        const moduleName = file.name.split('.html')[0];
        const [path, version] = moduleName.split('@');

        reader.addEventListener('load', (event: ProgressEvent<FileReader>) => {
            if (event.target === null) {
                console.warn('[MicroEndModuleLoader]', 'unable to find target of reader to read file, exiting function');
                return;
            }
            const content = event.target.result as string;
            const dependency = this.getMetaInformation('dependency', content);
            const params = this.getMetaInformation('params', content);
            const req = indexedDB.open(DATABASE_NAME, 1)
            req.addEventListener('upgradeneeded', () => {
                const db = req.result;
                db.createObjectStore(TABLE_MODULE_NAME, {keyPath: 'name'});
            });
            req.addEventListener('success', () => {
                const db = req.result;
                const tx = db.transaction([TABLE_MODULE_NAME], 'readwrite');
                const moduleTable = tx.objectStore(TABLE_MODULE_NAME);
                moduleTable.put({
                    name: moduleName,
                    path: path,
                    version: version,
                    dependency: dependency.split(',').map(s => s.trim()),
                    params: params.split(',').map(s => s.trim()),
                    srcdoc: content
                });
                db.close();
            });
        });
        reader.readAsText(file, 'utf-8');
    };

    getMetaInformation = (metaName: string, htmlText: string) => {
        const indexOfContent = htmlText.indexOf(`name="${metaName}"`)
        const startTagIndex = htmlText.substring(0, indexOfContent).lastIndexOf('<');
        const endTagIndex = htmlText.substring(indexOfContent, htmlText.length).indexOf('>') + indexOfContent
        let dependency = '';
        if (startTagIndex >= 0 && endTagIndex > startTagIndex) {
            dependency = htmlText.substring(startTagIndex, endTagIndex).split('content="')[1].split('"')[0];
        }
        return dependency;
    }
}