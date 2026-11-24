export const emailTemplate = (otp) => {
    return `
        <div style="font-family: Arial, sans-serif; padding: 20px; text-align: center;">
            <h2>Email Confirmation</h2>
            <p>Use the following OTP to confirm your email address:</p>
            <h1 style="color: #007bff; letter-spacing: 5px;">${otp}</h1>
            <p>This OTP will expire in 20 minutes.</p>
            <p>If you didn't request this code, please ignore this email.</p>
        </div>
    `;
};
