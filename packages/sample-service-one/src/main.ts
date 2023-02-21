import {getMicroEnd} from "@microend/lib";
import {ServiceTwo} from "@microend/sample-service-two";

const me = getMicroEnd();

const myService = me.createService({
    hello: async () => {
        console.log('HELLO WORLD', JSON.stringify(me, null, 2));
        alert('My Service Is Requested');
        return 'Fuck This is from one'
    },
    secondService: async (props: { name: string, age: number }) => {
        return {
            hello: `${props.name} ${props.age}`
        }
    }
});
me.onMount(() => {
    const button = document.getElementById('button');
    if (button === null) {
        return;
    }
    button.addEventListener('click', async () => {
        const service = me.connectService<ServiceTwo>('sample-service-two');
        const result = await service.hello();
        console.log('WE GOT FROM SERVICE TWO ', result);
    })
});
export type ServiceOne = typeof myService;
