import userModel from "../../DB/models/user.model.js";
import dbRepository from "../../DB/repositories/db.repository.js";
import { AppError } from "../../common/utils/globalErrorHandling.js";
import { Hash, Compare } from "../../common/security/hash.js";
import { encrypt } from "../../common/security/encrypt.js";
import { SendEmailOtp } from "./auth.helper.js";
import jwt from "jsonwebtoken";
import { randomUUID } from "node:crypto";
import { getValue, deleteKey, setValue, keys } from "../../DB/service/redis.service.js";
import { ACCESS_TOKEN_SIGNATURE, REFRESH_TOKEN_SIGNATURE, AUDIENCE_GMAIL } from "../../config/config.service.js";
import { OAuth2Client } from "google-auth-library";
import { ProviderEnum } from "../../common/enum/user.enum.js";
import { success_response } from "../../common/utils/success.response.js";
const client = new OAuth2Client();
class AuthService {
    _dbRepository = dbRepository;
    // =================signUp method=================
    signUp = async (req, res, next) => {
        const { email, fName, lName, password, age, gender, phone } = req.body;
        const emailExist = await this._dbRepository.findOne({
            model: userModel,
            filter: { email }
        });
        if (emailExist) {
            throw new AppError("Email already exists", 409);
        }
        const hashedPassword = await Hash(password);
        const encryptedPhone = phone ? encrypt(phone) : undefined;
        const user = await this._dbRepository.create({
            model: userModel,
            data: {
                email,
                fName,
                lName,
                password: hashedPassword,
                age,
                ...(gender && { gender }),
                ...(encryptedPhone && { phone: encryptedPhone })
            }
        });
        const { password: _password, phone: _phone, ...safeUser } = user.toObject();
        await SendEmailOtp({
            email,
            isConfirmed: false,
            subject: "Confirm Your Email"
        });
        return success_response({
            res,
            statusCode: 201,
            message: "User registered successfully.",
            data: { user: safeUser }
        });
    };
    // =================confirmEmail method=================
    confirmEmail = async (req, res, next) => {
        const { email, otp } = req.body;
        const otpValue = await getValue(`otp::${email}`);
        if (!otpValue) {
            throw new AppError("OTP expired", 400);
        }
        const isOtpValid = await Compare(otp, String(otpValue));
        if (!isOtpValid) {
            throw new AppError("Invalid OTP", 400);
        }
        const user = await this._dbRepository.findOneAndUpdate({
            model: userModel,
            filter: {
                email,
                isConfirmed: false
            },
            update: {
                isConfirmed: true
            },
            options: {
                new: true
            }
        });
        if (!user) {
            throw new AppError("User not found or already confirmed", 404);
        }
        await deleteKey(`otp::${email}`);
        const tokenId = randomUUID();
        const access_token = jwt.sign({ id: user._id.toString(), email: user.email }, ACCESS_TOKEN_SIGNATURE, {
            expiresIn: 300,
            jwtid: tokenId
        });
        const refresh_token = jwt.sign({ id: user._id.toString(), email: user.email }, REFRESH_TOKEN_SIGNATURE, {
            expiresIn: 60 * 60,
            jwtid: tokenId
        });
        await setValue({
            key: `session::${tokenId}`,
            value: user._id.toString(),
            ttl: 60 * 60
        });
        return success_response({
            res,
            statusCode: 200,
            message: "Email confirmed successfully",
            data: {
                access_token,
                refresh_token
            }
        });
    };
    // =================reSendOtp method=================
    reSendOtp = async (req, res, next) => {
        const { email } = req.body;
        await SendEmailOtp({
            email,
            isConfirmed: false
        });
        return success_response({
            res,
            statusCode: 200,
            message: "OTP sent successfully"
        });
    };
    // =================signUpWithGmail method=================
    signUpWithGmail = async (req, res, next) => {
        const { idToken } = req.body;
        const ticket = await client.verifyIdToken({
            idToken,
            audience: AUDIENCE_GMAIL
        });
        const payload = ticket.getPayload();
        if (!payload?.email || !payload.email_verified) {
            throw new AppError("Invalid Google account", 401);
        }
        const { email, given_name, family_name, picture } = payload;
        let user = await this._dbRepository.findOne({
            model: userModel,
            filter: {
                email: email.toLowerCase()
            }
        });
        if (!user) {
            user = await this._dbRepository.create({
                model: userModel,
                data: {
                    fName: given_name || "Google",
                    lName: family_name || "User",
                    email: email.toLowerCase(),
                    ...(picture && { profileImage: picture }),
                    isConfirmed: true,
                    provider: ProviderEnum.google
                }
            });
        }
        if (user.provider !== ProviderEnum.google) {
            throw new AppError("Please login using your email and password", 400);
        }
        const tokenId = randomUUID();
        const access_token = jwt.sign({
            id: user._id.toString(),
            email: user.email
        }, ACCESS_TOKEN_SIGNATURE, {
            expiresIn: 300,
            jwtid: tokenId
        });
        const refresh_token = jwt.sign({
            id: user._id.toString(),
            email: user.email
        }, REFRESH_TOKEN_SIGNATURE, {
            expiresIn: 60 * 60,
            jwtid: tokenId
        });
        await setValue({
            key: `session::${tokenId}`,
            value: user._id.toString(),
            ttl: 60 * 60
        });
        return success_response({
            res,
            statusCode: 200,
            message: "Google signup successful",
            data: {
                access_token,
                refresh_token
            }
        });
    };
    // =================signin method=================
    signin = async (req, res, next) => {
        const { email, password } = req.body;
        const user = await this._dbRepository.findOne({
            model: userModel,
            filter: {
                email: email.toLowerCase(),
                isConfirmed: true,
                provider: ProviderEnum.system
            }
        });
        if (!user) {
            throw new AppError("Email does not exist or please use your signup provider", 404);
        }
        if (!user.password) {
            throw new AppError("Password not found", 400);
        }
        const isPasswordValid = await Compare(password, user.password);
        if (!isPasswordValid) {
            throw new AppError("Invalid password", 401);
        }
        const tokenId = randomUUID();
        const access_token = jwt.sign({
            id: user._id.toString(),
            email: user.email
        }, ACCESS_TOKEN_SIGNATURE, {
            expiresIn: 60 * 5,
            jwtid: tokenId
        });
        const refresh_token = jwt.sign({
            id: user._id.toString(),
            email: user.email
        }, REFRESH_TOKEN_SIGNATURE, {
            expiresIn: 60 * 60,
            jwtid: tokenId
        });
        await setValue({
            key: `session::${tokenId}`,
            value: user._id.toString(),
            ttl: 60 * 60
        });
        return success_response({
            res,
            statusCode: 200,
            message: "Login successful",
            data: {
                access_token,
                refresh_token
            }
        });
    };
    // =================getProfile method=================
    getProfile = async (req, res, next) => {
        if (!req.user) {
            throw new AppError("Unauthorized", 401);
        }
        const user = await this._dbRepository.findById({
            model: userModel,
            id: req.user.id,
            projection: "-password -phone"
        });
        if (!user) {
            throw new AppError("User not found", 404);
        }
        return success_response({
            res,
            statusCode: 200,
            message: "Profile retrieved successfully",
            data: { user }
        });
    };
    // =================shareProfile method=================
    shareProfile = async (req, res, next) => {
        const { id } = req.params;
        const user = await this._dbRepository.findById({
            model: userModel,
            id: id,
            projection: "fName lName profileImage isPrivate"
        });
        if (!user) {
            throw new AppError("User not found", 404);
        }
        return success_response({
            res,
            statusCode: 200,
            message: "Profile retrieved successfully",
            data: { user }
        });
    };
    // =================refresh_token method=================
    refresh_token = async (req, res, next) => {
        try {
            const authorization = req.headers.authorization;
            if (!authorization) {
                throw new AppError("Refresh token is required", 401);
            }
            const decoded = jwt.verify(authorization, REFRESH_TOKEN_SIGNATURE);
            if (!decoded.id) {
                throw new AppError("Invalid refresh token", 401);
            }
            const session = await getValue(`session::${decoded.jti}`);
            if (!session || String(session) !== decoded.id) {
                throw new AppError("Session expired or revoked", 401);
            }
            const user = await this._dbRepository.findById({
                model: userModel,
                id: decoded.id
            });
            if (!user) {
                throw new AppError("User not found", 404);
            }
            const newTokenId = randomUUID();
            const access_token = jwt.sign({
                id: user._id.toString(),
                email: user.email
            }, ACCESS_TOKEN_SIGNATURE, {
                expiresIn: 60 * 5,
                jwtid: newTokenId
            });
            const refresh_token = jwt.sign({
                id: user._id.toString(),
                email: user.email
            }, REFRESH_TOKEN_SIGNATURE, {
                expiresIn: 60 * 60,
                jwtid: newTokenId
            });
            await setValue({
                key: `session::${newTokenId}`,
                value: user._id.toString(),
                ttl: 60 * 60
            });
            await deleteKey(`session::${decoded.jti}`);
            return success_response({
                res,
                statusCode: 200,
                message: "Token refreshed successfully",
                data: {
                    access_token,
                    refresh_token
                }
            });
        }
        catch (error) {
            if (error instanceof AppError) {
                throw error;
            }
            throw new AppError("Invalid or expired refresh token", 401);
        }
    };
    // =================updateProfile method=================
    updateProfile = async (req, res, next) => {
        if (!req.user) {
            throw new AppError("Unauthorized", 401);
        }
        const { fName, lName, age, gender, phone } = req.body;
        const updateQuery = {};
        if (fName !== undefined)
            updateQuery.fName = fName;
        if (lName !== undefined)
            updateQuery.lName = lName;
        if (age !== undefined)
            updateQuery.age = age;
        if (gender !== undefined)
            updateQuery.gender = gender;
        if (phone !== undefined)
            updateQuery.phone = encrypt(phone);
        const user = await this._dbRepository.findByIdAndUpdate({
            model: userModel,
            id: req.user.id,
            update: { $set: updateQuery },
            options: {
                returnDocument: "after",
                runValidators: true
            }
        });
        if (!user) {
            throw new AppError("User not found", 404);
        }
        const { password: _password, phone: _phone, ...safeUser } = user.toObject();
        return success_response({
            res,
            statusCode: 200,
            message: "Profile updated successfully",
            data: { user: safeUser }
        });
    };
    // =================updatePassword method=================
    updatePassword = async (req, res, next) => {
        if (!req.user) {
            throw new AppError("Unauthorized", 401);
        }
        const { oldPassword, newPassword } = req.body;
        const user = await this._dbRepository.findById({
            model: userModel,
            id: req.user.id
        });
        if (!user) {
            throw new AppError("User not found", 404);
        }
        if (!user.password) {
            throw new AppError("Password not found", 400);
        }
        const isPasswordValid = await Compare(oldPassword, user.password);
        if (!isPasswordValid) {
            throw new AppError("Invalid old password", 400);
        }
        await this._dbRepository.findByIdAndUpdate({
            model: userModel,
            id: req.user.id,
            update: {
                $set: {
                    password: await Hash(newPassword),
                    changeCredentialAt: new Date()
                }
            },
            options: {
                runValidators: true
            }
        });
        return success_response({
            res,
            statusCode: 200,
            message: "Password updated successfully"
        });
    };
    // =================forgotPassword method=================
    forgotPassword = async (req, res, next) => {
        const { email } = req.body;
        const normalizedEmail = email.toLowerCase();
        const user = await this._dbRepository.findOne({
            model: userModel,
            filter: {
                email: normalizedEmail,
                isConfirmed: true,
                provider: ProviderEnum.system
            }
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
        return success_response({
            res,
            statusCode: 200,
            message: "Password reset OTP sent successfully"
        });
    };
    // =================resetPassword method=================
    resetPassword = async (req, res, next) => {
        const { email, otp, newPassword } = req.body;
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
        const user = await this._dbRepository.findOne({
            model: userModel,
            filter: {
                email: normalizedEmail,
                isConfirmed: true,
                provider: ProviderEnum.system
            }
        });
        if (!user) {
            throw new AppError("User not found", 404);
        }
        await this._dbRepository.findByIdAndUpdate({
            model: userModel,
            id: user._id.toString(),
            update: {
                $set: {
                    password: await Hash(newPassword),
                    changeCredentialAt: new Date()
                }
            },
            options: {
                runValidators: true
            }
        });
        await deleteKey([
            otpKey,
            `${otpKey}::max`,
            `${otpKey}::blocked`
        ]);
        const sessionKeys = await keys("session::");
        const userSessions = [];
        for (const key of sessionKeys) {
            const sessionUserId = await getValue(key);
            if (String(sessionUserId) === user._id.toString()) {
                userSessions.push(key);
            }
        }
        if (userSessions.length) {
            await deleteKey(userSessions);
        }
        return success_response({
            res,
            statusCode: 200,
            message: "Password reset successfully. Please login again."
        });
    };
    // =================logout method=================
    logout = async (req, res, next) => {
        const authorization = req.headers.authorization;
        if (!authorization) {
            throw new AppError("Refresh token is required", 401);
        }
        const decoded = jwt.verify(authorization, REFRESH_TOKEN_SIGNATURE);
        if (!decoded.jti) {
            throw new AppError("Invalid refresh token", 401);
        }
        const session = await getValue(`session::${decoded.jti}`);
        if (!session || String(session) !== decoded.id) {
            throw new AppError("Session expired or revoked", 401);
        }
        await deleteKey(`session::${decoded.jti}`);
        return success_response({
            res,
            statusCode: 200,
            message: "Logged out successfully"
        });
    };
    // =================logoutAll method=================
    logoutAll = async (req, res, next) => {
        if (!req.user) {
            throw new AppError("Unauthorized", 401);
        }
        const sessionKeys = await keys("session::");
        const userSessions = [];
        for (const key of sessionKeys) {
            const sessionUserId = await getValue(key);
            if (String(sessionUserId) === req.user.id) {
                userSessions.push(key);
            }
        }
        if (userSessions.length) {
            await deleteKey(userSessions);
        }
        return success_response({
            res,
            statusCode: 200,
            message: "Logged out from all devices successfully"
        });
    };
}
export default new AuthService();
