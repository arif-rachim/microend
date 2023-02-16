import {openTransaction} from "./openTransaction";
import {Module} from "./Types";

export function getAllModules(): Promise<Module[]> {
    return new Promise((resolve, reject) => {
        openTransaction('readonly').then(({db, tx, store}) => {
            const request = store.getAll();
            request.addEventListener('success', () => {
                const data: Module[] = request.result;
                resolve(data);
                db.close();
            });
            request.addEventListener('error', (error) => {
                console.warn(error);
                resolve([]);
                db.close();
            })
        })


    })


}