import fs from 'fs/promises';
import path from 'path';

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
        if (stats.isFile()) {
            const moduleContent = await fs.readFile(fileOrFolderPath, {encoding: 'utf-8'});
            const moduleInfo = getContentInfo(moduleContent);
            moduleInfo.path = fileOrFolderPath;
            result.push(moduleInfo)
        }
    }
    return result;
}

const registry = await extracted(folderOrFiles, storesDir);
console.log(registry);


export function getContentInfo(content) {
    const moduleName = getMetaData('module', content)[0];
    const dependency = getMetaData('dependency', content)[0];
    const description = getMetaData('description', content)[0];
    const author = getMetaData('author', content)[0];
    const icon = getMetaData('icon', content)[0];
    const visibleInHomeScreen = getMetaData('visibleInHomeScreen', content)[0];
    const title = getTagContent('title', content);
    return {moduleName, dependency, description, author, icon, visibleInHomeScreen, title};
}

function getMetaData(metaName, htmlText) {
    const result = [];
    let index = 0;
    do {
        const [value, endIndex] = scanText(metaName, htmlText, index);
        index = endIndex;
        if (value) {
            result.push(value);
        }
    } while (index >= 0);
    return result;
}

function getTagContent(tagName, htmlText) {
    const startTag = `<${tagName}>`;
    const endTag = `</${tagName}>`;
    if (htmlText.indexOf(startTag) < 0) {
        return '';
    }
    const startIndex = htmlText.indexOf(startTag) + startTag.length;
    const endIndex = htmlText.indexOf(endTag, startIndex);
    return htmlText.substring(startIndex, endIndex);
}


function scanText(metaName, htmlText, startingIndex) {
    const indexOfContent = htmlText.indexOf(`name="${metaName}"`, startingIndex);
    if (indexOfContent < 0) {
        return ['', -1];
    }
    const startTagIndex = htmlText.substring(startingIndex, indexOfContent).lastIndexOf('<') + startingIndex;
    const endTagIndex = htmlText.substring(indexOfContent, htmlText.length).indexOf('>') + indexOfContent
    let dependency = '';
    if (startTagIndex >= 0 && endTagIndex > startTagIndex) {
        dependency = htmlText.substring(startTagIndex, endTagIndex).split('content="')[1].split('"')[0];
    }
    return [dependency, endTagIndex];
}