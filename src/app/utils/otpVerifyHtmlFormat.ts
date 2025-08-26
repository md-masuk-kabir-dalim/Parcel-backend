export const otpVerifyHtmlFormat = async (username: string, otp: string) => {
  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Verify Your Spotless Kleen Account</title>
</head>
<body style="font-family: 'Arial', 'Helvetica', sans-serif; background-color: #f4f7fa; margin: 0; padding: 20px; line-height: 1.6;">
    <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 10px; overflow: hidden; box-shadow: 0 2px 10px rgba(0, 0, 0, 0.08);">
        <div style="background-color: #4a90e2; background-image: linear-gradient(135deg, #4a90e2, #63b3ed); padding: 25px; text-align: center;">
            <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 500;">Welcome to Spotless Kleen!</h1>
        </div>
        <div style="padding: 30px; text-align: center;">
            <p style="font-size: 16px; color: #333333; margin: 0 0 15px;">Hi <strong>${username}</strong>,</p>
            <p style="font-size: 15px; color: #555555; margin: 0 0 20px;">You're almost there! Use the code below to verify your account:</p>
            <p style="font-size: 24px; font-weight: bold; color: #4a90e2; background: #f1f5f9; display: inline-block; padding: 12px 25px; border-radius: 8px; letter-spacing: 2px;">
                ${otp}
            </p>
            <p style="font-size: 14px; color: #666666; margin: 15px 0 0;">
                This code is valid for <strong>5 minutes</strong>. Please keep it private.
            </p>
            <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
                <p style="font-size: 13px; color: #6b7280; margin: 0;">Need help? Contact our friendly support team at <a href="mailto:info@spotlesskleen.com" style="color: #4a90e2; text-decoration: none;">info@spotlesskleen.com</a>.</p>
            </div>
        </div>
        <div style="background-color: #f8fafc; padding: 15px; text-align: center; font-size: 12px; color: #9ca3af;">
            <p style="margin: 0;">© ${new Date().getFullYear()} Spotless Kleen. All rights reserved.</p>
        </div>
    </div>
</body>
</html>`;
};
