import './style.css'
import {getMicroEnd} from "@microend/lib";

const me = getMicroEnd();

const service = me.createService({
    hello: async () => {
        return 'world';
    },
    exampleService: async ({name, password}: { name: string, password: string }) => {
        console.log('user submitting password', password);
        return {
            helloUser: {name},
            message: 'This is message from client'
        }
    }
});
export type Service = typeof service;

////// TESTING CREATING NAVIGATOR
function createNavigator<T extends { [k: string]: any }>(params: T) {
    console.log(params);
    type E<T> = T extends (params: infer P) => any ? P : never;
    type R<T> = T extends (params: any) => () => infer P ? P : never;

    type Navigator<P extends keyof T> = {
        [K in P]: {
            params: E<T[K]>,
            navigateBack: (param: R<T[K]>) => void
        }
    } & {current : P}
    return {} as Navigator<keyof T>;
}

const navigator = createNavigator({
    getAddress: (param: { latitude: string, longitude: string }) => {
        console.log('WE GOT PARAM ', param);
        return () => {
            return {
                address: 'dubai marina'
            }
        }
    },
    getUserInfo: (param: { userId: string }) => {
        console.log('WE GOT PARAM 2', param);
        return () => {
            return {
                name: 'arif',
                age: 40
            }
        }
    }
})



document.getElementById('#button-go-back')!.addEventListener('click', () => {

    if (navigator.current === 'getUserInfo') {
        const {navigateBack} = navigator[navigator.current];
        navigateBack({age: 10,name: 'achim'});
    }

})
//// THIS IS THE PART FOR THE CONSUMER
function connectNavigator<T>(name:string){
    console.log(name);
    type V = Omit<T, 'current'>;
    type ExtractParams<T> = T extends {params:infer R} ? R : never;
    type ExtractResults<T> = T extends {navigateBack:(params:infer R) => void} ? R :never;
    type NavigatorConnector<T> = {
        [K in keyof T] : (params:ExtractParams<T[K]>) => Promise<ExtractResults<T[K]>>
    }
    return {} as NavigatorConnector<V>
}
const navigateTo = connectNavigator<typeof navigator>('arif');
(async () => {
    const output = await navigateTo.getAddress({latitude:'100',longitude:'100'})
    alert(output.address);

})()




//const router = me.createRouter<{doSomethingCrazy:async (param:{name:string,age:string}) => string}>();