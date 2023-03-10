import {Middleware} from "./Middleware";
import {uploadPostHandler} from "../handlers/uploadPostHandler";
import {getParamsAndHandler} from "./get";

const MAPPER = {
    'upload': uploadPostHandler
}

export const post: Middleware = (req, res, next) => {
    if (req.method !== 'POST') {
        return next(true);
    }
    res.setHeader('Content-Type', 'application/post');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    try {
        const {handler,parameters} = getParamsAndHandler(req,MAPPER);
        if (handler === undefined) {
            res.writeHead(404);
            res.end(JSON.stringify({error: 'Resource Not Found'}));
            return next(false);
        }
        let body = '';
        req.on('data', (chunk) => (body += chunk));
        req.on('end', async () => {
            const json: any = JSON.parse(body);
            const result = await (() => new Promise((resolve) => {
                handler(({...parameters,body:json}), resolve)
            }))();
            res.writeHead(200);
            res.end(JSON.stringify(result));
            return next(false);
        });
    } catch (err) {
        res.setHeader('Content-Type', 'application/post');
        res.writeHead(404);
        res.end(JSON.stringify({error: err.message, stack: err.stack}));
        return next(false);
    }

}
