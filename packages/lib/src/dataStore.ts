import {AppContext, Module, ModuleSource} from "./Types";
import {openTransaction} from "./openTransaction";
import {showModal} from "./showModal";
import {nanoid} from "nanoid";
import {satisfies, validate as validVersion,} from "compare-versions";
import {ContentInfo, parseContentInfo} from "@microend/utils";

export async function getAllModules(): Promise<Module[]> {
    const [db, tx, store] = await openTransaction('readonly', 'module');
    const request = store.getAll();
    const result = await forRequest<Module[]>(request);
    if (result === false) {
        tx.commit();
        db.close();
        return [];
    }
    const response = result.filter(m => !m.deleted);
    tx.commit();
    db.close();
    return response;
}

export async function getModuleSource(moduleSourceId: string): Promise<ModuleSource> {
    const [db, tx, store] = await openTransaction('readonly', 'module-source');
    const request = store.get(moduleSourceId);
    const result = await forRequest<ModuleSource>(request);
    if (result === false) {
        tx.commit();
        db.close();
        throw new Error('Unable to find module-source ' + moduleSourceId);
    }
    tx.commit();
    db.close();
    return result;
}

export async function getModule(moduleName: string): Promise<Module | false> {
    const [db, tx, store] = await openTransaction("readonly", 'module');
    const request = store.get(moduleName);
    const data = await forRequest<Module>(request)
    tx.commit();
    db.close();
    return data;
}

const APP_CONTEXT_ID = 'app-context-id';

export async function getAppContext(): Promise<AppContext | false> {
    const [db, tx, store] = await openTransaction("readonly", 'app-context');
    const request = store.get(APP_CONTEXT_ID);
    const data = await forRequest<AppContext>(request)
    tx.commit();
    db.close();
    return data;
}

export async function saveAppContext(context: Partial<AppContext>): Promise<AppContext> {
    const [db, tx, store] = await openTransaction("readwrite", 'app-context');
    const request = store.get(APP_CONTEXT_ID);
    let appContext = await forRequest<AppContext>(request)
    if (!appContext || !('id' in appContext)) {
        appContext = {id: APP_CONTEXT_ID, homeModule: ''};
    }
    appContext = ({...appContext, ...context});
    await store.put(appContext)
    tx.commit();
    db.close();
    return appContext;
}

