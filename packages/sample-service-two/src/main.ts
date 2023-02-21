import {getMicroEnd} from "@microend/lib";
import {ServiceOne} from "@microend/sample-service-one";

const me = getMicroEnd();
const service = me.createService({
    hello: async () => {
        console.log('Hello Called from service Two');
        return "World"
    }
});

me.onMount(() => {
    const button = document.getElementById('button');
    if (button === null) {
        return;
    }
    button.addEventListener('click', async () => {
        const service = me.connectService<ServiceOne>('sample-service-one');
        const result = await service.secondService({name: 'arif', age: 30});
        console.log('WE GOT RESULT ', result);
    })
})
export type ServiceTwo = typeof service;
