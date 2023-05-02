import Dexie, {Table} from "dexie";

export interface FileOrFolder {
    parentId: string,
    id: string,
    name: string,
    isFile?: boolean,
    type?: string
}

export interface FileBuffer {
    // this have to be same with FileOrFolder.id
    id: string,
    buffer: ArrayBuffer
}

export const root: FileOrFolder = {
    name: 'root',
    id: '.',
    parentId: ''
}

class Database extends Dexie {
    folderOrFiles!: Table<FileOrFolder>
    fileBuffer!: Table<FileBuffer>

    constructor() {
        super('file-manager');
        this.version(2).stores({
            folderOrFiles: 'id,name,parentId',
            fileBuffer: 'id'
        });
    }
}

export const db = new Database();

//export const db = {};