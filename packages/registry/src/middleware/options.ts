import {Middleware} from "./Middleware";

export const options: Middleware = (req, res, next) => {
    if (req.method === 'OPTIONS') {
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type, authorization');
        res.setHeader('Access-Control-Allow-Methods', 'PATCH, POST, GET, DELETE');

        res.writeHead(200);
        res.end(JSON.stringify({status: 'OK'}));
        return next(false);
    }
    next(true);
}

