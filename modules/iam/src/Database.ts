import Dexie, {Table} from "dexie";

export interface TreeItem {
    parentId: string,
    id: string,
    name: string,
    order: number
}

class Database extends Dexie {
    roles!: Table<TreeItem>

    constructor() {
        super('iam');
        this.version(1).stores({
            roles: 'id,name,parentId'
        })
    }
}

export const db = new Database();
//export const db = {};