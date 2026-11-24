
import { config } from "dotenv";
import { resolve } from "node:path";

const NODE_ENV = process.env.NODE_ENV || "development";

const envPath = {
    development: ".env.development",
    production: ".env.production",
};

config({ path: resolve(envPath[NODE_ENV as keyof typeof envPath]) });

export const PORT = Number(process.env.PORT) || 3000;
export const DB_URI = process.env.DB_URI!;
export const REDIS_URL = process.env.REDIS_URL!;
export const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY!;
export const IV_LENGTH = Number(process.env.IV_LENGTH);
export const EMAIL = process.env.EMAIL!;
export const PASSWORD = process.env.PASSWORD!;
export const AUDIENCE_GMAIL = process.env.AUDIENCE_GMAIL!;
export const ACCESS_TOKEN_SIGNATURE = process.env.ACCESS_TOKEN_SIGNATURE!;
export const REFRESH_TOKEN_SIGNATURE = process.env.REFRESH_TOKEN_SIGNATURE!;

export const ALLOW_ORIGINS = process.env.ALLOW_ORIGINS?.split(",") || [];
export const AWS_REGION = process.env.AWS_REGION!;
export const AWS_ACCESS_KEY_ID = process.env.AWS_ACCESS_KEY_ID!;
export const AWS_SECRET_ACCESS_KEY = process.env.AWS_SECRET_ACCESS_KEY!;
export const AWS_BUCKET_NAME = process.env.AWS_BUCKET_NAME!;