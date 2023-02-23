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
        const dependency = getMetaData('dependency', content)[0];
        const actions = getMetaData('action', content);
        const module: Module = {
            name: moduleName,
            path,
            version,
            dependency: (dependency ?? '').split(',').filter(s => s).map(s => s.trim()),
            srcdoc: content,
            actions
        }
        store.put(module);
    }
    tx.commit();
    db.close();
}

export async function removeModule(moduleName:string){
    const {db, tx, store} = await openTransaction("readwrite");
    store.delete(moduleName);
    tx.commit();
    db.close();
}

function getMetaData(metaName: string, htmlText: string): string[] {
    const result: string[] = [];
    let index = 0;
    do {
        const [value, endIndex] = scanText(metaName, htmlText, index);
        index = endIndex;
        if (value) {
            result.push(value);
        }
    } while (index >= 0);
    return result;
}

function scanText(metaName: string, htmlText: string, startingIndex: number): [string, number] {
    const indexOfContent = htmlText.indexOf(`name="${metaName}"`, startingIndex);
    if (indexOfContent < 0) {
        return ['', -1];
    }
    const startTagIndex = htmlText.substring(startingIndex, indexOfContent).lastIndexOf('<') + startingIndex;
    const endTagIndex = htmlText.substring(indexOfContent, htmlText.length).indexOf('>') + indexOfContent
    let dependency = '';
    if (startTagIndex >= 0 && endTagIndex > startTagIndex) {
        dependency = htmlText.substring(startTagIndex, endTagIndex).split('content="')[1].split('"')[0];
    }
    return [dependency, endTagIndex];
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
