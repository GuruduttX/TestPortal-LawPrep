import crypto from 'crypto';
import { cookies } from 'next/headers';

const ATTEMPT_TOKEN_MAX_AGE_SEC = 60 * 60 * 4;
const RESULT_TOKEN_MAX_AGE_SEC = 60 * 60 * 24 * 30;
const RESULT_COOKIE_NAME = 'exam_result_access';

function getSigningSecret() {
  const secret = process.env.APP_SIGNING_SECRET;
  if (process.env.NODE_ENV === 'production' && (!secret || secret.length < 32)) {
    throw new Error('APP_SIGNING_SECRET must be set to at least 32 characters.');
  }
  return secret || 'dev-only-signing-secret-change-me-before-production';
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
};
