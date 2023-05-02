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

export function parseContentInfo(content: string): ContentInfo {
    const name = getMetaData('name', content)[0];
    const dependencies = (getMetaData('dependencies', content)[0] ?? '').split(',').filter(s => s).map(s => s.trim())
    const description = getMetaData('description', content)[0];
    const author = getMetaData('author', content)[0];
    const iconDataURI = getIconURI(content)[0];
    const visibleInHomeScreen = (getMetaData('visibleInHomeScreen', content)[0]) === "true";
    const title = getTagContent('title', content);
    const [path, version] = name.split('@').filter(s => s);
    const size = new Blob([content]).size;
    return {name, dependencies, description, author, iconDataURI, visibleInHomeScreen, title, path, version, size};
}

function getMetaData(metaName: string, htmlText: string) {
    return getTagData({metaName, htmlText, metaKey: 'name', contentKey: 'content'});
}

function getIconURI(htmlText: string) {
    return getTagData({metaName: 'icon', metaKey: 'rel', contentKey: 'href', htmlText});
}

function getTagData(props: { metaName: string, htmlText: string, metaKey: string, contentKey: string }): string[] {
    const {contentKey, metaKey, metaName, htmlText} = props;
    const result: string[] = [];
    let index = 0;
    do {
        const [value, endIndex] = scanText({metaName, htmlText, startingIndex: index, metaKey, contentKey});
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

function scanText(props: { metaName: string, htmlText: string, startingIndex: number, metaKey: string, contentKey: string }): [string, number] {
    let {metaName, htmlText, startingIndex, metaKey, contentKey} = props;
    const indexOfContent = htmlText.indexOf(`${metaKey}="${metaName}"`, startingIndex);
    if (indexOfContent < 0) {
        return ['', -1];
    }
    const startTagIndex = htmlText.substring(startingIndex, indexOfContent).lastIndexOf('<') + startingIndex;
    const endTagIndex = htmlText.substring(indexOfContent, htmlText.length).indexOf('>') + indexOfContent
    let content = '';
    if (startTagIndex >= 0 && endTagIndex > startTagIndex) {
        content = htmlText.substring(startTagIndex, endTagIndex).split(`${contentKey}="`)[1].split('"')[0];
    }
    return [content, endTagIndex];
}