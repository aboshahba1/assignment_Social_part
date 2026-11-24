
import { compareSync, hashSync } from "bcrypt";

export const Hash = async (
    plainText: string,
    SALT_ROUND: number = 12
): Promise<string> => {
    return hashSync(plainText, SALT_ROUND);
};

export const Compare = async (
    plainText: string,
    cipherText: string
): Promise<boolean> => {
    return compareSync(plainText, cipherText);
};
