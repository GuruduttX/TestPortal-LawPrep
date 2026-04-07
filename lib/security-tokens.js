import crypto from 'crypto';
import { cookies } from 'next/headers';

const ATTEMPT_TOKEN_MAX_AGE_SEC = 60 * 60 * 4;
const RESULT_TOKEN_MAX_AGE_SEC = 60 * 60 * 24 * 30;
const RESULT_COOKIE_NAME = 'exam_result_access';
const OTP_VERIFIED_COOKIE_NAME = 'otp_verified';
const OTP_VERIFIED_MAX_AGE_SEC = 60 * 60 * 2; // 2 hours

function getSigningSecret() {
  const secret = process.env.APP_SIGNING_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error(
      '[security-tokens] APP_SIGNING_SECRET must be set to at least 32 characters in environment variables (.env.local for dev).'
    );
  }
  return secret;
}

function signPayload(payload) {
  const encoded = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const signature = crypto
    .createHmac('sha256', getSigningSecret())
    .update(encoded)
    .digest('base64url');
  return `${encoded}.${signature}`;
}

function verifyToken(token) {
  const [encoded, signature] = String(token || '').split('.');
  if (!encoded || !signature) return null;
  const expected = crypto
    .createHmac('sha256', getSigningSecret())
    .update(encoded)
    .digest('base64url');
  const a = Buffer.from(signature);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
  try {
    return JSON.parse(Buffer.from(encoded, 'base64url').toString('utf8'));
  } catch {
    return null;
  }
}

export function createAttemptToken({ examId, durationMinutes }) {
  const issuedAt = Date.now();
  const expiresAt = issuedAt + (durationMinutes * 60 + 300) * 1000;
  return signPayload({
    t: 'attempt',
    examId: String(examId),
    iat: issuedAt,
    exp: expiresAt,
    nonce: crypto.randomBytes(12).toString('hex'),
  });
}

export function verifyAttemptToken(token, examId) {
  const payload = verifyToken(token);
  if (!payload || payload.t !== 'attempt') return { ok: false, reason: 'invalid' };
  if (String(payload.examId) !== String(examId)) return { ok: false, reason: 'exam_mismatch' };
  if (Date.now() > Number(payload.exp || 0)) return { ok: false, reason: 'expired' };
  return { ok: true, payload };
}

export function createResultAccessToken(attemptId) {
  const issuedAt = Date.now();
  const expiresAt = issuedAt + RESULT_TOKEN_MAX_AGE_SEC * 1000;
  return signPayload({
    t: 'result',
    attemptId: String(attemptId),
    iat: issuedAt,
    exp: expiresAt,
  });
}

export function verifyResultAccessToken(token, attemptId) {
  const payload = verifyToken(token);
  if (!payload || payload.t !== 'result') return false;
  if (Date.now() > Number(payload.exp || 0)) return false;
  return String(payload.attemptId) === String(attemptId);
}

export async function hasResultAccess(attemptId) {
  const store = await cookies();
  const token = store.get(RESULT_COOKIE_NAME)?.value;
  return verifyResultAccessToken(token, attemptId);
}

export const securityConstants = {
  ATTEMPT_TOKEN_MAX_AGE_SEC,
  RESULT_TOKEN_MAX_AGE_SEC,
  RESULT_COOKIE_NAME,
  OTP_VERIFIED_COOKIE_NAME,
  OTP_VERIFIED_MAX_AGE_SEC,
};

/**
 * Called after a successful MSG91 OTP verification.
 * Sets a signed HttpOnly cookie that the server can check before
 * rendering the exam. The token encodes {phone, examSlug} so it
 * cannot be reused for a different exam or a different phone number.
 */
export async function setOTPVerifiedCookie({ phone, examSlug }) {
  const issuedAt = Date.now();
  const expiresAt = issuedAt + OTP_VERIFIED_MAX_AGE_SEC * 1000;
  const token = signPayload({
    t: 'otp_verified',
    // Store a hash of phone, not the plain number, for minimal data exposure
    phoneHash: crypto.createHash('sha256').update(phone).digest('hex').slice(0, 16),
    examSlug: String(examSlug),
    iat: issuedAt,
    exp: expiresAt,
  });

  const store = await cookies();
  store.set(OTP_VERIFIED_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: OTP_VERIFIED_MAX_AGE_SEC,
  });
}

/**
 * Server-side check: has the candidate verified their OTP for *this* exam?
 * Returns true only if the signed cookie is present, untampered, not expired,
 * and matches the phone+examSlug combination.
 */
export async function hasOTPVerification({ phone, examSlug }) {
  const store = await cookies();
  const token = store.get(OTP_VERIFIED_COOKIE_NAME)?.value;
  if (!token) return false;

  const payload = verifyToken(token);
  if (!payload || payload.t !== 'otp_verified') return false;
  if (Date.now() > Number(payload.exp || 0)) return false;
  if (String(payload.examSlug) !== String(examSlug)) return false;

  // Verify phone hash matches
  const expectedHash = crypto.createHash('sha256').update(phone).digest('hex').slice(0, 16);
  const isMatch = (() => {
    try {
      const a = Buffer.from(payload.phoneHash || '');
      const b = Buffer.from(expectedHash);
      return a.length === b.length && crypto.timingSafeEqual(a, b);
    } catch { return false; }
  })();

  return isMatch;
}

/**
 * Clears the OTP verification cookie (call after exam is submitted).
 */
export async function clearOTPCookie() {
  const store = await cookies();
  store.delete(OTP_VERIFIED_COOKIE_NAME);
}
