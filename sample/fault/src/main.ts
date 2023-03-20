import {getMicroEnd} from "@microend/lib";

window.onload = () => {
    const me = getMicroEnd();

    const {onParamsChange, onFocusChange} = me;
    const content = document.getElementById('content');
    onParamsChange(() => {
        if (content === null) {
            return;
        }
        content.innerHTML = JSON.stringify(me.params);
    });
    onFocusChange(() => {
        console.log('Fault is focused context', me.params);
        return () => {
            console.log('Fault is lost focused', me.params);
        }
    })
    const {params} = me;
    if (content) {
        content.innerHTML = JSON.stringify(params);
    }

    document.getElementById('navigateBack')!.addEventListener('click', async () => {
        const {params, navigateBack} = me;
        navigateBack({message: 'from fault', caller: params.caller});
    });
    document.getElementById('fetchIdentity')!.addEventListener('click', async () => {
        const result = await me.navigateTo('identity', {intent: 'getCurrentUser'}, 'service');
        alert('We got your identity ' + result);
    })
}

