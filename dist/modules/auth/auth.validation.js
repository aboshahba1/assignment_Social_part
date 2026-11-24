import * as z from "zod";
import { GenderEnum } from "../../common/enum/user.enum.js";
export const signUpSchema = {
    body: z.strictObject({
        fName: z.string().min(3).max(20).trim(),
        lName: z.string().min(3).max(20).trim(),
        email: z.string().email(),
        password: z.string().regex(/^([A-Za-z])(?=.*\d)[A-Za-z\d]{8,}$/),
        cPassword: z.string(),
        gender: z.enum(GenderEnum).optional(),
        phone: z.string()
    })
        // .refine((val) => {
        //     return val.password === val.cPassword
        // }, {
        //     message: "password and confirm password must be the same",
        //     path: ["cPassword"]
        // })
        .superRefine((val, ctx) => {
        if (val.password !== val.cPassword) {
            ctx.addIssue({
                code: "custom",
                message: "password and confirm password must be the same",
                origin: ["cPassword"]
            });
        }
    })
};
