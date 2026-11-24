import { EventEmitter } from "node:events";

export const eventEmitter = new EventEmitter();

eventEmitter.on("confirm_email", async (fn: () => Promise<void>) => {
    try {
        await fn();
    } catch (error) {
        console.error("Email sending failed:", error);
    }
});