// old way
// import type { Response } from "express";

// interface SuccessResponseOptions {
//     res: Response;
//     statusCode?: number;
//     message?: string;
//     data?: unknown;
// }

// export const success_response = ({
//     res,
//     statusCode = 200,
//     message = "Done",
//     data
// }: SuccessResponseOptions) => {
//     return res.status(statusCode).json({
//         message,
//         data
//     });
// };
// ==================================================================================

// new way
import type { NextFunction, Request, Response } from "express";

interface SuccessResponseOptions {
    statusCode?: number;
    message?: string;
    data?: unknown;
}

type SuccessHandler = (
    req: Request,
    res: Response,
    next: NextFunction
) => Promise<SuccessResponseOptions> | SuccessResponseOptions;

export const successResponse = (fn: SuccessHandler) => {
    return async (req: Request, res: Response, next: NextFunction) => {

        const result = await fn(req, res, next);

        if (res.headersSent) return;

        const {
            statusCode = 200,
            message = "done",
            data = undefined
        } = result;

        return res.status(statusCode).json({
            message,
            data
        });
    };
};

