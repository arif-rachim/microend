import Dexie, {Table} from "dexie";
import {TreeItem} from "./tree/DataTree";

export interface User {
    id: string,
    userId: string,
    name: string,
    email: string,
    phoneNumber: string,
    active: boolean,
    roles: string // this is comma separated role !
}

class Database extends Dexie {

    roles!: Table<TreeItem>
    users!: Table<User>

    constructor() {
        super('iam');
        this.version(5).stores({
            roles: 'id,name,parentId',
            users: 'id,userId,name,phoneNumber,email,roles'
        });
    }
}

export const db = new Database();
//export const db = {};