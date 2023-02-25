export function showModal(message:string,...selects:string[]){
    return new Promise((resolve) => {
        const div = document.createElement('div');
        div.style.position = 'fixed';
        div.style.top = '0px';
        div.style.left = '0px';
        div.style.width = '100%';
        div.style.height = '100%';
        div.style.background = 'rgba(0,0,0,0.1)';
        div.style.display = 'flex';
        div.style.flexDirection = 'column';
        div.style.alignItems = 'center';
        div.style.justifyContent = 'center';

        div.innerHTML = `<div style="background-color: white;border: 1px solid rgba(0,0,0,0.1);padding: 10px;border-radius: 10px;display: flex;flex-direction: column">
    <div style="font-size: 14px">${message}</div>
    <div style="display: flex;flex-direction: row;justify-content: flex-end;margin-top: 10px">
        ${selects.map(select => {
            return `<button style="background-color: #f2f2f2;padding:5px 10px;border: 1px solid rgba(0,0,0,0.1);margin-right: 5px" data-button-select="${select}" >${select}</button>`    
        }).join('')}
        
    </div>
</div>`
        document.body.appendChild(div);
        document.querySelectorAll('[data-button-select]').forEach(element => {
            element.addEventListener('click',(event) => {
                const value = (event.target! as HTMLButtonElement).getAttribute('data-button-select');
                resolve(value);
                div.remove();
            })
        })
    })

}