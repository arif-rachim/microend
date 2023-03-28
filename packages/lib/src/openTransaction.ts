import {DATABASE_NAME, Table} from "./MicroEndRouter";

export function openTransaction(type: IDBTransactionMode, table: Table[] | Table): Promise<[db: IDBDatabase, tx: IDBTransaction, ...store: IDBObjectStore[]]> {
    return new Promise((resolve) => {
        const req = indexedDB.open(DATABASE_NAME, 2)
        req.addEventListener('upgradeneeded', () => {
            const db = req.result;
            if (!db.objectStoreNames.contains('module')) {
                db.createObjectStore('module', {keyPath: 'name'});
            }
            if (!db.objectStoreNames.contains('module-source')) {
                db.createObjectStore('module-source', {keyPath: 'id'});
            }
            if (!db.objectStoreNames.contains('app-context')) {
                db.createObjectStore('app-context', {keyPath: 'id'});
            }
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
        req.addEventListener('error', (evt) => {
            console.error('Unable to open db ', evt);
        });
        req.addEventListener('blocked', (evt) => {
            console.error('Unable to open request because it was Blocked', evt);
        });
    })
}


