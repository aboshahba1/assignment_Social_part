
import type { Request } from "express";
import { type IUser } from "../../DB/models/user.model.js";
import authRepository from "../../DB/repositories/auth.repository.js";
import { AppError } from "../../common/utils/globalErrorHandling.js";
import { Hash, Compare } from "../../common/security/hash.js";
import { encrypt } from "../../common/security/encrypt.js";
import { SendEmailOtp } from "./auth.helper.js";
import jwt from "jsonwebtoken";
import { randomUUID } from "node:crypto";
import {
    getValue,
    deleteKey,
    setValue,
    keys
} from "../../DB/service/redis.service.js";
import {
    ACCESS_TOKEN_SIGNATURE,
    REFRESH_TOKEN_SIGNATURE,
    AUDIENCE_GMAIL
} from "../../config/config.service.js";
import { OAuth2Client } from "google-auth-library";
import { ProviderEnum } from "../../common/enum/user.enum.js";
import { successResponse } from "../../common/utils/success.response.js";

const client = new OAuth2Client();

interface SignUpBody {
    fName: string;
    lName: string;
    email: string;
    password: string;
    age: number;
    gender?: IUser["gender"];
    phone?: string;
}

class AuthService {

    private readonly _authRepository = authRepository;

    // =================signUp method=================

    signUp = successResponse(async (req: Request) => {

        const { email, fName, lName, password, age, gender, phone } =
            req.body as SignUpBody;

        const emailExist = await this._authRepository.findUser({ email });

        if (emailExist) {
            throw new AppError("Email already exists", 409);
        }

        const hashedPassword = await Hash(password);
        const encryptedPhone = phone ? encrypt(phone) : undefined;

        const user = await this._authRepository.createUser({
            email,
            fName,
            lName,
            password: hashedPassword,
            age,
            ...(gender && { gender }),
            ...(encryptedPhone && { phone: encryptedPhone })
        });

        const {
            password: _password,
            phone: _phone,
            ...safeUser
        } = user.toObject();

        await SendEmailOtp({
            email,
            isConfirmed: false,
            subject: "Confirm Your Email"
        });

        return {
            statusCode: 201,
            message: "User registered successfully.",
            data: { user: safeUser }
        };
    });

    // =================confirmEmail method=================

    confirmEmail = successResponse(async (req: Request) => {

        const { email, otp } = req.body;

        const otpValue = await getValue(`otp::${email}`);

        if (!otpValue) {
            throw new AppError("OTP expired", 400);
        }

        const isOtpValid = await Compare(otp, String(otpValue));

        if (!isOtpValid) {
            throw new AppError("Invalid OTP", 400);
        }

        const user = await this._authRepository.updateUser(
            {
                email,
                isConfirmed: false
            },
            {
                isConfirmed: true
            }
        );

        if (!user) {
            throw new AppError("User not found or already confirmed", 404);
        }

        await deleteKey(`otp::${email}`);

        const tokenId = randomUUID();

        const access_token = jwt.sign(
            { id: user._id.toString(), email: user.email },
            ACCESS_TOKEN_SIGNATURE,
            {
                expiresIn: 300,
                jwtid: tokenId
            }
        );

        const refresh_token = jwt.sign(
            { id: user._id.toString(), email: user.email },
            REFRESH_TOKEN_SIGNATURE,
            {
                expiresIn: 60 * 60,
                jwtid: tokenId
            }
        );

        await setValue({
            key: `session::${tokenId}`,
            value: user._id.toString(),
            ttl: 60 * 60
        });

        return {
            statusCode: 200,
            message: "Email confirmed successfully",
            data: {
                access_token,
                refresh_token
            }
        };
    });

    // =================reSendOtp method=================

    reSendOtp = successResponse(async (req: Request) => {

        const { email } = req.body;

        await SendEmailOtp({
            email,
            isConfirmed: false
        });

        return {
            statusCode: 200,
            message: "OTP sent successfully"
        };
    });

