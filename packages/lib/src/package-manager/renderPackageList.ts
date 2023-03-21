import {deactivateModule, getAllModules, removeModule} from "../moduleQuery";
import {MicroEndPackageManager} from "./MicroEndPackageManager";
import {renderPackageDetails} from "./renderPackageDetails";
import {renderIcon} from "./renderIcon";

export async function renderPackageList(packageManager: MicroEndPackageManager) {

    const maxWidth = window.innerWidth;
    const isMobile = maxWidth < 600;
    const installedModules = await getAllModules();
    const allModules = installedModules.filter(m => !m.deleted);
    const modules = allModules.map(module => {
        return `<div style="display: flex;box-sizing: border-box;align-items: center;border-bottom:1px solid rgba(0,0,0,0.1);">
    <div style="flex-shrink:0;width: 150px;flex-grow: ${isMobile?'1':'0'}">
        ${module.title}
    </div>
    <div style="flex-shrink:0;width:40px;font-size: small;font-weight: bold">
        ${module.version}
    </div>
    <div style="flex-grow: 1;display: ${isMobile ? 'none':'flex'}">
        ${module.description}
    </div>
    <div data-button-details="true" data-module-name="${module.name}" style="flex-shrink:0;width:30px;display: flex;align-items: center;justify-content: center">
        <svg xmlns="http://www.w3.org/2000/svg" class="ionicon" width="18" height="18" viewBox="0 0 512 512"><title>Folder Open</title><path d="M64 192v-72a40 40 0 0140-40h75.89a40 40 0 0122.19 6.72l27.84 18.56a40 40 0 0022.19 6.72H408a40 40 0 0140 40v40" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="32"/><path d="M479.9 226.55L463.68 392a40 40 0 01-39.93 40H88.25a40 40 0 01-39.93-40L32.1 226.55A32 32 0 0164 192h384.1a32 32 0 0131.8 34.55z" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="32"/></svg>
    </div>
    
    <div data-button-remove="true" data-module-name="${module.name}" style="flex-shrink:0;width:30px;display: flex;align-items: center;justify-content: center">
        <svg xmlns="http://www.w3.org/2000/svg" class="ionicon" width="18" height="18" viewBox="0 0 512 512"><title>Trash</title><path d="M112 112l20 320c.95 18.49 14.4 32 32 32h184c17.67 0 30.87-13.51 32-32l20-320" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="32"/><path stroke="currentColor" stroke-linecap="round" stroke-miterlimit="10" stroke-width="32" d="M80 112h352"/><path d="M192 112V72h0a23.93 23.93 0 0124-24h80a23.93 23.93 0 0124 24h0v40M256 176v224M184 176l8 224M328 176l-8 224" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="32"/></svg>
    </div>
    
    <label style="display: table-cell;">
        <div style="display: flex">
        <div>Active</div>
        <input type="checkbox" ${module.active ? 'checked' : ''} data-module-name="${module.name}"/>
        </div>
    </label>
</div>`
    });
    const noModule = '<div style="padding: 30px;text-align: center;font-style: italic">No modules are currently installed.</div>';

    packageManager.innerHTML = `<div style="display:flex;flex-direction:column ;max-width: 1300px;width:100%">
<div style="display: flex;flex-direction: row;align-items: center;border-bottom: 1px solid rgba(0,0,0,0.1);padding-bottom: 10px">
    <button style="border: 1px solid rgba(0,0,0,0);border-radius: 2px;background-color: unset" data-exit-button="true">
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" class="ionicon" viewBox="0 0 512 512"><title>Arrow Back</title><path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="48" d="M244 400L100 256l144-144M120 256h292"/></svg>
    </button>
    <div style="flex-grow: 1;align-items: center;font-size: 18px">Modules</div>
    <microend-moduleloader ></microend-moduleloader>
</div>

<div style="display: table;box-sizing: border-box;flex-direction: column;">${modules.length > 0 ? modules.join('') : noModule}</div></div>`;
    packageManager.setFullScreen(true);
    packageManager.querySelectorAll('[data-button-details]').forEach(element => {
        element.addEventListener('click', async (event) => {
            if (event.currentTarget && event.currentTarget instanceof HTMLElement) {
                const moduleName = event.currentTarget.getAttribute('data-module-name');
                if (moduleName) {
                    await renderPackageDetails(packageManager, moduleName);
                    await renderPackageList(packageManager);
                }
            }
        });
    })

    packageManager.querySelectorAll('[data-button-remove]').forEach(element => {
        element.addEventListener('click', (event) => {
            if (event.currentTarget && event.currentTarget instanceof HTMLElement) {
                const moduleName = event.currentTarget.getAttribute('data-module-name');
                const result = prompt(`Please type "${moduleName}" to remove the module`);
                if (moduleName && result === moduleName) {
                    removeModule(moduleName).then(() => {
                        renderPackageList(packageManager);
                    });
                }
            }
        })
    });

    packageManager.querySelector('microend-moduleloader')!.addEventListener('change', (event) => {
        renderPackageList(packageManager);
    });

    packageManager.querySelectorAll('[type="checkbox"]').forEach(element => {
        element.addEventListener('change', async (event) => {
            const moduleName = (event.target! as HTMLInputElement).getAttribute('data-module-name');
            await deactivateModule(moduleName!, !(event.target! as HTMLInputElement).checked);
            renderPackageList(packageManager).then();
        })
    });
    packageManager.querySelector('[data-exit-button]')!.addEventListener('click', () => {
        renderIcon(packageManager);
    })
}
