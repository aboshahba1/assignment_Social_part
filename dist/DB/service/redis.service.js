import { redis_client } from "../connection.redis.js";
// SET
export const setValue = async ({ key, value, ttl }) => {
    const storedValue = typeof value === "string" ? value : JSON.stringify(value);
    if (ttl !== undefined) {
        await redis_client.set(key, storedValue, { EX: ttl });
    }
    else {
        await redis_client.set(key, storedValue);
    }
};
// UPDATE
export const update = async ({ key, value, ttl }) => {
    try {
        const exists = await redis_client.exists(key);
        if (!exists)
            return 0;
        const storedValue = typeof value === "string" ? value : JSON.stringify(value);
        if (ttl) {
            await redis_client.set(key, storedValue, { EX: ttl });
        }
        else {
            await redis_client.set(key, storedValue);
        }
        return 1;
    }
    catch (error) {
        console.error("Redis update failed:", error);
        return 0;
    }
};
// GET
export const getValue = async (key) => {
    const value = await redis_client.get(key);
    if (value === null)
        return null;
    try {
        return JSON.parse(value);
    }
    catch {
        return value;
    }
};
// TTL
export const ttl = async (key) => {
    return await redis_client.ttl(key);
};
// EXISTS
export const exists = async (key) => {
    try {
        return await redis_client.exists(key);
    }
    catch (error) {
        console.error("Redis exists failed:", error);
        return 0;
    }
};
// EXPIRE
export const expire = async ({ key, ttl }) => {
    try {
        return await redis_client.expire(key, ttl);
    }
    catch (error) {
        console.error("Redis expire failed:", error);
        return 0;
    }
};
// DELETE
export const deleteKey = async (key) => {
    if (!key.length)
        return 0;
    return await redis_client.del(key);
};
// KEYS
export const keys = async (key) => {
    return await redis_client.keys(`${key}*`);
};
// INCREMENT
export const incr = async (key) => {
    return await redis_client.incr(key);
};
