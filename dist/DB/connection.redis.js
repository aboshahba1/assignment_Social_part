import { createClient } from "redis";
import { REDIS_URL } from "../config/config.service.js";
export const redis_client = createClient({
    url: REDIS_URL
});
redis_client.on("error", (error) => {
    console.error("Redis Client Error:", error);
});
export default async function connectRedis() {
    try {
        await redis_client.connect();
        console.log("Redis Connected Successfully");
    }
    catch (error) {
        console.error("Redis Connection failed:", error);
        throw error;
    }
}
