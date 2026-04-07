import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

/**
 * POST /api/otp/resend
 * Retries sending the OTP via SMS or voice call.
 *
 * Body: { phone: "10digits", type: "text" | "voice" }
 * ENV required: MSG91_AUTH_KEY
 */
export async function POST(request) {
  try {
    const { phone, type = 'text' } = await request.json();

    // ── Validation ──────────────────────────────────────────────────────────
    if (!phone || !/^\d{10}$/.test(phone)) {
      return NextResponse.json(
        { success: false, message: 'Invalid phone number.' },
        { status: 400 }
      );
    }

    const retryType = type === 'voice' ? 'voice' : 'text';

    const authKey = process.env.MSG91_AUTH_KEY;

    if (!authKey || authKey === 'your_msg91_authkey_here') {
      console.error('[OTP Resend] MSG91_AUTH_KEY is not configured in env.');
      return NextResponse.json(
        { success: false, message: 'OTP service is not configured.' },
        { status: 503 }
      );
    }

    // ── MSG91 Retry OTP API ─────────────────────────────────────────────────
    // GET request with authkey in header; mobile + retrytype in query
    const mobile = `91${phone}`;
    const url = `https://control.msg91.com/api/v5/otp/retry?mobile=${mobile}&retrytype=${retryType}`;

    const msg91Res = await fetch(url, {
      method: 'GET',
      headers: {
        'authkey': authKey,
        'accept':  'application/json',
      },
    });

    let data = {};
    try { data = await msg91Res.json(); } catch { /* empty body */ }

    console.log('[OTP Resend] MSG91 response:', data);

    if (data?.type === 'success') {
      const label = retryType === 'voice' ? 'Voice call initiated' : 'OTP resent via SMS';
      return NextResponse.json({
        success: true,
        message: label,
      });
    }

    // Handle specific MSG91 errors
    const rawMsg = String(data?.message || '').toLowerCase();
    let userMsg;
    if (rawMsg.includes('not found') || rawMsg.includes('no otp')) {
      userMsg = 'No active OTP session found. Please go back and try again.';
    } else if (rawMsg.includes('limit') || rawMsg.includes('too many')) {
      userMsg = 'Too many attempts. Please wait a few minutes before retrying.';
    } else {
      userMsg = 'Failed to resend OTP. Please try again.';
    }

    console.error('[OTP Resend] Failed:', data?.message);
    return NextResponse.json({ success: false, message: userMsg }, { status: 502 });

  } catch (err) {
    console.error('[OTP Resend] Internal error:', err);
    return NextResponse.json(
      { success: false, message: 'Error resending OTP. Please try again.' },
      { status: 500 }
    );
  }
}
