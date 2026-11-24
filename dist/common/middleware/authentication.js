import jwt from "jsonwebtoken";
import { ACCESS_TOKEN_SIGNATURE } from "../../config/config.service.js";
import { AppError } from "../utils/globalErrorHandling.js";
import { getValue } from "../../DB/service/redis.service.js";
export const authentication = async (req, res, next) => {
    try {
        const authorization = req.headers.authorization;
        if (!authorization || !authorization.startsWith("Bearer ")) {
            throw new AppError("Token is required", 401);
        }
        const token = authorization.split(" ")[1];
        if (!token) {
            throw new AppError("Invalid token", 401);
        }
        const decoded = jwt.verify(token, ACCESS_TOKEN_SIGNATURE);
        if (!decoded.jti) {
            throw new AppError("Invalid token", 401);
        }
        // Check Redis session
        const session = await getValue(`session::${decoded.jti}`);
        if (!session || String(session) !== decoded.id) {
            throw new AppError("Session expired or revoked", 401);
        }
        req.user = decoded;
        next();
    }
    catch (error) {
        next(error);
    }
};
