import {getAllModules, getAppContext, saveAppContext} from "../dataStore";
import {AppContext} from "../Types";

const BOX_SHADOW = '0 8px 5px -3px rgba(0,0,0,0.5)';
export class MicroEndHomeButton extends HTMLElement {
    timeOnMouseDown = 0;
    appContext: AppContext = {
        homeModule: '',
        id: ''
    }
    isDragged = false;
    constructor() {
        super();
        this.initStyle();
        this.initAppContext().then();
        this.renderButton().then();
    }

    initStyle = () => {
        this.style.position = 'fixed';
        this.style.userSelect = 'none';
        this.style.bottom = '20px';
        this.style.display = 'flex';
        this.style.flexDirection = 'column';
        this.style.alignItems = 'center';
        this.style.margin = 'auto';
        this.style.backgroundColor = '#FFF';
        this.style.left = 'calc(50vw - 25px)';
        this.style.boxShadow = BOX_SHADOW;
        this.style.borderRadius = '20px';
        this.style.transition = 'box-shadow 300ms ease';
    }


    initAppContext = async () => {
        const appContext = await getAppContext();
        if (appContext) {
            this.appContext = appContext;
        }
    }

    renderButton = async () => {
        this.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 96 960 960" fill="#9F2D2D" opacity="1"><path d="M480 976q-82 0-155-31.5t-127.5-86Q143 804 111.5 731T80 576q0-83 31.5-156t86-127Q252 239 325 207.5T480 176q83 0 156 31.5T763 293q54 54 85.5 127T880 576q0 82-31.5 155T763 858.5q-54 54.5-127 86T480 976Zm0-120q117 0 198.5-82T760 576q0-117-81.5-198.5T480 296q-116 0-198 81.5T200 576q0 116 82 198t198 82Zm0 40q134 0 227-93.5T800 576q0-134-93-227t-227-93q-133 0-226.5 93T160 576q0 133 93.5 226.5T480 896Z"/></svg>`

        const touchStart = () => {
            const currentTime = new Date().getTime();
            this.timeOnMouseDown = currentTime;
        }
        const touchEnd = () => {
            if(this.isDragged){
                return;
            }
            const currentTime = new Date().getTime();
            const delta = currentTime - this.timeOnMouseDown;
            if (delta < 300) {
                if (this.appContext.homeModule === '') {
                    this.showModuleSelection();
                    return;
                }
                document.location.hash = `/${this.appContext.homeModule}/*`;
            } else {
                this.showModuleSelection();
            }
        };
        this.addEventListener('touchstart', touchStart);
        this.addEventListener('mousedown', touchStart);
        this.addEventListener('touchend', touchEnd);
        this.addEventListener('mouseup', touchEnd);

        let x = 0;
        let y = 0;

        const onMouseMove = (e:TouchEvent|MouseEvent) => {
            let position:{clientX:number,clientY:number} = {clientY:0,clientX:0};
            if('targetTouches' in e && e.targetTouches.length > 0){
                position = e.targetTouches[0];
            }else{
                position = e as MouseEvent;
            }
            const dx = position.clientX - x;
            const dy = position.clientY - y;
            const newLeft = this.offsetLeft + dx;
            const newTop = this.offsetTop + dy;
            if(newLeft < 0 || newLeft > (window.innerWidth - 40)){
                return;
            }
            if(newTop < 0){
                return;
            }
            this.style.top = `${newTop}px`;
            this.style.left = `${newLeft}px`;
            this.style.bottom = 'unset';
            this.isDragged = true;

            x = position.clientX;
            y = position.clientY;
        }

        const onMouseUp = () => {
            this.isDragged = false;
            Array.from(document.querySelectorAll('[data-drag-layer="true"]')).forEach(e => {
                e.remove();
            })
            document.removeEventListener('mousemove',onMouseMove);
            document.removeEventListener('mouseup',onMouseUp);
            document.removeEventListener('touchmove',onMouseMove);
            document.removeEventListener('touchend',onMouseUp);
        }

        const mouseDownHandler = (e:TouchEvent|MouseEvent) => {
            let position:{clientX:number,clientY:number} = {clientY:0,clientX:0};
            if('targetTouches' in e && e.targetTouches.length > 0){
                position = e.targetTouches[0];
            }else{
                position = e as MouseEvent;
            }
            x = position.clientX;
            y = position.clientY;
            // we need to attach the element
            const div = document.createElement('div');
            div.setAttribute('data-drag-layer','true');
            div.style.width = window.innerWidth - 15 +'px';
            div.style.height = window.innerHeight+'px';
            div.style.background = 'rgba(0,0,0,0)';
            div.style.position = 'absolute';
            div.style.top = '0';
            div.style.left = '0';
            this.parentElement!.insertBefore(div,this);
            document.addEventListener('mousemove',onMouseMove);
            document.addEventListener('mouseup',onMouseUp);
            document.addEventListener('touchmove',onMouseMove);
            document.addEventListener('touchend',onMouseUp);
        }
        this.addEventListener('mousedown',mouseDownHandler);
        this.addEventListener('touchstart',mouseDownHandler);

        const effectUpHandler = () => {
            this.style.boxShadow = BOX_SHADOW;
            document.removeEventListener('touchend',effectUpHandler);
            document.removeEventListener('mouseup',effectUpHandler);
        }

        const effectDownHandler = () => {
            this.style.boxShadow = '0 0 0 0 rgba(0,0,0,0)';
            document.addEventListener('touchend',effectUpHandler);
            document.addEventListener('mouseup',effectUpHandler);
        }

        this.addEventListener('mousedown',effectDownHandler);
        this.addEventListener('touchstart',effectDownHandler);

    }

