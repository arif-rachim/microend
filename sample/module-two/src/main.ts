import './style.css'
import {getMicroEnd} from "@microend/lib";

const me = getMicroEnd();

const goBackModuleOne = document.querySelector('#button-go-back')!;

goBackModuleOne.addEventListener('click',() => {
    debugger;
});

const service = me.createService<{hello : () => Promise<string>}>({
    hello : async () => {
        return 'world';
    }
});

export type Service = typeof service;

//const router = me.createRouter<{doSomethingCrazy:async (param:{name:string,age:string}) => string}>();