    // =================signUpWithGmail method=================

    signUpWithGmail = successResponse(async (req: Request) => {

        const { idToken } = req.body;

        const ticket = await client.verifyIdToken({
            idToken,
            audience: AUDIENCE_GMAIL
        });

        const payload = ticket.getPayload();

        if (!payload?.email || !payload.email_verified) {
            throw new AppError("Invalid Google account", 401);
        }

        const {
            email,
            given_name,
            family_name,
            picture
        } = payload;

        let user = await this._authRepository.findUser({
            email: email.toLowerCase()
        });

        if (!user) {
            user = await this._authRepository.createUser({
                fName: given_name || "Google",
                lName: family_name || "User",
                email: email.toLowerCase(),
                ...(picture && { profileImage: picture }),
                isConfirmed: true,
                provider: ProviderEnum.google
            });
        }

        if (user.provider !== ProviderEnum.google) {
            throw new AppError(
                "Please login using your email and password",
                400
            );
        }

        const tokenId = randomUUID();

        const access_token = jwt.sign(
            {
                id: user._id.toString(),
                email: user.email
            },
            ACCESS_TOKEN_SIGNATURE,
            {
                expiresIn: 300,
                jwtid: tokenId
            }
        );

        const refresh_token = jwt.sign(
            {
                id: user._id.toString(),
                email: user.email
            },
            REFRESH_TOKEN_SIGNATURE,
            {
                expiresIn: 60 * 60,
                jwtid: tokenId
            }
        );

        await setValue({
            key: `session::${tokenId}`,
            value: user._id.toString(),
            ttl: 60 * 60
        });

        return {
            statusCode: 200,
            message: "Google signup successful",
            data: {
                access_token,
                refresh_token
            }
        };
    });

    // =================signin method=================

    signin = successResponse(async (req: Request) => {

        const { email, password } = req.body as {
            email: string;
            password: string;
        };

        const user = await this._authRepository.findUser({
            email: email.toLowerCase(),
            isConfirmed: true,
            provider: ProviderEnum.system
        });

        if (!user) {
            throw new AppError(
                "Email does not exist or please use your signup provider",
                404
            );
        }

        if (!user.password) {
            throw new AppError("Password not found", 400);
        }

        const isPasswordValid = await Compare(password, user.password);

        if (!isPasswordValid) {
            throw new AppError("Invalid password", 401);
        }

        const tokenId = randomUUID();

        const access_token = jwt.sign(
            {
                id: user._id.toString(),
                email: user.email
            },
            ACCESS_TOKEN_SIGNATURE,
            {
                expiresIn: 60 * 5,
                jwtid: tokenId
            }
        );

        const refresh_token = jwt.sign(
            {
                id: user._id.toString(),
                email: user.email
            },
            REFRESH_TOKEN_SIGNATURE,
            {
                expiresIn: 60 * 60,
                jwtid: tokenId
            }
        );

        await setValue({
            key: `session::${tokenId}`,
            value: user._id.toString(),
            ttl: 60 * 60
        });

        return {
            statusCode: 200,
            message: "Login successful",
            data: {
                access_token,
                refresh_token
            }
        };
    });

    // =================getProfile method=================

    getProfile = successResponse(async (req: Request) => {

        if (!req.user) {
            throw new AppError("Unauthorized", 401);
        }

        const user = await this._authRepository.findUserById(
            req.user.id,
            "-password -phone"
        );

        if (!user) {
            throw new AppError("User not found", 404);
        }

        return {
            statusCode: 200,
            message: "Profile retrieved successfully",
            data: { user }
        };
    });

    // =================shareProfile method=================

    shareProfile = successResponse(async (req: Request) => {

        const { id } = req.params;

        const user = await this._authRepository.findUserById(
            id as string,
            "fName lName profileImage isPrivate"
        );

        if (!user) {
            throw new AppError("User not found", 404);
        }

        return {
            statusCode: 200,
            message: "Profile retrieved successfully",
            data: { user }
        };
    });

