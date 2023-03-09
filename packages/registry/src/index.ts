import * as dotenv from 'dotenv';
import {createServer, IncomingMessage, ServerResponse} from "http";
import {options} from "./middleware/options";
import {json} from "./middleware/json";
import {get} from "./middleware/get";
import {Middleware} from "./middleware/Middleware";

dotenv.config({path: '.env.local'});

function createMiddleware() {
    const middlewares: Middleware[] = [];
    return {
        addMiddleware: (middleware: Middleware) => {
            middlewares.push(middleware)
        },
        run: async (request: IncomingMessage, response: ServerResponse<IncomingMessage> & { req: IncomingMessage }) => {
            for (const middleware of middlewares) {
                const next: any = await (() => new Promise((resolve) => {
                    middleware(request, response, resolve)
                }))();
                if (next === false) {
                    return;
                }
            }
        }
    }
}

let serverPort: number = parseInt(process.env.SERVER_PORT);


let timeoutId: NodeJS.Timeout | number = 0;

function runServer() {

    const middleware = createMiddleware();
    middleware.addMiddleware(options);
    middleware.addMiddleware(get);
    middleware.addMiddleware(json);


    const server = createServer((req, res) => middleware.run(req, res));
    server.listen(serverPort);
    server.on('error', (e: any) => {
        if (e.code === 'EADDRINUSE') {
            console.log('Address in use, retrying...');
            clearTimeout(timeoutId);
            timeoutId = setTimeout(() => {
                server.close();
                server.listen(++serverPort);
                clearTimeout(timeoutId);
            }, 1000);
        }
    });
    server.on("listening", () => {
        console.log('Server is listening on ', serverPort);
    })

}

runServer();