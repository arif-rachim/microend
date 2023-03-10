import {Middleware} from "./Middleware";
import {Handler} from "../handlers/Handler";
import {moduleContentHandler, moduleHandler} from "../handlers/moduleHandler";
import {uploadGetHandler} from "../handlers/uploadGetHandler";
import {IncomingMessage} from "http";


const MAPPER: Mapper = {
    'module/$moduleName': moduleHandler,
    'module/$moduleName/content': moduleContentHandler,
    'upload': uploadGetHandler
}

export function getParamsAndHandler(req: IncomingMessage, mapper: Mapper) {
    const [pathMethod, query] = req.url.split('/').filter(v => v).join('/').split('?');
    const queryParams = (query ?? "").split('&').reduce((result, keyValue) => {
        const [key, value] = keyValue.split('=');
        if (key) {
            result[key] = value;
        }
        return result;
    }, {});

    const {handler, params} = getMostMatchingPart(pathMethod, mapper);
    const parameters = {...queryParams, ...params}
    return {parameters, handler};
}

export const get: Middleware = async (req, res, next) => {
    if (req.method !== 'GET') {
        return next(true);
    }
    const {parameters, handler} = getParamsAndHandler(req, MAPPER);
    if (handler === undefined) {
        res.writeHead(404);
        res.end(JSON.stringify({error: 'Resource Not Found'}));
        return next(false);
    }

    const result = await (() => new Promise((resolve) => {
        handler(parameters, resolve)
    }))();
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    if (typeof result === 'object') {
        res.setHeader('Content-Type', 'application/json');
        res.writeHead(200);
        res.end(JSON.stringify(result));

    } else {
        res.setHeader('Content-Type', 'text/html');
        res.writeHead(200);
        res.end(result);

    }
    return next(false);


}

export type Mapper = { [k: string]: Handler };

function getMostMatchingPart(url: string, mapper: Mapper): { handler: Handler, params: { [k: string]: string } } {
    const mapKeys = Object.keys(mapper);
    let mostMatch: { totalMatch: number, mapperKey: string } = {totalMatch: 0, mapperKey: ''};

    const urlsSegment = url.split('/');
    mapKeys.forEach((mapKey, index) => {
        const segments = mapKey.split('/');
        let totalMatch = 0;
        segments.forEach((segment, segmentIndex) => {
            if (segment.startsWith('?')) {
                return;
            }
            if (segment === urlsSegment[segmentIndex]) {
                totalMatch++;
            }
        })
        if (totalMatch > mostMatch.totalMatch) {
            mostMatch.totalMatch = totalMatch;
            mostMatch.mapperKey = mapKey
        }
    });
    // now we got most match lets do it baby
    const params = {}
    const keys = mostMatch.mapperKey.split('/');

    keys.forEach((key, index) => {
        if (key.startsWith('$')) {
            params[key.substring(1, key.length)] = urlsSegment[index];
        }
    })
    return {handler: mapper[mostMatch.mapperKey], params}
}