    // =================refresh_token method=================

    refresh_token = successResponse(async (req: Request) => {

        try {
            const authorization = req.headers.authorization;

            if (!authorization) {
                throw new AppError("Refresh token is required", 401);
            }

            const decoded = jwt.verify(
                authorization,
                REFRESH_TOKEN_SIGNATURE
            ) as { id: string; email: string; jti: string };

            if (!decoded.id) {
                throw new AppError("Invalid refresh token", 401);
            }

            const session = await getValue(`session::${decoded.jti}`);

            if (!session || String(session) !== decoded.id) {
                throw new AppError("Session expired or revoked", 401);
            }

            const user = await this._authRepository.findUserById(decoded.id);

            if (!user) {
                throw new AppError("User not found", 404);
            }

            const newTokenId = randomUUID();

            const access_token = jwt.sign(
                {
                    id: user._id.toString(),
                    email: user.email
                },
                ACCESS_TOKEN_SIGNATURE,
                {
                    expiresIn: 60 * 5,
                    jwtid: newTokenId
                }
            );

            const refresh_token = jwt.sign(
                {
                    id: user._id.toString(),
                    email: user.email
                },
                REFRESH_TOKEN_SIGNATURE,
                {
                    expiresIn: 60 * 60,
                    jwtid: newTokenId
                }
            );

            await setValue({
                key: `session::${newTokenId}`,
                value: user._id.toString(),
                ttl: 60 * 60
            });

            await deleteKey(`session::${decoded.jti}`);

            return {
                statusCode: 200,
                message: "Token refreshed successfully",
                data: {
                    access_token,
                    refresh_token
                }
            };

        } catch (error) {
            if (error instanceof AppError) {
                throw error;
            }

            throw new AppError("Invalid or expired refresh token", 401);
        }
    });

    // =================updateProfile method=================

    updateProfile = successResponse(async (req: Request) => {

        if (!req.user) {
            throw new AppError("Unauthorized", 401);
        }

        const { fName, lName, age, gender, phone } = req.body;

        const updateQuery: Partial<Pick<
            IUser,
            "fName" | "lName" | "age" | "gender" | "phone"
        >> = {};

        if (fName !== undefined) updateQuery.fName = fName;
        if (lName !== undefined) updateQuery.lName = lName;
        if (age !== undefined) updateQuery.age = age;
        if (gender !== undefined) updateQuery.gender = gender;
        if (phone !== undefined) updateQuery.phone = encrypt(phone);

        const user = await this._authRepository.updateUserById(
            req.user.id,
            { $set: updateQuery },
            {
                returnDocument: "after",
                runValidators: true
            }
        );

        if (!user) {
            throw new AppError("User not found", 404);
        }

        const {
            password: _password,
            phone: _phone,
            ...safeUser
        } = user.toObject();

        return {
            statusCode: 200,
            message: "Profile updated successfully",
            data: { user: safeUser }
        };
    });

    // =================updatePassword method=================

    updatePassword = successResponse(async (req: Request) => {

        if (!req.user) {
            throw new AppError("Unauthorized", 401);
        }

        const user = await this._authRepository.findUserById(req.user.id);

        if (!user) {
            throw new AppError("User not found", 404);
        }

        if (!user.password) {
            throw new AppError("Password not found", 400);
        }

        const { oldPassword, newPassword } = req.body;

        const isPasswordValid = await Compare(oldPassword, user.password);

        if (!isPasswordValid) {
            throw new AppError("Invalid old password", 400);
        }

        await this._authRepository.updateUserById(
            req.user.id,
            {
                $set: {
                    password: await Hash(newPassword),
                    changeCredentialAt: new Date()
                }
            },
            {
                runValidators: true
            }
        );

        return {
            statusCode: 200,
            message: "Password updated successfully"
        };
    });

    // =================forgotPassword method=================

