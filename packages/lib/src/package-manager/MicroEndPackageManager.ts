import {renderIcon} from "./renderIcon";

export class MicroEndPackageManager extends HTMLElement {

    debugMode: boolean;

    constructor() {
        super();
        this.style.boxSizing = 'border-box';
        this.style.display = 'flex';
        this.style.flexDirection = 'column';
        this.style.alignItems = 'center';
        this.style.fontFamily = 'arial';
        this.style.position = 'fixed';
        this.debugMode = this.getAttribute('debug') === 'true';
        renderIcon(this);
    }

    log = (...args: string[]) => {
        if (this.debugMode) {
            console.log('[MicroEndPackageManager]', ...args)
        }
    }

    setFullScreen = (fullScreen: boolean) => {
        this.style.right = fullScreen ? 'unset' : '30px';
        this.style.top = fullScreen ? '0px' : 'unset';
        this.style.bottom = fullScreen ? 'unset' : '30px';
        this.style.left = fullScreen ? '0px' : 'unset';
        this.style.width = fullScreen ? '100%' : 'unset';
        this.style.padding = fullScreen ? '10px' : 'unset';
        this.style.minHeight = fullScreen ? '100%' : 'unset';
        this.style.overflow = fullScreen ? 'unset' : 'unset';
        this.style.backdropFilter = fullScreen ? 'blur(30px)' : 'unset';
        this.style.backgroundColor = fullScreen ? '#f2f2f2' : 'unset';
        (this.style as any).webkitBackdropFilter = fullScreen ? 'blur(30px)' : 'unset';

    }

    connectedCallback() {
    }

    disconnectedCallback() {
    }
}