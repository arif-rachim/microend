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

export interface AccessList {
    id: string,
    name: string,
    description: string,
    moduleName: string
}

class Database extends Dexie {

    roles!: Table<TreeItem>
    users!: Table<User>
    accessList!: Table<AccessList>

    constructor() {
        super('iam');
        this.version(6).stores({
            roles: 'id,name,parentId',
            users: 'id,userId,name,phoneNumber,email,roles',
            accessList : 'id,name'
        });
    }
}

export const db = new Database();
//export const db = {};