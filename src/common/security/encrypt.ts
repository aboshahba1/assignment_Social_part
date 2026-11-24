
import crypto from "node:crypto";
import { ENCRYPTION_KEY, IV_LENGTH } from "../../config/config.service.js";

const ENCRYPTION_KEY_Buffer = Buffer.from(ENCRYPTION_KEY, "utf8");

export function encrypt(text: string): string {
    const iv = crypto.randomBytes(IV_LENGTH);

    const cipher = crypto.createCipheriv(
        "aes-256-cbc",
        ENCRYPTION_KEY_Buffer,
        iv
    );

    let encrypted = cipher.update(text, "utf8", "hex");
    encrypted += cipher.final("hex");

    return iv.toString("hex") + ":" + encrypted;
}

export function Decrypt(text: string): string {
    const [ivHex, encryptedText] = text.split(":");

    if (!ivHex || !encryptedText) {
        throw new Error("Invalid encrypted text");
    }

    const iv = Buffer.from(ivHex, "hex");

    const decipher = crypto.createDecipheriv(
        "aes-256-cbc",
        ENCRYPTION_KEY_Buffer,
        iv
    );

    let decrypted = decipher.update(encryptedText, "hex", "utf8");
    decrypted += decipher.final("utf8");

    return decrypted;
}
