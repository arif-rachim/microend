import {DATABASE_NAME, TABLE_MODULE_NAME} from "./MicroEndRouter";


export function openTransaction(type: IDBTransactionMode): Promise<{ db: IDBDatabase, tx: IDBTransaction, store: IDBObjectStore }> {
    return new Promise((resolve) => {
        const req = indexedDB.open(DATABASE_NAME, 1)
        req.addEventListener('upgradeneeded', () => {
            const db = req.result;
            db.createObjectStore(TABLE_MODULE_NAME, {keyPath: 'name'});
        });
        req.addEventListener('success', () => {
            const db = req.result;
            const tx = db.transaction([TABLE_MODULE_NAME], type);
            const store = tx.objectStore(TABLE_MODULE_NAME);
            resolve({db, tx, store});
        });
    })
}


