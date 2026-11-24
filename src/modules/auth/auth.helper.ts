
import { hashSync } from "bcrypt";
import sendEmail, { generate_otp } from "../../common/service/sendEmail.js";
import { emailTemplate } from "../../common/utils/email.template.js";
import { eventEmitter } from "../../common/utils/events.js";
import {
    getValue,
    incr,
    setValue,
    ttl
} from "../../DB/service/redis.service.js";
import userModel from "../../DB/models/user.model.js";
import dbRepository from "../../DB/repositories/db.repository.js";

interface SendEmailOtpOptions {
    email: string;
    isConfirmed: boolean;
    subject?: string;
    otpKey?: string;
}

export const SendEmailOtp = async ({
    email,
    isConfirmed,
    subject = "Confirm Email",
    otpKey
}: SendEmailOtpOptions): Promise<void> => {

    // Separate OTP keys for different operations
    const baseKey = otpKey || `otp::${email}`;
    const blockedKey = `${baseKey}::blocked`;
    const maxKey = `${baseKey}::max`;

    // Check if the email is blocked
    const isBlocked_ttl = await ttl(blockedKey);

    if (isBlocked_ttl > 0) {
        throw new Error(
            `You have been blocked. You can resend OTP after ${isBlocked_ttl} seconds`
        );
    }

    if (isBlocked_ttl < 0) {
        const maxAttempts = Number(
            await getValue(maxKey)
        ) || 0;

        if (maxAttempts >= 3) {
            await setValue({
                key: maxKey,
                value: 0,
                ttl: 60 * 5
            });
        }
    }

    // Check existing OTP expiration
    const otpTTL = await ttl(baseKey);

    if (otpTTL > 0) {
        throw new Error(
            `You can resend OTP after ${otpTTL} seconds`
        );
    }

    // Check maximum OTP attempts
    const max_otp = Number(
        await getValue(maxKey)
    ) || 0;

    if (max_otp >= 3) {
        await setValue({
            key: blockedKey,
            value: "1",
            ttl: 60 * 10
        });

        throw new Error("You have exceeded the maximum number of tries");
    }

    // Find user
    const user = await dbRepository.findOne({
        model: userModel,
        filter: {
            email,
            isConfirmed
        }
    });

    if (!user) {
        throw new Error(
            "User does not exist or has the wrong confirmation status"
        );
    }

    // Generate and hash OTP
    const otp = await generate_otp();
    const otpHash = hashSync(otp, 12);

    // Save OTP in Redis
    await setValue({
        key: baseKey,
        value: otpHash,
        ttl: 60 * 20
    });

    // Send email
    eventEmitter.emit("confirm_email", async () => {
        await sendEmail({
            to: email,
            subject,
            html: emailTemplate(otp)
        });
    });

    // Increment OTP attempts
    await incr(maxKey);
};
