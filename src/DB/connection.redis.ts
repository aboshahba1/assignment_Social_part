
import { createClient, type RedisClientType } from "redis";
import { REDIS_URL } from "../config/config.service.js";

class RedisService {
    private readonly redis_client: RedisClientType;

    constructor() {
        this.redis_client = createClient({
            url: REDIS_URL
        });

        this.redis_client.on("error", (error) => {
            console.error("Redis Client Error:", error);
        });
    }

    get client(): RedisClientType {
        return this.redis_client;
    }

    async connect(): Promise<void> {
        try {
            await this.redis_client.connect();
            console.log("Redis Connected Successfully");
        } catch (error) {
            console.error("Redis Connection failed:", error);
            throw error;
        }
    }
}

export default new RedisService();
