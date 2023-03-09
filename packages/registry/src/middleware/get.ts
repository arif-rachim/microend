import {Middleware} from "./Middleware";
import {Handler} from "../handlers/Handler";
import {moduleHandler} from "../handlers/moduleHandler";
import {uploadGetHandler} from "../handlers/uploadGetHandler";


const MAPPER = {
    'module': moduleHandler,
    'upload': uploadGetHandler
}
export const get: Middleware = (req, res, next) => {
    if (req.method === 'GET') {
        const [pathMethod, query] = req.url.split('/').filter(v => v).join('/').split('?');
        const parameters = (query ?? "").split('&').reduce((result, keyValue) => {
            const [key, value] = keyValue.split('=');
            result[key] = value;
            return result;
        }, {})
        const handler: Handler = MAPPER[pathMethod];
        if (handler === undefined) {
            res.writeHead(404);
            res.end(JSON.stringify({error: 'Resource Not Found'}));
            return next(false);
        }
        (async () => {
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
        })();
    } else {
        next(true);
    }

}