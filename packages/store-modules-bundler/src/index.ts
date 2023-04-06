import * as dotenv from 'dotenv';
import fs from 'fs/promises';
import path from 'path';
import utils, {ContentInfo} from "@microend/utils";
import {Blob} from "buffer";


dotenv.config({path: '.env.local'});

global.Blob = Blob;

const {parseContentInfo} = utils;

const projectDir = path.dirname(path.dirname(path.dirname(__dirname)));
const storesDirectory = path.join(projectDir,'packages','core','public','stores');
const modulesDirectory = path.join(projectDir,'modules');

async function bundleModule() {

    const listOfModules = await fs.readdir(modulesDirectory);
    for (const module of listOfModules) {
        const directory = path.join(modulesDirectory, module);
        const stat = await fs.lstat(directory);
        if(!stat.isDirectory()){
            continue;
        }
        const indexFile = path.join(modulesDirectory, module, 'dist', 'index.html');
        const moduleContent = await fs.readFile(indexFile, {encoding: 'utf-8'});
        const moduleInfo = parseContentInfo(moduleContent);
        const directoryModule = path.join(storesDirectory,moduleInfo.path);
        await fs.mkdir(directoryModule,{recursive:true});
        await fs.cp(indexFile,path.join(directoryModule,`${moduleInfo.version}.html`));
        console.log('[store-module-bundler]','copying file',indexFile,path.join(directoryModule,`${moduleInfo.version}.html`));
    }
    const modulesInStores = await fs.readdir(storesDirectory);
    const registry = await createRegistry(modulesInStores,storesDirectory);
    await fs.writeFile(path.join(storesDirectory, 'index.json'), JSON.stringify(registry, null, 4), {encoding: 'utf-8'});
    console.log('[store-module-bundler]','Create index ',path.join(storesDirectory, 'index.json'));
}

bundleModule().then();
type ContentInfoWithSource = ContentInfo & {source:string};

async function createRegistry(folderOrFiles, parentDir) {
    let result:ContentInfoWithSource[] = [];
    for (const folderOrFile of folderOrFiles) {
        const fileOrFolderPath = path.join(parentDir, folderOrFile);

        const stats = await fs.lstat(fileOrFolderPath);
        if (stats.isDirectory()) {
            const folderOrFiles = await fs.readdir(fileOrFolderPath);
            const subResult = await createRegistry(folderOrFiles, fileOrFolderPath)
            result = result.concat(subResult);
        }
        if (stats.isFile() && folderOrFile.endsWith('.html')) {
            const moduleContent = await fs.readFile(fileOrFolderPath, {encoding: 'utf-8'});
            const moduleInfo:ContentInfo = parseContentInfo(moduleContent);
            const iconPath = fileOrFolderPath + '.icon.txt';
            await fs.writeFile(iconPath, moduleInfo.iconDataURI, {encoding: 'utf-8'});
            const sourcePathURL = fileOrFolderPath.split(path.sep).filter((_, i,array) => i >= array.indexOf('stores')).join('/');
            const iconPathURL = iconPath.split(path.sep).filter((_, i,array) => i >= array.indexOf('stores')).join('/');
            const contentInfoWithSource:ContentInfoWithSource = {
                ...moduleInfo,
                source : sourcePathURL,
                iconDataURI : iconPathURL
            }
            result.push(contentInfoWithSource);
        }
    }
    return result;
}