export class AppError extends Error {
    statusCode;
    constructor(message, statusCode) {
        super(message);
        this.statusCode = statusCode;
        this.name = "AppError";
    }
}
export const GlobalErrorHadnling = (err, req, res, next) => {
    const statusCode = err instanceof AppError ? err.statusCode : 500;
    return res.status(statusCode).json({
        success: false,
        message: err.message,
        statusCode,
        ...(process.env.NODE_ENV === "development" && { stack: err.stack })
    });
};
