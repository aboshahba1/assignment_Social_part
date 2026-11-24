import { type NextFunction, type Request, type Response } from "express";

export class AppError extends Error {
    constructor(message: string, public statusCode: number) {
        super(message);
        this.name = "AppError";
    }
}

export const GlobalErrorHadnling = (
    err: Error,
    req: Request,
    res: Response,
    next: NextFunction
) => {
    const statusCode = err instanceof AppError ? err.statusCode : 500;

    return res.status(statusCode).json({
        success: false,
        message: err.message,
        statusCode,
        ...(process.env.NODE_ENV === "development" && { stack: err.stack })
    });
};