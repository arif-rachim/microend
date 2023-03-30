import fs from 'fs/promises';
import path from 'path';
import utils from "@microend/utils";
import {Blob} from "buffer";

global.Blob = Blob;
const {parseContentInfo} = utils;

const storesDir = path.join('public', 'stores');
const folderOrFiles = await fs.readdir(storesDir);


async function extracted(folderOrFiles, parentDir) {
    let result = [];
    for (const folderOrFile of folderOrFiles) {
        const fileOrFolderPath = path.join(parentDir, folderOrFile);

        const stats = await fs.lstat(fileOrFolderPath);
        if (stats.isDirectory()) {
            const folderOrFiles = await fs.readdir(fileOrFolderPath);
            const subResult = await extracted(folderOrFiles, fileOrFolderPath)
            result = result.concat(subResult);
        }
        if (stats.isFile() && folderOrFile.endsWith('.html')) {
            const moduleContent = await fs.readFile(fileOrFolderPath, {encoding: 'utf-8'});
            const moduleInfo = parseContentInfo(moduleContent);
            const iconPath = fileOrFolderPath + '.icon.txt';
            await fs.writeFile(iconPath, moduleInfo.iconDataURI, {encoding: 'utf-8'});

            moduleInfo.source = fileOrFolderPath.split(path.sep).filter((_, i) => i > 0).join('/');
            moduleInfo.iconDataURI = iconPath.split(path.sep).filter((_, i) => i > 0).join('/');
            result.push(moduleInfo)
        }
    }
    return result;
}

const registry = await extracted(folderOrFiles, storesDir);
await fs.writeFile(path.join('public', 'stores.json'), JSON.stringify(registry, null, 4), {encoding: 'utf-8'});
console.log('stores generated :', path.join('public', 'stores.json'));
