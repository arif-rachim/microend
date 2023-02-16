import {openTransaction} from "./openTransaction";
import {Module} from "./Types";

export async function saveAllModules(files: FileList) {
    const contents = await Promise.all(Array.from(files).map(file => readFile(file)));
    const {db, tx, store} = await openTransaction("readwrite");

    for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const moduleName = file.name.split('.html')[0];
        const [path, version] = moduleName.split('@');
        const content = contents[i];
        const dependency = getMetaInformation('dependency', content);
        const params = getMetaInformation('params', content);

        const module: Module = {
            name: moduleName,
            path: path,
            version: version,
            dependency: dependency.split(',').map(s => s.trim()),
            params: params.split(',').map(s => s.trim()),
            srcdoc: content
        }
        store.put(module);
    }
    tx.commit();
    db.close();
}

function getMetaInformation(metaName: string, htmlText: string) {
    const indexOfContent = htmlText.indexOf(`name="${metaName}"`)
    const startTagIndex = htmlText.substring(0, indexOfContent).lastIndexOf('<');
    const endTagIndex = htmlText.substring(indexOfContent, htmlText.length).indexOf('>') + indexOfContent
    let dependency = '';
    if (startTagIndex >= 0 && endTagIndex > startTagIndex) {
        dependency = htmlText.substring(startTagIndex, endTagIndex).split('content="')[1].split('"')[0];
    }
    return dependency;
}


function readFile(file: File): Promise<string> {
    return new Promise((resolve) => {
        const reader = new FileReader();
        reader.addEventListener('load', async (event: ProgressEvent<FileReader>) => {
            resolve(event?.target?.result?.toString() || '');
        });
        reader.readAsText(file, 'utf-8');
    })
}
