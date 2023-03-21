import {Module, ModuleSource} from "./Types";
import {openTransaction} from "./openTransaction";
import {showModal} from "./showModal";
import {nanoid} from "nanoid";

export async function getAllModules(): Promise<Module[]> {
    const [db, tx, store] = await openTransaction('readonly', 'module');
    const request = store.getAll();
    const result = await forRequest<Module[]>(request);
    if (result === false) {
        db.close();
        return [];
    }
    const response = result.filter(m => !m.deleted);
    db.close();
    return response;
}

export async function getModuleSource(moduleSourceId: string): Promise<ModuleSource> {
    const [db, tx, store] = await openTransaction('readonly', 'module-source');
    const request = store.get(moduleSourceId);
    const result = await forRequest<ModuleSource>(request);
    if (result === false) {
        db.close();
        throw new Error('Unable to find module-source ' + moduleSourceId);
    }
    db.close();
    return result;
}

export async function getModule(moduleName: string): Promise<Module | false> {
    const [db, tx, store] = await openTransaction("readonly", 'module');
    const request = store.get(moduleName);
    const data = await forRequest<Module>(request)
    db.close();
    return data;
}

async function findAndUpdateMissingDependencies(modules: Module[], allInstalledModules: Module[]): Promise<string[]> {
    const allModules = allInstalledModules.concat(modules);
    return modules.reduce((totalMissingDependencies: string[], m) => {
        const missingDependencies: string[] = m.dependencies.reduce((missingDependencies: string[], dependency) => {
            const indexOfDependency = allModules.findIndex(m => {
                const [path, version] = dependency.split('@');
                return m.path === path && m.version >= version;
            });
            if (indexOfDependency < 0) {
                missingDependencies.push(dependency);
            }
            return missingDependencies;
        }, []);
        m.missingDependencies = missingDependencies;
        if (missingDependencies.length > 0) {
            m.active = false;
        }
        return totalMissingDependencies.concat(missingDependencies);
    }, []);
}

async function findModulesToBeUpgrade(modules: Module[], allInstalledModules: Module[]) {
    return modules.reduce((result: { from: string, to: string }[], m) => {
        const modulesToBeUpgraded: { from: string, to: string }[] = allInstalledModules.filter(installed => {
            return installed.path === m.path && m.version > installed.version
        }).map(s => ({
            from: s.name,
            to: m.name
        }));
        return result.concat(modulesToBeUpgraded);
    }, []);

}

const validate = (value: any, errors: string[], message: string) => (value === undefined || value === null || value === '') && errors.push(message)
const versionIsValid = (version: string) => version.split('.').reduce((isNumber, number) => parseInt(number) >= 0 && isNumber, true)
const validateVersioning = (value: string, errors: string[], message: string) => ((value.split('@').filter(s => s).length !== 2) || (!versionIsValid(value.split('@')[1]))) && errors.push(message);

async function validateModules(files: FileList) {
    const contents = await Promise.all(Array.from(files).map(file => readFile(file)));
    const errors: string[] = Array.from(files).map((file, index) => {
        const content = contents[index];
        const missingRequiredMeta: string[] = [];
        const versioningIssue: string[] = [];
        const moduleName = getMetaData('module', content)[0];
        const dependency = getMetaData('dependency', content)[0];
        const description = getMetaData('description', content)[0];
        const author = getMetaData('author', content)[0];
        const icon = getMetaData('icon', content)[0];
        const title = getTagContent('title', content);


        validate(moduleName, missingRequiredMeta, 'module');
        validate(description, missingRequiredMeta, 'description');
        validate(author, missingRequiredMeta, 'author');
        validate(title, missingRequiredMeta, 'title');
        validate(icon, missingRequiredMeta, 'icon');
        validateVersioning(moduleName ?? '', versioningIssue, `${moduleName}(module)`);
        if (dependency) {
            const dependencies = dependency.split(',').filter(s => s).map(s => s.trim());
            dependencies.forEach(dep => {
                validateVersioning(dep, versioningIssue, `${dep}`)
            })
        }
        const errors = [];
        if (missingRequiredMeta.length > 0) {
            errors.push(`Missing ${missingRequiredMeta.map(meta => `<span style="font-weight: bold;margin:0 5px">"${meta}"</span>`).join(', ')}`);
        }
        if (versioningIssue.length > 0) {
            errors.push(`Version error ${versioningIssue.map(version => `<span style="font-weight: bold;margin:0 5px">"${version}"</span>`).join(', ')}`)
        }
        if (errors.length > 0) {
            return `<div style="flex-direction: row;flex-wrap: wrap;margin-bottom: 10px">${file.name + ' : ' + errors.join(' ')}</div>`
        }
        return ''
    }).filter(s => s);
    return {contents, errors};
}

