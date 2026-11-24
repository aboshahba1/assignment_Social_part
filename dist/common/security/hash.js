import { compareSync, hashSync } from "bcrypt";
export const Hash = async (plainText, SALT_ROUND = 12) => {
    return hashSync(plainText, SALT_ROUND);
};
export const Compare = async (plainText, cipherText) => {
    return compareSync(plainText, cipherText);
};
