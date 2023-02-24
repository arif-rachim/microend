import {Module} from "./Types";
import {openTransaction} from "./openTransaction";

export async function getAllModules(): Promise<Module[]> {
    const {db, tx, store} = await openTransaction('readonly');
    const request = store.getAll();
    const result = await forRequest<Module[]>(request);
    if(result === false){
        db.close();
        return [];
    }
    return result;
}

export async function getModule(moduleName:string):Promise<Module|false>{
    const {db, store} = await openTransaction("readonly");
    const request = store.get(moduleName);
    const data = await forRequest<Module>(request)
    db.close();
    return data;
}

export async function saveAllModules(files: FileList) {
    const contents = await Promise.all(Array.from(files).map(file => readFile(file)));
    const modules:Module[] = Array.from(files).map((file,index) => {
        const moduleName = file.name.split('.html')[0];
        const [path, version] = moduleName.split('@');
        const content = contents[index];
        const dependency = getMetaData('dependency', content)[0];
        const description = getMetaData('description', content)[0];
        // maybe we need to have the available queryParams and available service
        const module: Module = {
            name: moduleName,
            path,
            version,
            dependency: (dependency ?? '').split(',').filter(s => s).map(s => s.trim()),
            srcdoc: content,
            installedOn : new Date().getTime(),
            size:file.size,
            lastModified:file.lastModified,
            description,
            active:true
        }
        return module;
    });

    // first we need to create default routing mechanism when we are fetching the route !

    // here we need to perform some validation
    // 1. are all dependency available in the modules that going to be installed
    // 2. if dependency is not available then the active flag is false
    // 3. does the old modules can be upgraded
    // 4. we need to fix the routing mechanism


    const {db, tx, store} = await openTransaction("readwrite");
    modules.forEach(module => {
        store.put(module);
    })
    tx.commit();
    db.close();
}

export async function removeModule(moduleName:string){
    const {db, tx, store} = await openTransaction("readwrite");
    store.delete(moduleName);
    tx.commit();
    db.close();
}

function forRequest<T>(request:IDBRequest):Promise<T|false>{
    return new Promise((resolve) => {
        request.addEventListener('success', () => {
            const data: T = request.result;
            resolve(data);
        });
        request.addEventListener('error', (error) => {
            resolve(false);
        })
    })
}

export async function deactivateModule(moduleName:string,deactivate:boolean){
    const {db, tx, store} = await openTransaction("readwrite");
    const request = store.get(moduleName);
    const data = await forRequest<Module>(request)
    if(data === false){
        db.close();
        return;
    }
    data.active = !deactivate;
    store.put(data);
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
