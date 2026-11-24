import { AppError } from "../utils/globalErrorHandling.js";
export const Validation = (schema) => {
    return async (req, res, next) => {
        const ResultError = [];
        for (const key of Object.keys(schema)) {
            if (!schema[key])
                continue;
            const result = schema[key].safeParse(req[key]);
            if (!result.success) {
                ResultError.push(result.error.message);
            }
        }
        if (ResultError.length > 0) {
            throw new AppError(JSON.parse(ResultError.join(", ")), 400);
        }
        next();
    };
};
