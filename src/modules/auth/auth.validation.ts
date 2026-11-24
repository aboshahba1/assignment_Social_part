
import * as z from "zod";
import { GenderEnum } from "../../common/enum/user.enum.js";

// Password rule used during signup
const passwordSchema = z
    .string()
    .regex(/^([A-Za-z])(?=.*\d)[A-Za-z\d]{8,}$/);

// ================= SIGN UP =================

export const signUpSchema = {
    body: z.strictObject({
        fName: z.string().min(3).max(20).trim(),
        lName: z.string().min(3).max(20).trim(),
        email: z.string().email(),
        password: passwordSchema,
        cPassword: z.string(),
        age: z.number().int().positive(),
        gender: z.enum(GenderEnum).optional(),
        phone: z.string().min(1)
    }).superRefine((val, ctx) => {
        if (val.password !== val.cPassword) {
            ctx.addIssue({
                code: "custom",
                message: "Password and confirm password must be the same",
                path: ["cPassword"]
            });
        }
    })
};

// ================= CONFIRM EMAIL =================

export const confirmEmailSchema = {
    body: z.object({
        email: z.string().email(),
        otp: z.string().min(1)
    })
};

// ================= RESEND OTP =================

export const reSendOtpSchema = {
    body: z.object({
        email: z.string().email()
    })
};

// ================= SIGN UP WITH GMAIL =================

export const signUpWithGmailSchema = {
    body: z.object({
        idToken: z.string().min(1)
    })
};

// ================= SIGN IN =================

export const signinSchema = {
    body: z.object({
        email: z.string().email(),
        password: z.string().min(1)
    })
};

// ================= SHARE PROFILE =================

export const shareProfileSchema = {
    params: z.object({
        id: z.string().min(1)
    })
};

// ================= REFRESH TOKEN =================

export const refreshTokenSchema = {
    headers: z.object({
        authorization: z.string().min(1)
    })
};

// ================= FORGOT PASSWORD =================

export const forgotPasswordSchema = {
    body: z.object({
        email: z.string().email()
    })
};

// ================= RESET PASSWORD =================

export const resetPasswordSchema = {
    body: z.object({
        email: z.string().email(),
        code: z.string().min(1),
        password: passwordSchema
    })
};

// ================= UPDATE PROFILE =================

export const updateProfileSchema = {
    body: z.object({
        fName: z.string().min(3).max(20).trim().optional(),
        lName: z.string().min(3).max(20).trim().optional(),
        age: z.number().int().positive().optional(),
        gender: z.enum(GenderEnum).optional(),
        phone: z.string().min(1).optional()
    })
};

// ================= UPDATE PASSWORD =================

export const updatePasswordSchema = {
    body: z.object({
        oldPassword: z.string().min(1),
        newPassword: passwordSchema
    })
};

// ================= LOGOUT =================

export const logoutSchema = {
    query: z.object({
        flag: z.string().optional()
    })
};