    showModuleSelection = async () => {

        const modules = await getAllModules();
        const mods = modules.filter(m => (m.active && !m.deleted));
        const element = document.createElement('div');
        element.setAttribute('data-home-selection', "true");
        element.style.position = 'fixed';
        element.style.zIndex = '99';
        element.style.top = '0px';
        element.style.left = '0px';
        element.style.width = '100%';
        element.style.height = '100%';
        element.style.display = 'flex';
        element.style.flexDirection = 'column';
        element.style.alignItems = 'center';
        element.style.backgroundColor = '#f2f2f2';

        const modsHTMLString = mods.map(m => {
            return `<div style="display: flex;flex-direction: column;justify-content: center;margin: 5px;align-items: center">
    <div data-icon-module="true" data-module-name="${m.path}" style="width: 60px;height:60px;display: flex;flex-direction: column;align-items: center;justify-content: center;background-color: #fafafa;border: 1px solid rgba(0,0,0,0.01);border-radius: 50px;overflow: hidden;box-shadow: 0 5px 5px -3px rgba(0,0,0,0.1);cursor: pointer;margin:5px">
        <img src=${m.iconDataURI} width="50" height="50"/>
    </div>
    <div style="font-size:12px;max-width:60px">${m.title}</div>
</div>`;

        }).join('');
        element.innerHTML = `<div style="max-width: 800px;width: 100%">
<div style="font-size: large;padding:10px 10px;text-align: center;border-bottom: 1px solid rgba(0,0,0,0.1);background-color: #fafafa">Choose the default launcher</div>
<div style="display: flex;flex-direction: row;flex-wrap: wrap;align-items: flex-start;justify-content: center;max-height: 100%;overflow: auto;padding: 10px">
    ${modsHTMLString}
</div>
</div>`
        document.body.appendChild(element);
        document.querySelectorAll('[data-icon-module="true"]').forEach(element => {
            element.addEventListener('click', async () => {
                const name = element.getAttribute('data-module-name')!;
                await saveAppContext({homeModule: name});
                const el = document.querySelector('[data-home-selection="true"]')!;
                el.remove();
                window.location.reload();
            })
        })
    }
}

