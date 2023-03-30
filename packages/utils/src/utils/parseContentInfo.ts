interface ContentInfo {
    name: string;
    dependencies: string[];
    description: string;
    author: string;
    iconDataURI: string;
    visibleInHomeScreen: boolean;
    title: string;
    path: string;
    version: string;
    size: number
}

export function parseContentInfo(content: string):ContentInfo {
    const name = getMetaData('name', content)[0];
    const dependencies = (getMetaData('dependencies', content)[0] ?? '').split(',').filter(s => s).map(s => s.trim())
    const description = getMetaData('description', content)[0];
    const author = getMetaData('author', content)[0];
    const iconDataURI = getMetaData('iconDataURI', content)[0];
    const visibleInHomeScreen = (getMetaData('visibleInHomeScreen', content)[0]) === "true";
    const title = getTagContent('title', content);
    const [path, version] = name.split('@').filter(s => s);
    const size = new Blob([content]).size;
    return {name, dependencies, description, author, iconDataURI, visibleInHomeScreen, title, path, version, size};
}


function getMetaData(metaName: string, htmlText: string): string[] {
    const result: string[] = [];
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

function getTagContent(tagName: string, htmlText: string) {
    const startTag = `<${tagName}>`;
    const endTag = `</${tagName}>`;
    if (htmlText.indexOf(startTag) < 0) {
        return '';
    }
    const startIndex = htmlText.indexOf(startTag) + startTag.length;
    const endIndex = htmlText.indexOf(endTag, startIndex);
    return htmlText.substring(startIndex, endIndex);
}

function scanText(metaName: string, htmlText: string, startingIndex: number): [string, number] {
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