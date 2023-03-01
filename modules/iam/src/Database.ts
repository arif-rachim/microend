import Dexie, {Table} from "dexie";
import {Tree} from "./App";

class Database extends Dexie{
    roles! : Table<Tree>
    constructor() {
        super('iam');
        this.version(1).stores({
            roles: 'id,name'
        })
    }
}

export const db = new Database();