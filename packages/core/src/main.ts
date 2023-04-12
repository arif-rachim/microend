import {MicroEndHomeButton, MicroEndRouter, saveModuleCodes} from "@microend/lib";

import storeHtml from "@microend/store/dist/index.html?raw";
import launcherHtml from "@microend/launcher/dist/index.html?raw";
//import microendText from "./microend.html?raw";
import esnaadMText from "./esnaadm.html?raw";
saveModuleCodes({contents: [storeHtml, launcherHtml], autoAccept: true, skipIfItsAlreadyInstalled: true}).then();


customElements.define('microend-router', MicroEndRouter);
customElements.define('microend-home', MicroEndHomeButton);

window.addEventListener('beforeinstallprompt', async (e: any) => {
    // Prevents the default mini-infobar or install dialog from appearing on mobile
    e.preventDefault();
    const result = await showInAppInstallPromotion();
    if (result === 'ok') {
        e.prompt();
        const {outcome} = await e.userChoice;
        if (outcome === 'accepted') {
            console.log('User accepted the install prompt.');
        } else if (outcome === 'dismissed') {
            console.log('User dismissed the install prompt');
        }
    }
});

function showInAppInstallPromotion(): Promise<'ok' | 'no'> {
    return new Promise((resolve) => {
        const div = document.createElement('div');
        div.style.position = 'fixed';
        div.style.bottom = '0';
        div.style.width = '100%';

        div.innerHTML = `<div style="padding:20px;border-top: 1px solid rgba(0,0,0,0.1);border-radius: 5px;z-index: 1;background-color: #f2f2f2;box-shadow: 0 -5px 5px -3px rgba(0,0,0,0.1)">
    <p>By installing Microend on your device, you can improve the overall experience you have with it. To continue with the installation of microend into your device, click the "Install Microend" button.</p>
    <div style="display: flex;flex-direction: row">
        <button id="installButton" style="padding: 10px;border-radius: 5px;background-color: #FFFFFF;border: 1px solid rgba(0,0,0,0.1)">Install Microend</button>
        <button style="margin-left:10px;padding: 10px;border-radius: 5px;background-color: #FFFFFF;border: 1px solid rgba(0,0,0,0.1)" id="noButton" >No, maybe next time</button>
    </div>
</div>`
        document.body.append(div);
        const installButton = document.getElementById('installButton')!;
        const noButton = document.getElementById('noButton')!;
        installButton.addEventListener('click', () => {
            resolve('ok');
            div.remove();
        });
        noButton.addEventListener('click', () => {
            resolve('no');
            div.remove();
        })
    })

}

document.getElementsByTagName('main').item(0)!.innerHTML = esnaadMText;

window.onload = () => {

    function showArticle() {
        const routerActive = (window.location.hash || '').length > 3;
        const main = document.getElementsByTagName('main').item(0)!;
        main.style.display = routerActive ? 'none' : 'flex';
    }

    showArticle();
    window.addEventListener('hashchange', () => {
        showArticle();
    })

    const homeButton = document.querySelector('microend-home')!;
    homeButton.addEventListener('launcherselectionvisible', ({detail: visible}: any) => {
        const main = document.getElementsByTagName('main').item(0)!;
        main.style.display = visible ? 'none' : 'flex';
    })
    homeButton.addEventListener('reload', () => {
        window.location.reload();
    })
}

if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register("/serviceworker.js").then();
}