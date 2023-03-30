export function showModal(message: string, ...selects: string[]): Promise<string> {
    return new Promise((resolve) => {
        const div = document.createElement('div');
        div.style.position = 'fixed';
        div.style.top = '0px';
        div.style.left = '0px';
        div.style.width = '100%';
        div.style.maxWidth = `${window.innerWidth}px`;
        div.style.height = '100%';
        div.style.background = 'rgba(0,0,0,0.1)';
        div.style.boxShadow = '0 5px 5px -3px rgba(0,0,0,0.5)';
        div.style.display = 'flex';
        div.style.flexDirection = 'column';
        div.style.alignItems = 'center';
        div.style.justifyContent = 'center';
        div.style.backdropFilter = 'blur(3px)';
        // @ts-ignore
        div.style["-webkit-backdrop-filter"] = 'blur(3px)';
        div.innerHTML = `<div style="background-color: rgba(255,255,255,0.9);border: 1px solid rgba(0,0,0,0.1);backdrop-filter: blur(3px);-webkit-backdrop-filter: blur(3px);padding: 10px;border-radius: 10px;display: flex;flex-direction: column">
    <div style="font-size: 14px">${message}</div>
    <div style="display: flex;flex-direction: row;justify-content: flex-end;margin-top: 10px">
        ${selects.map(select => {
            return `<button style="background-color: #f2f2f2;padding:5px 10px;border: 1px solid rgba(0,0,0,0.1);margin-right: 5px;border-radius: 5px" data-button-select="${select}" >${select}</button>`
        }).join('')}
        
    </div>
</div>`
        document.body.appendChild(div);
        document.querySelectorAll('[data-button-select]').forEach(element => {
            element.addEventListener('click', (event) => {
                const value = (event.target! as HTMLButtonElement).getAttribute('data-button-select')!;
                resolve(value);
                div.remove();
            })
        })
    })

}