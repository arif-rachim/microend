import {MicroEndModuleLoader, MicroEndPackageManager, MicroEndRouter} from "@microend/lib";

customElements.define('microend-moduleloader', MicroEndModuleLoader);
customElements.define('microend-router', MicroEndRouter);
customElements.define('microend-packagemanager', MicroEndPackageManager);

window.addEventListener('beforeinstallprompt', async (e:any) => {
    // Prevents the default mini-infobar or install dialog from appearing on mobile
    e.preventDefault();
    const result = await showInAppInstallPromotion();
    if(result === 'ok'){
        e.prompt();
        const { outcome } = await e.userChoice;
        if (outcome === 'accepted') {
            console.log('User accepted the install prompt.');
        } else if (outcome === 'dismissed') {
            console.log('User dismissed the install prompt');
        }
    }
});

function showInAppInstallPromotion():Promise<'ok'|'no'> {
    return new Promise((resolve) => {
        const div = document.createElement('div');
        div.innerHTML = `<div style="padding:20px;border-bottom: 1px solid rgba(0,0,0,0.1);border-radius: 5px;z-index: 1;background-color: #f2f2f2">
    <p>By installing Microend on your device, you can improve the overall experience you have with it. To continue with the installation of microend into your device, click the "Install Microend" button.</p>
    <div style="display: flex;flex-direction: row">
        <button id="installButton" style="padding: 10px;border-radius: 5px;background-color: #FFFFFF;border: 1px solid rgba(0,0,0,0.1)">Install Microend</button>
        <button style="margin-left:10px;padding: 10px;border-radius: 5px;background-color: #FFFFFF;border: 1px solid rgba(0,0,0,0.1)" id="noButton" >No, maybe next time</button>
    </div>
</div>`
        document.body.append(div);
        const installButton = document.getElementById('installButton')!;
        const noButton = document.getElementById('noButton')!;
        installButton.addEventListener('click',() => {
            resolve('ok');
            div.remove();
        });
        noButton.addEventListener('click',() => {
            resolve('no');
            div.remove();
        })
    })

}