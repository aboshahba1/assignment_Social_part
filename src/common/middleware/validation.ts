
import type { Request, Response, NextFunction } from "express";
import type { ZodType } from "zod";
import { AppError } from "../utils/globalErrorHandling.js";

type ReqType = keyof Request;
type SchemaType = Partial<Record<ReqType, ZodType>>;

export const Validation = (schema: SchemaType) => {
    return async (req: Request, res: Response, next: NextFunction) => {

        const ResultError: string[] = [];

        for (const key of Object.keys(schema) as ReqType[]) {
            const currentSchema = schema[key];

            if (!currentSchema) continue;

            const result = currentSchema.safeParse(req[key]);

            if (!result.success) {
                ResultError.push(
                    ...result.error.issues.map(issue => issue.message)
                );
            }
        }

        if (ResultError.length > 0) {
            throw new AppError(ResultError.join(", "), 400);
        }

        next();
    };
};
