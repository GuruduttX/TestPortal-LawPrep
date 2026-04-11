import crypto from 'crypto';
import 'server-only';

import dbConnect from '@/lib/mongodb';
import AdminSession from '@/lib/models/AdminSession';

const ADMIN_SESSION_COOKIE = 'lpt_admin_session';
const DEFAULT_SESSION_DURATION_SECONDS = 60 * 60 * 12;

function getAdminConfig() {
  const username = process.env.ADMIN_USERNAME;
  const password = process.env.ADMIN_PASSWORD;
  const secret = process.env.ADMIN_SESSION_SECRET;

  if (!username || !password) {
    throw new Error(
      '[admin-auth] ADMIN_USERNAME and ADMIN_PASSWORD must be set in environment variables (.env.local for dev, platform env for production).'
    );
  }
  if (!secret || secret.length < 32) {
    throw new Error(
      '[admin-auth] ADMIN_SESSION_SECRET must be set to at least 32 characters in environment variables.'
    );
  }

  return { username, password, secret };
}

function getSessionDurationSeconds() {
  const configured = Number(process.env.ADMIN_SESSION_TTL_SECONDS);
  if (!Number.isFinite(configured) || configured <= 0) {
    return DEFAULT_SESSION_DURATION_SECONDS;
  }
  return Math.floor(configured);
}

function hashSessionToken(token) {
  const { secret } = getAdminConfig();
  return crypto.createHash('sha256').update(`${secret}:${String(token || '')}`).digest('hex');
}

function createOpaqueSessionToken() {
  return crypto.randomBytes(32).toString('base64url');
}

function getClientIp(headerStore) {
  const forwardedFor = headerStore.get('x-forwarded-for');
  if (forwardedFor) {
    return forwardedFor.split(',')[0].trim();
  }

  return headerStore.get('x-real-ip') || '';
}

async function readAdminSession() {
  const { cookies } = await import('next/headers');
  const cookieStore = await cookies();
  const currentToken = cookieStore.get(ADMIN_SESSION_COOKIE)?.value;

  if (!currentToken) {
    return null;
  }

  await dbConnect();

  const now = new Date();
  const { username } = getAdminConfig();
  const session = await AdminSession.findOne({
    sessionTokenHash: hashSessionToken(currentToken),
    username,
    revokedAt: null,
    expiresAt: { $gt: now },
  }).lean();

  return session || null;
}

function timingSafeMatch(left, right) {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);

  if (leftBuffer.length !== rightBuffer.length) {
    return false;
  }

  return crypto.timingSafeEqual(leftBuffer, rightBuffer);
}

export function getAdminDefaultCredentials() {
  const { username, password } = getAdminConfig();
  return { username, password };
}

export async function isAdminAuthenticated() {
  return Boolean(await readAdminSession());
}

export async function requireAdminSession() {
  const { redirect } = await import('next/navigation');
  const authenticated = await isAdminAuthenticated();

  if (!authenticated) {
    redirect('/admin/login');
  }
}

/** For Route Handlers: return a 401 JSON response, or null if authenticated. */
export async function adminApiUnauthorizedResponse() {
  if (!(await isAdminAuthenticated())) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }
  return null;
}

export async function createAdminSession() {
  const { cookies, headers } = await import('next/headers');
  const cookieStore = await cookies();
  const headerStore = await headers();
  const sessionDurationSeconds = getSessionDurationSeconds();
  const expiresAt = new Date(Date.now() + sessionDurationSeconds * 1000);
  const { username } = getAdminConfig();

  const token = createOpaqueSessionToken();

  await dbConnect();
  await AdminSession.create({
    sessionTokenHash: hashSessionToken(token),
    username,
    userAgent: headerStore.get('user-agent') || '',
    ipAddress: getClientIp(headerStore),
    expiresAt,
    lastSeenAt: new Date(),
  });

  cookieStore.set(ADMIN_SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: sessionDurationSeconds,
  });
}

export async function clearAdminSession() {
  const { cookies } = await import('next/headers');
  const cookieStore = await cookies();
  const token = cookieStore.get(ADMIN_SESSION_COOKIE)?.value;

  if (token) {
    await dbConnect();
    await AdminSession.updateOne(
      { sessionTokenHash: hashSessionToken(token), revokedAt: null },
      { $set: { revokedAt: new Date() } }
    );
  }

  cookieStore.delete(ADMIN_SESSION_COOKIE);
}

export function validateAdminCredentials(username, password) {
  const config = getAdminConfig();
  return (
    timingSafeMatch(username, config.username) &&
    timingSafeMatch(password, config.password)
  );
}
