import { Router } from 'express';
import { z } from 'zod';
import { signAccessToken, signRefreshToken, verifyRefreshToken, authenticate } from '../middleware/auth';
import { UserRoleSchema } from '@verifolio/shared';

import { memoryStore } from '../services/store';

export const authRouter = Router();

// In-memory demo OTP store (keyed by email)
const otpStore = new Map<string, { code: string; expiresAt: number; role: string; schoolId: string; userId: string; isMinor: boolean }>();

const LoginRequestSchema = z.object({
  email: z.string().email(),
  schoolId: z.string().optional()
});

const VerifyOtpSchema = z.object({
  email: z.string().email(),
  code: z.string().length(6)
});

// Demo login request / send OTP
authRouter.post('/request-otp', (req, res) => {
  const parseResult = LoginRequestSchema.safeParse(req.body);
  if (!parseResult.success) {
    return res.status(400).json({ error: 'Invalid email or parameters.', details: parseResult.error });
  }

  const { email } = parseResult.data;
  const code = '123456'; // Standardized deterministic code for local demo/tests
  const expiresAt = Date.now() + 10 * 60 * 1000;

  // Check if user is registered in memory store
  const existingUser = Array.from(memoryStore.users.values()).find(
    (u) => u.email.toLowerCase() === email.toLowerCase()
  );

  let role = existingUser ? existingUser.role : 'STUDENT';
  let isMinor = existingUser ? existingUser.is_minor : false;
  let schoolId = existingUser ? existingUser.school_id : (req.body.schoolId || 'school-demo-1');
  let userId = existingUser ? existingUser.id : `usr-${Buffer.from(email).toString('hex').slice(0, 12)}`;

  if (!existingUser) {
    if (email.includes('mentor')) role = 'MENTOR';
    else if (email.includes('admin')) role = 'ADMIN';
    else if (email.includes('viewer')) role = 'VIEWER';
    else if (email.includes('minor')) isMinor = true;
  }

  otpStore.set(email, { code, expiresAt, role, schoolId, userId, isMinor });

  return res.json({
    message: 'One-time verification code dispatched.',
    demo_code: process.env.NODE_ENV !== 'production' ? code : undefined
  });
});

// Verify OTP & issue 15-minute JWT + refresh cookie
authRouter.post('/verify-otp', (req, res) => {
  const parseResult = VerifyOtpSchema.safeParse(req.body);
  if (!parseResult.success) {
    return res.status(400).json({ error: 'Invalid OTP parameters.' });
  }

  const { email, code } = parseResult.data;
  const stored = otpStore.get(email);

  if (!stored || stored.code !== code || stored.expiresAt < Date.now()) {
    return res.status(401).json({ error: 'Invalid or expired verification code.' });
  }

  const tokenPayload = {
    userId: stored.userId,
    email,
    role: UserRoleSchema.parse(stored.role),
    schoolId: stored.schoolId,
    isMinor: stored.isMinor
  };

  const accessToken = signAccessToken(tokenPayload);
  const refreshToken = signRefreshToken(tokenPayload);

  // Set rotating httpOnly cookies
  res.cookie('accessToken', accessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 15 * 60 * 1000 // 15 mins
  });

  res.cookie('refreshToken', refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
  });

  return res.json({
    accessToken,
    token: accessToken,
    user: tokenPayload
  });
});

// Fast 1-click Demo Login for hackathon testing & role switching
authRouter.post('/demo-login', (req, res) => {
  const roleInput = req.body.role as string;
  const role = UserRoleSchema.safeParse(roleInput);
  if (!role.success) {
    return res.status(400).json({ error: 'Invalid role specified.' });
  }

  // Find demo account for this role
  let targetUser = Array.from(memoryStore.users.values()).find((u) => u.role === role.data);
  if (!targetUser) {
    // Fallback seed if needed
    const schoolId = 'school-demo-1';
    const email = `${role.data.toLowerCase()}.demo@school1.edu`;
    targetUser = {
      id: `usr-${role.data.toLowerCase()}-demo`,
      school_id: schoolId,
      role: role.data,
      email,
      full_name: `${role.data.charAt(0) + role.data.slice(1).toLowerCase()} User`,
      first_name: role.data.charAt(0) + role.data.slice(1).toLowerCase(),
      is_minor: role.data === 'STUDENT',
      is_approved: true
    };
    memoryStore.users.set(targetUser.id, targetUser);
  }

  const tokenPayload = {
    userId: targetUser.id,
    email: targetUser.email,
    role: targetUser.role,
    schoolId: targetUser.school_id,
    isMinor: targetUser.is_minor,
    fullName: targetUser.full_name
  };

  const accessToken = signAccessToken(tokenPayload);
  const refreshToken = signRefreshToken(tokenPayload);

  res.cookie('accessToken', accessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 15 * 60 * 1000
  });

  res.cookie('refreshToken', refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000
  });

  return res.json({
    accessToken,
    token: accessToken,
    user: tokenPayload
  });
});

// Token Refresh
authRouter.post('/refresh', (req, res) => {
  const token = req.cookies?.refreshToken || req.body?.refreshToken;
  if (!token) {
    return res.status(401).json({ error: 'Refresh token missing.' });
  }

  try {
    const payload = verifyRefreshToken(token);
    const newPayload = {
      userId: payload.userId,
      email: payload.email,
      role: payload.role,
      schoolId: payload.schoolId,
      isMinor: payload.isMinor
    };

    const newAccessToken = signAccessToken(newPayload);
    const newRefreshToken = signRefreshToken(newPayload);

    res.cookie('refreshToken', newRefreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000
    });

    return res.json({
      accessToken: newAccessToken,
      user: newPayload
    });
  } catch (err) {
    return res.status(401).json({ error: 'Invalid refresh token.' });
  }
});

// Logout
authRouter.post('/logout', (_req, res) => {
  res.clearCookie('refreshToken');
  res.json({ message: 'Signed out successfully.' });
});

// Profile / Session info
authRouter.get('/me', authenticate, (req, res) => {
  res.json({ user: req.user });
});
