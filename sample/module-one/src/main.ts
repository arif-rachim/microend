import './style.css'
import {Service} from "module-two";
import {getMicroEnd} from "@microend/lib";

const me = getMicroEnd();
const service = me.connectService<Service>('module-two');
const moduleTwoButton: HTMLButtonElement = document.querySelector('#button-calling-module-two')!;
//const navigateFault = <{fuck:string}>('fault');
moduleTwoButton.addEventListener('click', async () => {
    const result = await service.hello();
    const resultTwo = await service.exampleService({name:'arif',password:'hore'});
    alert('WE GOT MESSAGE FROM MODULE TWO '+result+ ' '+resultTwo.helloUser.name);
})