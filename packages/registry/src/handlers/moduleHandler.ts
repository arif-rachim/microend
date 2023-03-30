import {Handler} from "./Handler";
import {access, mkdir, readdir, readFile, stat, writeFile} from "fs/promises";
import {constants} from "fs";
import p from "path";
import {ContentInfo, parseContentInfo} from "@microend/utils";


const REPO_NAME = 'repo';
type Latest = string
export type Registry = { [k: string]: { latest: Latest, version: { [k: string | Latest]: ContentInfo } } }

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
            const module = parseContentInfo(content);

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


export async function saveRegistry(modules: (ContentInfo & { srcdoc: string })[]) {
    for (const module of modules) {

        const directory = p.join(REPO_NAME, module.path);
        await mkdir(directory, {recursive: true})
        await writeFile(p.join(directory, module.name + '.html'), module.srcdoc, {encoding: 'utf-8'})

    }
}

export async function getAllModules() {
    const registry: Registry = await getRegistry();
    const modules: ContentInfo[] = Object.keys(registry).map(registryKey => {
        const latest: Latest = registry[registryKey].latest;
        const module: ContentInfo = registry[registryKey].version[latest];
        return module
    });
    return modules;
}

export async function getModule(name: string) {
    let moduleName = name;
    let moduleVersion = '';
    if (name.indexOf('@') > 0) {
        const [modName, modVersion] = name.split('@');
        moduleName = modName;
        moduleVersion = modVersion;
    }
    const registry: Registry = await getRegistry();
    const moduleInfo = registry[moduleName];
    if (moduleVersion) {
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
    const content = await readFile(p.join(REPO_NAME, module, `${moduleName}.html`), {encoding: "utf-8"});
    resolve(content);
}