
import nodemailer, { type SendMailOptions } from "nodemailer";
import { randomInt } from "node:crypto";
import { EMAIL, PASSWORD } from "../../config/config.service.js";

interface SendEmailOptions {
    to: string | string[];
    subject: string;
    html?: string;
    attachments?: SendMailOptions["attachments"];
}

const sendEmail = async ({
    to,
    subject,
    html,
    attachments
}: SendEmailOptions): Promise<boolean> => {

    const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
            user: EMAIL,
            pass: PASSWORD
        }
    });

    const info = await transporter.sendMail({
        from: `"Aboshahba app" <${EMAIL}>`,
        to,
        subject,
        html: html || "",
        attachments: attachments || []
    });

    return info.accepted.length > 0;
};

export const generate_otp = async (): Promise<string> => {
    return randomInt(100000, 1000000).toString();
};

export default sendEmail;
