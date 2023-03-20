import {DATABASE_NAME, Table} from "./MicroEndRouter";

export function openTransaction(type: IDBTransactionMode, table: Table[] | Table): Promise<[db: IDBDatabase, tx: IDBTransaction, ...store: IDBObjectStore[]]> {
    return new Promise((resolve) => {
        const req = indexedDB.open(DATABASE_NAME, 1)
        req.addEventListener('upgradeneeded', () => {
            const db = req.result;
            db.createObjectStore('module', {keyPath: 'name'});
            db.createObjectStore('module-source', {keyPath: 'id'});
        });
        req.addEventListener('success', () => {
            const db = req.result;
            const tx = db.transaction(table, type);
            if (Array.isArray(table)) {
                const store = table.map(t => tx.objectStore(t));
                resolve([db, tx, ...store]);
            } else {
                const store = tx.objectStore(table);
                resolve([db, tx, store]);
            }
        });
    })
}


