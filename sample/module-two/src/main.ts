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

const navigation = me.createNavigation({
    getAddress: (param: { latitude: string, longitude: string }) => {
        const button = document.getElementById('button-go-back');

        if (button) {
            button.innerHTML = `Latitude : ${param.latitude}, Long : ${param.longitude}`;
        }
        return () => {
            console.log('EXITING getAddress');
            return {
                address: 'dubai marina'
            }
        }
    },
    getUserInfo: (param: { userId: string }) => {
        const button = document.getElementById('button-go-back');

        if (button) {
            button.innerHTML = `User Id : ${param.userId}`;
        }
        return () => {
            console.log('EXITING getUserInfo');
            return {
                name: 'arif',
                age: 40
            }
        }
    }
})
export type Navigation = typeof navigation;

const button = document.getElementById('button-go-back');

if (button) {
    button.addEventListener('click', () => {
        if (navigation.current === 'getUserInfo') {
            const {navigateBack, params} = navigation[navigation.current];
            navigateBack({age: 50, name: "FromModuleTwo" + params.userId});
        }
        if (navigation.current === 'getAddress') {
            const {navigateBack, params} = navigation[navigation.current];
            navigateBack({address: 'HEY WE GOT ADDRESS latitude' + params.latitude});
        }
    })
}
