import {Handler} from "./Handler";
import {access, mkdir, readdir, readFile, stat, writeFile} from "fs/promises";
import {constants} from "fs";
import p from "path";


const REPO_NAME = 'repo';
type Latest = string
export type Registry = { [k: string]: { latest: Latest, version: { [k: string | Latest]: Module } } }

export interface Module {
    name: string;
    description: string;
    dependencies: string[],
    version: string,
    size: number,
    lastModified: number,
    author: string
}

let registryCache: Registry | null = null;

async function getRegistry(useCache: boolean = true): Promise<Registry> {
    if (useCache === false) {
        registryCache = null;
    }
    if (registryCache !== null) {
        return registryCache;
    }
    let registry: Registry | null = null;
    let canAccessFolder = false
    try {
        await access(REPO_NAME, constants.R_OK)
        canAccessFolder = true;
    } catch (err) {
        if (err.code === 'ENOENT') {
            console.log('Folder does not exist creating folder ', REPO_NAME);
            await mkdir(REPO_NAME);
            await access(REPO_NAME, constants.R_OK)
            canAccessFolder = true
        }
    }
    if (!canAccessFolder) {
        return {};
    }
    const files = await readdir(REPO_NAME);
    registry = {};
    for (const file of files) {
        const moduleFiles: string[] = await readdir(p.join(REPO_NAME, file));
        let latestVersion: { version: string, lastModified: number } = {version: '', lastModified: 0}
        registry[file] = registry[file] || {latest: '', version: {}};
        for (const moduleFile of moduleFiles) {
            const filePath = p.join(REPO_NAME, file, moduleFile)
            const status = await stat(filePath);
            const content = await readFile(filePath, {encoding: 'utf-8'});
            const module = contentMeta(content, {size: status.size, lastModified: status.birthtimeMs})
            if (latestVersion.lastModified < status.birthtimeMs) {
                latestVersion.lastModified = status.birthtimeMs;
                latestVersion.version = module.version;
            }
            registry[file].version[module.version] = module;
        }
        registry[file].latest = latestVersion.version;
    }
    return registry;
}

export function contentMeta(content: string, file: { size: number, lastModified: number }) {
    const moduleName = getMetaData('module', content)[0];
    const dependency = getMetaData('dependency', content)[0];
    const description = getMetaData('description', content)[0];
    const author = getMetaData('author', content)[0];
    const [path, version] = moduleName.split('@');
    // maybe we need to have the available queryParams and available service
    const module: Module = {
        name: moduleName,
        version,
        dependencies: (dependency ?? '').split(',').filter(s => s).map(s => s.trim()),
        size: file.size,
        lastModified: file.lastModified,
        description,
        author
    }
    return module;
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


export async function saveRegistry(modules: (Module & { srcdoc: string })[]) {
    for (const module of modules) {
        // here we need to validate if all registry is available !
        const [path, version] = module.name.split('@');
        const directory = p.join(REPO_NAME, path);
        await mkdir(directory, {recursive: true})
        await writeFile(p.join(directory, module.name + '.html'), module.srcdoc, {encoding: 'utf-8'})

    }
}

export async function getAllModules() {
    const registry: Registry = await getRegistry();
    const modules: Module[] = Object.keys(registry).map(registryKey => {
        const latest: Latest = registry[registryKey].latest;
        const module: Module = registry[registryKey].version[latest];
        return module
    });
    return modules;
}

export async function getModule(name: string) {
    let moduleName = name;
    let moduleVersion = '';
    if (name.indexOf('@') > 0) {
        const [modName,modVersion] = name.split('@');
        moduleName = modName;
        moduleVersion = modVersion;
    }
    const registry: Registry = await getRegistry();
    const moduleInfo = registry[moduleName];
    if(moduleVersion){
        return moduleInfo.version[moduleVersion];
    }
    return moduleInfo;
}

export const moduleHandler: Handler = async (params, resolve) => {
    const moduleName = params.moduleName;
    if (moduleName) {
        const module = await getModule(moduleName);
        resolve(module);
    } else {
        const modules = await getAllModules();
        resolve(modules);
    }
}

export const moduleContentHandler: Handler = async (params, resolve) => {
    const moduleName = params.moduleName;
    const module = moduleName.split('@')[0];
    const content = await readFile(p.join(REPO_NAME,module,`${moduleName}.html`),{encoding:"utf-8"});
    resolve(content);
}