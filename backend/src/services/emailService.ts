import { Resend } from 'resend';
import dotenv from 'dotenv';
import path from 'path';

// Load env vars
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || 'noreply@fittrack.com';

/**
 * Send OTP email for verification
 */
export async function sendOtpEmail(email: string, otp: string, purpose: 'verify-email' | 'verify-phone' | 'password-reset') {
  try {
    if (!process.env.RESEND_API_KEY) {
      console.warn('[EMAIL] RESEND_API_KEY not configured. Skipping email send.');
      console.log(`[STUB] Would send OTP ${otp} to ${email} for ${purpose}`);
      return { success: false, message: 'Email service not configured' };
    }

    let subject = '';
    let htmlContent = '';

    if (purpose === 'verify-email') {
      subject = 'Verify Your Email - FITRACK';
      htmlContent = generateOtpEmailHTML(otp, 'Email Verification', 'Verify your email address to complete your FITRACK account setup.');
    } else if (purpose === 'verify-phone') {
      subject = 'Verify Your Phone - FITRACK';
      htmlContent = generateOtpEmailHTML(otp, 'Phone Verification', 'Verify your phone number to complete your FITRACK account setup.');
    } else if (purpose === 'password-reset') {
      subject = 'Reset Your Password - FITRACK';
      htmlContent = generateOtpEmailHTML(otp, 'Password Reset', 'Use this code to reset your FITRACK account password. This code expires in 10 minutes.');
    }

    const response = await resend.emails.send({
      from: FROM_EMAIL,
      to: email,
      subject,
      html: htmlContent,
    });

    if (response.error) {
      console.error('[EMAIL] Error sending OTP email:', response.error);
      return { success: false, error: response.error };
    }

    console.log(`[EMAIL] OTP sent successfully to ${email}`);
    return { success: true, data: response.data };
  } catch (error) {
    console.error('[EMAIL] Exception sending OTP email:', error);
    return { success: false, error };
  }
}

/**
 * Send password changed notification
 */
export async function sendPasswordChangedEmail(email: string) {
  try {
    if (!process.env.RESEND_API_KEY) {
      console.warn('[EMAIL] RESEND_API_KEY not configured. Skipping email send.');
      return { success: false, message: 'Email service not configured' };
    }

    const response = await resend.emails.send({
      from: FROM_EMAIL,
      to: email,
      subject: 'Password Changed - FITRACK',
      html: generatePasswordChangedEmailHTML(),
    });

    if (response.error) {
      console.error('[EMAIL] Error sending password changed email:', response.error);
      return { success: false, error: response.error };
    }

    console.log(`[EMAIL] Password changed notification sent to ${email}`);
    return { success: true, data: response.data };
  } catch (error) {
    console.error('[EMAIL] Exception sending password changed email:', error);
    return { success: false, error };
  }
}

/**
 * Generate OTP email HTML template
 */
function generateOtpEmailHTML(otp: string, title: string, description: string): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { font-family: Arial, sans-serif; background-color: #f5f5f5; margin: 0; padding: 0; }
    .container { max-width: 600px; margin: 20px auto; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); overflow: hidden; }
    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 40px 20px; text-align: center; }
    .header h1 { margin: 0; font-size: 28px; }
    .content { padding: 40px 20px; text-align: center; }
    .description { color: #666; font-size: 16px; margin-bottom: 30px; line-height: 1.5; }
    .otp-box { background-color: #f9f9f9; border: 2px dashed #667eea; padding: 20px; margin: 30px 0; border-radius: 8px; }
    .otp-code { font-size: 36px; font-weight: bold; color: #667eea; letter-spacing: 8px; margin: 0; }
    .otp-label { font-size: 12px; color: #999; margin-top: 10px; }
    .warning { background-color: #fef3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; border-radius: 4px; text-align: left; font-size: 14px; color: #856404; }
    .footer { background-color: #f5f5f5; padding: 20px; text-align: center; font-size: 12px; color: #999; border-top: 1px solid #e0e0e0; }
    .button { display: inline-block; background-color: #667eea; color: white; padding: 12px 30px; border-radius: 5px; text-decoration: none; margin-top: 20px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🏋️ FITRACK</h1>
      <p>${title}</p>
    </div>
    <div class="content">
      <p class="description">${description}</p>
      <div class="otp-box">
        <p class="otp-code">${otp}</p>
        <p class="otp-label">One-Time Password</p>
      </div>
      <div class="warning">
        <strong>⚠️ Important:</strong> This code expires in 10 minutes. Never share this code with anyone.
      </div>
      <p style="color: #666; margin-top: 30px; font-size: 14px;">
        If you didn't request this code, please ignore this email. Your account is still secure.
      </p>
    </div>
    <div class="footer">
      <p>© 2026 FITRACK. All rights reserved.</p>
      <p>This is an automated email. Please do not reply.</p>
    </div>
  </div>
</body>
</html>
  `;
}

/**
 * Generate password changed email HTML template
 */
function generatePasswordChangedEmailHTML(): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { font-family: Arial, sans-serif; background-color: #f5f5f5; margin: 0; padding: 0; }
    .container { max-width: 600px; margin: 20px auto; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); overflow: hidden; }
    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 40px 20px; text-align: center; }
    .header h1 { margin: 0; font-size: 28px; }
    .content { padding: 40px 20px; text-align: center; }
    .success-box { background-color: #d4edda; border: 2px solid #28a745; padding: 20px; margin: 30px 0; border-radius: 8px; color: #155724; }
    .footer { background-color: #f5f5f5; padding: 20px; text-align: center; font-size: 12px; color: #999; border-top: 1px solid #e0e0e0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🏋️ FITRACK</h1>
      <p>Password Changed</p>
    </div>
    <div class="content">
      <div class="success-box">
        <h2 style="margin-top: 0;">✓ Password Successfully Changed</h2>
        <p>Your FITRACK account password has been updated.</p>
      </div>
      <p style="color: #666; margin-top: 30px; font-size: 14px;">
        If you didn't make this change, please contact support immediately.
      </p>
    </div>
    <div class="footer">
      <p>© 2026 FITRACK. All rights reserved.</p>
      <p>This is an automated email. Please do not reply.</p>
    </div>
  </div>
</body>
</html>
  `;
}