    forgotPassword = successResponse(async (req: Request) => {

        const { email } = req.body as { email: string };

        const normalizedEmail = email.toLowerCase();

        const user = await this._authRepository.findUser({
            email: normalizedEmail,
            isConfirmed: true,
            provider: ProviderEnum.system
        });

        if (!user) {
            throw new AppError("User not found", 404);
        }

        await SendEmailOtp({
            email: normalizedEmail,
            isConfirmed: true,
            subject: "Reset Your Password",
            otpKey: `password-reset::${normalizedEmail}`
        });

        return {
            statusCode: 200,
            message: "Password reset OTP sent successfully"
        };
    });

    // =================resetPassword method=================

    resetPassword = successResponse(async (req: Request) => {

        const { email, otp, newPassword } = req.body as {
            email: string;
            otp: string;
            newPassword: string;
        };

        const normalizedEmail = email.toLowerCase();
        const otpKey = `password-reset::${normalizedEmail}`;

        const otpValue = await getValue(otpKey);

        if (!otpValue) {
            throw new AppError("OTP expired", 400);
        }

        const isOtpValid = await Compare(otp, String(otpValue));

        if (!isOtpValid) {
            throw new AppError("Invalid OTP", 400);
        }

        const user = await this._authRepository.findUser({
            email: normalizedEmail,
            isConfirmed: true,
            provider: ProviderEnum.system
        });

        if (!user) {
            throw new AppError("User not found", 404);
        }

        await this._authRepository.updateUserById(
            user._id.toString(),
            {
                $set: {
                    password: await Hash(newPassword),
                    changeCredentialAt: new Date()
                }
            },
            {
                runValidators: true
            }
        );

        await deleteKey([
            otpKey,
            `${otpKey}::max`,
            `${otpKey}::blocked`
        ]);

        const sessionKeys = await keys("session::");
        const userSessions: string[] = [];

        for (const key of sessionKeys) {
            const sessionUserId = await getValue(key);

            if (String(sessionUserId) === user._id.toString()) {
                userSessions.push(key);
            }
        }

        if (userSessions.length) {
            await deleteKey(userSessions);
        }

        return {
            statusCode: 200,
            message: "Password reset successfully. Please login again."
        };
    });

    // =================logout method=================

    logout = successResponse(async (req: Request) => {

        const authorization = req.headers.authorization;

        if (!authorization) {
            throw new AppError("Refresh token is required", 401);
        }

        const decoded = jwt.verify(
            authorization,
            REFRESH_TOKEN_SIGNATURE
        ) as { id: string; email: string; jti: string };

        if (!decoded.jti) {
            throw new AppError("Invalid refresh token", 401);
        }

        const session = await getValue(`session::${decoded.jti}`);

        if (!session || String(session) !== decoded.id) {
            throw new AppError("Session expired or revoked", 401);
        }

        await deleteKey(`session::${decoded.jti}`);

        return {
            statusCode: 200,
            message: "Logged out successfully"
        };
    });

    // =================logoutAll method=================

    logoutAll = successResponse(async (req: Request) => {

        if (!req.user) {
            throw new AppError("Unauthorized", 401);
        }

        const sessionKeys = await keys("session::");
        const userSessions: string[] = [];

        for (const key of sessionKeys) {
            const sessionUserId = await getValue(key);

            if (String(sessionUserId) === req.user.id) {
                userSessions.push(key);
            }
        }

        if (userSessions.length) {
            await deleteKey(userSessions);
        }

        return {
            statusCode: 200,
            message: "Logged out from all devices successfully"
        };
    });

    // =================test hook method=================

    // test = async (req: Request, res: Response, next: NextFunction) => {
    //     const user = await this._authRepository.createUser({
    //         email: `ahmed_${Date.now()}@gmail.com`,
    //         password: "ahmed123",
    //         fName: "Test",
    //         lName: "User",
    //         age: 24,
    //         provider: ProviderEnum.system
    //     });

    //     return res.status(200).json({
    //         message: "done",
    //         user
    //     });
    // };

}

export default new AuthService();
