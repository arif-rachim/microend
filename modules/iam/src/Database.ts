import Dexie, {Table} from "dexie";
import {TreeItem} from "./tree/DataTree";

export interface User {
    id: string,
    name: string,
    email: string,
    phoneNumber: string,
    active: boolean,
}

class Database extends Dexie {

    roles!: Table<TreeItem>
    users!: Table<User>

    constructor() {
        super('iam');
        this.version(1).stores({
            roles: 'id,name,parentId',
            users: 'id,name'
        })
    }
}

export const db = new Database();
//export const db = {};