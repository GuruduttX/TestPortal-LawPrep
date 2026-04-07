import crypto from 'crypto';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

const ADMIN_SESSION_COOKIE = 'lpt_admin_session';

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

function signSessionPayload(payload) {
  const encoded = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const { secret } = getAdminConfig();
  const signature = crypto.createHmac('sha256', secret).update(encoded).digest('base64url');
  return `${encoded}.${signature}`;
}

function parseAndVerifySessionToken(token) {
  const [encoded, signature] = String(token || '').split('.');
  if (!encoded || !signature) return null;
  const { secret, username } = getAdminConfig();
  const expected = crypto.createHmac('sha256', secret).update(encoded).digest('base64url');
  const leftBuffer = Buffer.from(signature);
  const rightBuffer = Buffer.from(expected);
  if (leftBuffer.length !== rightBuffer.length || !crypto.timingSafeEqual(leftBuffer, rightBuffer)) {
    return null;
  }
  try {
    const payload = JSON.parse(Buffer.from(encoded, 'base64url').toString('utf8'));
    if (payload?.u !== username || Date.now() > Number(payload?.exp || 0)) {
      return null;
    }
    return payload;
  } catch {
    return null;
  }
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
  const cookieStore = await cookies();
  const currentToken = cookieStore.get(ADMIN_SESSION_COOKIE)?.value;

  if (!currentToken) {
    return false;
  }

  return Boolean(parseAndVerifySessionToken(currentToken));
}

export async function requireAdminSession() {
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
  const cookieStore = await cookies();
  const expiresAt = Date.now() + 60 * 60 * 12 * 1000;
  const { username } = getAdminConfig();
  const token = signSessionPayload({
    u: username,
    exp: expiresAt,
    nonce: crypto.randomBytes(12).toString('hex'),
  });

  cookieStore.set(ADMIN_SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 60 * 60 * 12,
  });
}

export async function clearAdminSession() {
  const cookieStore = await cookies();
  cookieStore.delete(ADMIN_SESSION_COOKIE);
}

export function validateAdminCredentials(username, password) {
  const config = getAdminConfig();
  return (
    timingSafeMatch(username, config.username) &&
    timingSafeMatch(password, config.password)
  );
}