export function contentMeta(content: string, file: { size: number, lastModified: number }) {
    const moduleName = getMetaData('module', content)[0];
    const dependency = getMetaData('dependency', content)[0];
    const description = getMetaData('description', content)[0];
    const author = getMetaData('author', content)[0];
    const iconDataURI = getMetaData('icon', content)[0];
    const title = getTagContent('title', content);
    const [path, version] = moduleName.split('@');
    const id = nanoid();
    // maybe we need to have the available queryParams and available service
    const module: Module = {
        name: moduleName,
        path,
        version,
        dependencies: (dependency ?? '').split(',').filter(s => s).map(s => s.trim()),
        missingDependencies: [],
        installedOn: new Date().getTime(),
        size: file.size,
        lastModified: file.lastModified,
        description,
        active: true,
        deleted: false,
        author,
        moduleSourceId: id,
        title,
        iconDataURI
    }

    const moduleSource: ModuleSource = {
        id,
        srcdoc: content
    }

    return {module, moduleSource};
}

export async function saveAllModules(files: FileList) {
    const {contents, errors} = await validateModules(files);
    if (errors.length > 0) {
        const result = await showModal(`<div style="font-family: Arial">
<div style="margin-bottom: 10px;font-weight: bold">Errors: </div>
${errors.map(error => error).join('')}
</div>`, 'Ok');
        return;
    }
    const modulesSource: { module: Module, moduleSource: ModuleSource }[] = Array.from(files).map((file, index) => {
        const content = contents[index];
        const {module, moduleSource} = contentMeta(content, file);
        return {module, moduleSource};
    });
    const modules = modulesSource.map(m => m.module);
    // here we need to perform some validation
    const allInstalledModules = await getAllModules();
    const missingDependencies: string[] = await findAndUpdateMissingDependencies(modules, allInstalledModules);
    const modulesToBeUpgrade: { from: string, to: string }[] = await findModulesToBeUpgrade(modules, allInstalledModules);

    const result = await showModal(`<div style="font-family: Arial">
<div>The modules listed below will be installed. :</div>
<div style="display: flex;flex-direction: row;flex-wrap: wrap">${modules.map(dep => {
        return `<div style="padding: 5px;border: 1px solid rgba(0,0,0,0.1);border-radius: 5px;color: white;background-color:darkslateblue;margin-right: 5px;margin-bottom: 5px">${dep.name}</div>`
    }).join('')}</div>
${missingDependencies.length > 0 ? (() => {
        return `
    <div style="margin-top: 10px;">The dependent modules listed below are unavailable. :</div>
    <div style="display: flex;flex-direction: row;flex-wrap: wrap">${missingDependencies.map(dep => {
            return `<div style="padding: 5px;border: 1px solid rgba(0,0,0,0.1);border-radius: 5px;color: white;background-color: darkred;margin-right: 5px;margin-bottom: 5px">${dep}</div>`
        }).join('')}</div>
    `
    })() : ''}
${modulesToBeUpgrade.length > 0 ? (() => {
        return `
    <div style="margin-top: 10px">The modules listed below will be upgraded. :</div>
    <div style="display: flex;flex-direction: row;flex-wrap: wrap">${modulesToBeUpgrade.map(dep => {
            return `<div style="padding: 5px;border: 1px solid rgba(0,0,0,0.1);border-radius: 5px;color: white;background-color: green;margin-right: 5px;margin-bottom: 5px">${dep.from} ➡ ${dep.to}</div>`
        }).join('')}</div>
    `
    })() : ''}


<div style="margin-top: 10px">Are you certain that you wish to continue?</div>
</div>`, 'Yes', 'No');

    // 1. are all dependency available in the modules that going to be installed
    // 2. if dependency is not available then the active flag is false [ok]
    // 3. does the old modules can be upgraded
    // 4. we need to fix the routing mechanism
    if (result === 'No') {
        return;
    }

    const [db, tx, moduleStore, sourceStore] = await openTransaction("readwrite", ["module", "module-source"]);

    modulesToBeUpgrade.forEach(toBeUpgraded => {
        const module = allInstalledModules.find(s => s.name === toBeUpgraded.from)!;
        module.deleted = true;
        module.active = false;
        moduleStore.put(module);
    })
    modules.forEach(module => {
        moduleStore.put(module);
        const source = modulesSource.find(s => s.module.moduleSourceId === module.moduleSourceId);

        if (source !== undefined) {
            sourceStore.put(source.moduleSource)
        }
    })
    tx.commit();
    db.close();
    window.location.reload();
}

export async function removeModule(moduleName: string) {
    const [db, tx, store] = await openTransaction("readwrite", "module");
    const module = await forRequest<Module>(store.get(moduleName));
    if (module) {
        module.deleted = true;
        store.put(module);
        tx.commit();
    }
    db.close();
}

function forRequest<T>(request: IDBRequest): Promise<T | false> {
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

export async function deactivateModule(moduleName: string, deactivate: boolean) {
    const [db, tx, store] = await openTransaction("readwrite", "module");
    const request = store.get(moduleName);
    const data = await forRequest<Module>(request)
    if (data === false) {
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

function getTagContent(tagName: string, htmlText: string) {
    const startTag = `<${tagName}>`;
    const endTag = `</${tagName}>`;
    if (htmlText.indexOf(startTag) < 0) {
        return '';
    }
    const startIndex = htmlText.indexOf(startTag) + startTag.length;
    const endIndex = htmlText.indexOf(endTag, startIndex);
    return htmlText.substring(startIndex, endIndex);
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
