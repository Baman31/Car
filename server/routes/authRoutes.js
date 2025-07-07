import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { generateOTP, sendOTPEmail, sendWelcomeEmail } from '../utils/emailService.js';

const router = express.Router();

// Register with email verification
router.post('/register', async (req, res) => {
  try {
    const { username, email, password, firstName, lastName } = req.body;

    // Check if user exists
    const existingUser = await User.findOne({ 
      $or: [{ email }, { username }] 
    });

    if (existingUser) {
      if (existingUser.email === email) {
        return res.status(400).json({ message: 'Email already registered' });
      }
      if (existingUser.username === username) {
        return res.status(400).json({ message: 'Username already taken' });
      }
    }

    // Generate OTP
    const otp = generateOTP();
    const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create user with OTP
    const user = new User({
      username,
      email,
      password: hashedPassword,
      firstName,
      lastName,
      role: 'student',
      isApproved: false,
      emailVerified: false,
      emailVerificationOTP: otp,
      otpExpiresAt
    });

    await user.save();

    // Send OTP email
    const emailSent = await sendOTPEmail(email, otp, firstName);
    
    if (!emailSent) {
      console.warn(`Failed to send OTP email to ${email}, but user was created`);
    }

    res.status(201).json({
      message: 'Registration successful! Please check your email for the verification code.',
      userId: user._id,
      requiresEmailVerification: true
    });

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Registration failed. Please try again.' });
  }
});

// Verify email with OTP
router.post('/verify-email', async (req, res) => {
  try {
    const { userId, otp } = req.body;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (user.emailVerified) {
      return res.status(400).json({ message: 'Email already verified' });
    }

    if (!user.emailVerificationOTP || user.emailVerificationOTP !== otp) {
      return res.status(400).json({ message: 'Invalid verification code' });
    }

    if (user.otpExpiresAt && user.otpExpiresAt < new Date()) {
      return res.status(400).json({ message: 'Verification code has expired' });
    }

    // Mark email as verified
    user.emailVerified = true;
    user.emailVerificationOTP = null;
    user.otpExpiresAt = null;
    await user.save();

    // Send welcome email
    await sendWelcomeEmail(user.email, user.firstName);

    res.json({
      message: 'Email verified successfully! Your account is pending admin approval.',
      emailVerified: true
    });

  } catch (error) {
    console.error('Email verification error:', error);
    res.status(500).json({ message: 'Verification failed. Please try again.' });
  }
});

// Resend OTP
router.post('/resend-otp', async (req, res) => {
  try {
    const { userId } = req.body;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (user.emailVerified) {
      return res.status(400).json({ message: 'Email already verified' });
    }

    // Generate new OTP
    const otp = generateOTP();
    const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    user.emailVerificationOTP = otp;
    user.otpExpiresAt = otpExpiresAt;
    await user.save();

    // Send OTP email
    const emailSent = await sendOTPEmail(user.email, otp, user.firstName);
    
    if (!emailSent) {
      return res.status(500).json({ message: 'Failed to send verification email' });
    }

    res.json({ message: 'Verification code sent successfully!' });

  } catch (error) {
    console.error('Resend OTP error:', error);
    res.status(500).json({ message: 'Failed to resend verification code' });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    // Find user
    const user = await User.findOne({ username }).populate('enrolledCourses');
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Check if user registered with Google (no password)
    if (user.googleId && !user.password) {
      return res.status(401).json({ 
        message: 'This account was created with Google. Please use Google Sign-In.' 
      });
    }

    // Check password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Check if email is verified
    if (!user.emailVerified) {
      return res.status(401).json({ 
        message: 'Please verify your email before logging in.',
        requiresEmailVerification: true,
        userId: user._id
      });
    }

    // Generate JWT token
    const token = jwt.sign(
      { 
        userId: user._id, 
        username: user.username, 
        role: user.role 
      },
      process.env.JWT_SECRET || 'fallback-secret',
      { expiresIn: '24h' }
    );

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        avatar: user.avatar,
        profileImageUrl: user.profileImageUrl,
        isApproved: user.isApproved,
        approvedCourses: user.approvedCourses || [],
        enrolledCourses: user.enrolledCourses || []
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Login failed. Please try again.' });
  }
});

export default router;