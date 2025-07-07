import nodemailer from 'nodemailer';

// Create email transporter
const createTransporter = () => {
  // For development, you can use a service like Gmail
  // For production, use a proper email service like SendGrid, AWS SES, etc.
  return nodemailer.createTransporter({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER, // Your email
      pass: process.env.EMAIL_APP_PASSWORD // App password for Gmail
    }
  });
};

// Generate OTP
export const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString(); // 6-digit OTP
};

// Send OTP email
export const sendOTPEmail = async (email, otp, firstName = '') => {
  try {
    const transporter = createTransporter();
    
    const mailOptions = {
      from: process.env.EMAIL_USER || 'noreply@eduplatform.com',
      to: email,
      subject: 'Email Verification - OTP Code',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px; text-align: center; margin-bottom: 20px;">
            <h1 style="color: white; margin: 0; font-size: 28px;">EduPlatform</h1>
            <p style="color: white; margin: 10px 0 0 0; opacity: 0.9;">Email Verification</p>
          </div>
          
          <div style="background: #f8f9fa; padding: 30px; border-radius: 10px; text-align: center;">
            <h2 style="color: #333; margin-bottom: 20px;">Hello ${firstName}!</h2>
            <p style="color: #666; font-size: 16px; margin-bottom: 30px;">
              Thank you for registering with EduPlatform. Please use the following OTP to verify your email address:
            </p>
            
            <div style="background: white; border: 2px solid #667eea; border-radius: 10px; padding: 20px; margin: 20px 0; display: inline-block;">
              <span style="font-size: 32px; font-weight: bold; color: #667eea; letter-spacing: 5px;">${otp}</span>
            </div>
            
            <p style="color: #666; font-size: 14px; margin-top: 20px;">
              This OTP will expire in 10 minutes. If you didn't request this verification, please ignore this email.
            </p>
          </div>
          
          <div style="text-align: center; margin-top: 20px; color: #999; font-size: 12px;">
            <p>© 2025 EduPlatform. All rights reserved.</p>
          </div>
        </div>
      `
    };

    await transporter.sendMail(mailOptions);
    console.log(`OTP email sent to ${email}`);
    return true;
  } catch (error) {
    console.error('Error sending OTP email:', error);
    return false;
  }
};

// Send welcome email
export const sendWelcomeEmail = async (email, firstName = '') => {
  try {
    const transporter = createTransporter();
    
    const mailOptions = {
      from: process.env.EMAIL_USER || 'noreply@eduplatform.com',
      to: email,
      subject: 'Welcome to EduPlatform!',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px; text-align: center; margin-bottom: 20px;">
            <h1 style="color: white; margin: 0; font-size: 28px;">Welcome to EduPlatform!</h1>
          </div>
          
          <div style="background: #f8f9fa; padding: 30px; border-radius: 10px;">
            <h2 style="color: #333; margin-bottom: 20px;">Hello ${firstName}!</h2>
            <p style="color: #666; font-size: 16px; margin-bottom: 20px;">
              Congratulations! Your email has been successfully verified. Your account is now pending admin approval.
            </p>
            <p style="color: #666; font-size: 16px; margin-bottom: 20px;">
              Once approved, you'll have access to our comprehensive learning platform with:
            </p>
            <ul style="color: #666; font-size: 16px; text-align: left; margin-bottom: 20px;">
              <li>Interactive video courses</li>
              <li>Downloadable learning materials</li>
              <li>Progress tracking</li>
              <li>Assessments and certifications</li>
            </ul>
            <p style="color: #666; font-size: 16px;">
              We'll notify you as soon as your account is approved. Thank you for joining EduPlatform!
            </p>
          </div>
        </div>
      `
    };

    await transporter.sendMail(mailOptions);
    console.log(`Welcome email sent to ${email}`);
    return true;
  } catch (error) {
    console.error('Error sending welcome email:', error);
    return false;
  }
};