import './style.css'
import {Navigation, Service,} from "module-two";
import {getMicroEnd} from "@microend/lib";
import {IamService,AccessParam} from "@microend/iam";
const me = getMicroEnd();
const service = me.connectService<Service>('module-two');
const navigation = me.connectNavigation<Navigation>('module-two');
const iamService = me.connectService<IamService>('iam');

const accessList:AccessParam[] = [{name:'Module One Read Data',description:'',id:'module-one-do-sedap'},{name:'Module One Read Data',description:'',id:'module-two-sedap'}];

iamService.registerAccessList({moduleId:'module-one',accessList:accessList});
document.querySelector('#button-calling-module-two')!.addEventListener('click', async () => {
    const result = await service.hello();
    const resultTwo = await service.exampleService({name: 'arif', password: 'hore'});
    alert('WE GOT MESSAGE FROM MODULE TWO ' + result + ' ' + resultTwo.helloUser.name);
});

document.querySelector('#button-calling-module-two-model')!.addEventListener('click', async () => {
    const result = await navigation.getAddress({latitude: '100', longitude: '200'}, 'modal');
    alert('WE GOT MESSAGE FROM MODULE getAddress ' + result.address);
});

document.querySelector('#button-calling-module-two-view')!.addEventListener('click', async () => {
    const result = await navigation.getUserInfo({userId: 'Arif Rachim '+(Math.random()* 100).toFixed()}, 'default');
    alert('WE GOT MESSAGE FROM MODULE getUserInfo ' + result.name);
});
