import {IncomingMessage, ServerResponse} from "http";

export type Middleware = (request: IncomingMessage, response: ServerResponse<IncomingMessage> & { req: IncomingMessage }, next: (result: boolean) => void) => void;