import {Handler} from "./Handler";
import {getAllModules, Module, saveRegistry} from "./moduleHandler";

interface ClientModule extends Module {
    path: string// = "fault"
    missingDependencies: string[]// = Array(0) []
    installedOn: number// = 1678363261085
    active: boolean// = true
    deleted: boolean// = false
    srcdoc: string// = "<!DOCTYPE html>\n<html lang="en">\n<head>\n <meta charset="UTF-8">\n <title>Fault Management</title>\n <meta content="fault@0.0.3" name="module">\n <meta content="identity@0.0.2" name="dependency">\n <meta content="Fault management component" name="description">\n <meta content="a.arif.r@gmail.com" name="author">\n</head>\n<body>\n<h1>This is fault managmeent</h1>\n<div id="content"></div>\n<button id="navigateBack">Navigate back baby</button>\n<button id="fetchIdentity">FetchIdentity</button>\n</body>\n</html>\n<script>\n if (me) {\n const {onParamsChange, onFocusChange} = me;\n onParamsChange((newValue, oldValue) => {\n document.getElementById('content').innerHTML = JSON.stringify(me.params);\n });\n onFocusChange(() => {\n console.log('Fault is focused context', me.params);\n return () => {\n console.log('Fault is lost focused', me.params);\n }\n })\n const {params, navigateBack, navigateTo}"... (length: 1,554)
}

export const uploadPostHandler: Handler = async (params, resolve) => {
    const modules: ClientModule[] = params.body;
    const allInstalledModules = await getAllModules();
    const missingDependencies = findAndUpdateMissingDependencies({modules, allInstalledModules});
    if (missingDependencies.length > 0) {
        resolve({error: missingDependencies});
        return;
    }
    await saveRegistry(modules);
    resolve({message: 'OK'});
}

function findAndUpdateMissingDependencies(props: { modules: Module[], allInstalledModules: Module[] }): { module: string, missingDependencies: string[] }[] {
    const {modules, allInstalledModules} = props;
    const allModules = allInstalledModules.concat(modules);
    return modules.reduce<{ module: string, missingDependencies: string[] }[]>((totalMissingDependencies: { module: string, missingDependencies: string[] }[], m) => {
        const missingDependencies: string[] = m.dependencies.reduce((missingDependencies: string[], dependency) => {
            const indexOfDependency = allModules.findIndex(m => {
                const [path, version] = dependency.split('@');
                const [modulePath] = m.name.split('@');
                return modulePath === path && m.version >= version;
            });
            if (indexOfDependency < 0) {
                missingDependencies.push(dependency);
            }
            return missingDependencies;
        }, []);
        if (missingDependencies.length > 0) {
            totalMissingDependencies.push({module: m.name, missingDependencies})
        }
        return totalMissingDependencies;
    }, []);
}