import { TokenPayload } from "../common/middleware/authentication.js";

declare global {
    namespace Express {
        interface Request {
            user?: TokenPayload;
        }
    }
}

export {};