async function findAndUpdateMissingDependencies(modules: Module[], allInstalledModules: Module[]): Promise<string[]> {
    const allModules = allInstalledModules.concat(modules);
    return modules.reduce((totalMissingDependencies: string[], m) => {
        const missingDependencies: string[] = m.dependencies.reduce((missingDependencies: string[], dependency) => {
            const indexOfDependency = allModules.findIndex(m => {
                const [path, version] = dependency.split('@').filter(s => s);
                if (version === '*' && path === '*') {
                    return true;
                }
                if (m.path === path) {
                    console.log('satisfies', m.version, version, satisfies(m.version, version));
                }

                return m.path === path && satisfies(m.version, version);
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

const validateVersioning = (value: string, errors: string[], message: string) => {
    const versioning = value.split('@').filter(s => s);
    if (versioning.length !== 2) {
        errors.push(message);
        return;
    }
    const semver = versioning[1];
    if (semver !== '*' && !validVersion(semver)) {
        errors.push(message);
        return;
    }
}


async function validateModules(contents: string[]) {

    const errors: string[] = contents.map((content) => {

        const missingRequiredMeta: string[] = [];
        const versioningIssue: string[] = [];
        const {name, description, author, iconDataURI, visibleInHomeScreen, title,dependencies} = parseContentInfo(content);

        validate(name, missingRequiredMeta, 'name');
        validate(description, missingRequiredMeta, 'description');
        validate(author, missingRequiredMeta, 'author');
        validate(title, missingRequiredMeta, 'title');
        validate(iconDataURI, missingRequiredMeta, 'iconDataURI');
        validate(visibleInHomeScreen, missingRequiredMeta, 'visibleInHomeScreen');

        validateVersioning(name ?? '', versioningIssue, `${name}(module)`);
        if (dependencies) {
            dependencies.forEach(dep => {
                // we can't enable following we must create proper validation against >1.0.0 ^1.0.0 ~1.0.0
                // validateVersioning(dep, versioningIssue, `${dep}`)
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
            return `<div style="flex-direction: row;flex-wrap: wrap;margin-bottom: 10px">${name + ' : ' + errors.join(' ')}</div>`
        }
        return ''
    }).filter(s => s);

    return {errors};
}

export function contentMeta(content: string) {
    const contentInfo: ContentInfo = parseContentInfo(content);

    const id = nanoid();
    // maybe we need to have the available queryParams and available service
    const module: Module = {
        ...contentInfo,
        moduleSourceId: id,
        missingDependencies: [],
        installedOn: new Date().getTime(),
        lastModified: new Date().getTime(),
        active: true,
        deleted: false,
    }

    const moduleSource: ModuleSource = {
        id,
        srcdoc: content
    }

    return {module, moduleSource};
}

export async function saveAllModules(files: FileList) {
    const contents = await Promise.all(Array.from(files).map(file => readFile(file)));
    await saveModuleCodes({contents, autoAccept: false, skipIfItsAlreadyInstalled: false});
}

export async function saveModuleCodes(props: { contents: string[], autoAccept: boolean, skipIfItsAlreadyInstalled: boolean }) {
    const {contents, autoAccept, skipIfItsAlreadyInstalled} = props;
    const {errors} = await validateModules(contents);
    if (errors.length > 0) {
        await showModal(`<div style="font-family: Arial,serif"><div style="margin-bottom: 10px;font-weight: bold">Errors: </div>${errors.map(error => error).join('')}</div>`, 'Ok');
        return;
    }
    let modulesSource: { module: Module, moduleSource: ModuleSource }[] = contents.map((content, index) => {
        const {module, moduleSource} = contentMeta(content);
        return {module, moduleSource};
    });

    // here we need to perform some validation
    const allModules = await getAllModules();

    if (skipIfItsAlreadyInstalled) {
        modulesSource = modulesSource.filter(m => {
            return allModules.find(installedModule => installedModule.name === m.module.name) === undefined;
        });
    }
    if (modulesSource.length === 0) {
        return;
    }
    const modules = modulesSource.map(m => m.module);
    const allInstalledModules = allModules.filter(m => m.active && !m.deleted);
    const missingDependencies: string[] = await findAndUpdateMissingDependencies(modules, allInstalledModules);
    const modulesToBeUpgrade: { from: string, to: string }[] = await findModulesToBeUpgrade(modules, allInstalledModules);
    let result = 'Yes';
    if (!autoAccept) {
        result = await showModal(`<div style="font-family: Arial,sans-serif">
<div>The modules listed below will be installed. :</div>
<div style="display: flex;flex-direction: row;flex-wrap: wrap">${modules.map(dep => {
            return `<div style="padding:0px 5px;border: 1px solid rgba(0,0,0,0.1);border-radius: 5px;color: white;background-color:darkslateblue;margin-right: 5px;margin-bottom: 5px">${dep.name}</div>`
        }).join('')}</div>
${missingDependencies.length > 0 ? (() => {
            return `
    <div style="margin-top: 5px;">The dependent modules listed below are unavailable. :</div>
    <div style="display: flex;flex-direction: row;flex-wrap: wrap">${missingDependencies.map(dep => {
                return `<div style="padding:0px 5px;border: 1px solid rgba(0,0,0,0.1);border-radius: 5px;color: white;background-color: darkred;margin-right: 5px;margin-bottom: 5px">${dep}</div>`
            }).join('')}</div>
    `
        })() : ''}
${modulesToBeUpgrade.length > 0 ? (() => {
            return `
    <div style="margin-top: 5px">The modules listed below will be upgraded. :</div>
    <div style="display: flex;flex-direction: row;flex-wrap: wrap">${modulesToBeUpgrade.map(dep => {
                return `<div style="padding:0px 5px;border: 1px solid rgba(0,0,0,0.1);border-radius: 5px;color: white;background-color: green;margin-right: 5px;margin-bottom: 5px">${dep.from} ➡ ${dep.to}</div>`
            }).join('')}</div>
    `
        })() : ''}


<div style="margin-top: 5px">Are you certain that you wish to continue?</div>
</div>`, 'Yes', 'No');
    }


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
    if (!autoAccept) {
        const response = await showModal(`<div style="font-family: Arial,serif">
<div>Module(s) were succesfully installed</div>
${errors.map(error => error).join('')}
</div>`, 'Ok');
        window.location.reload();
    }
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
        request.addEventListener('error', () => {
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


function readFile(file: File): Promise<string> {
    return new Promise((resolve) => {
        const reader = new FileReader();
        reader.addEventListener('load', async (event: ProgressEvent<FileReader>) => {
            resolve(event?.target?.result?.toString() || '');
        });
        reader.readAsText(file, 'utf-8');
    })
}
