import { NextResponse } from 'next/server';
import { setOTPVerifiedCookie } from '@/lib/security-tokens';

export const dynamic = 'force-dynamic';

/**
 * POST /api/otp/verify
 * Verifies the OTP with MSG91 v5 API.
 */
export async function POST(request) {
  try {
    const { phone, otp, examSlug } = await request.json();

    // ── Validation ──────────────────────────────────────────────────────────
    if (!phone || !/^\d{10}$/.test(phone)) {
      return NextResponse.json({ success: false, message: 'Invalid phone number.' }, { status: 400 });
    }
    if (!otp || !/^\d{4,8}$/.test(String(otp))) {
      return NextResponse.json({ success: false, message: 'Invalid OTP format.' }, { status: 400 });
    }
    if (!examSlug || typeof examSlug !== 'string') {
      return NextResponse.json({ success: false, message: 'Exam context missing.' }, { status: 400 });
    }

    const isMock = process.env.OTP_SERVICE_ENABLED !== 'true';

    // ── TEST MODE BYPASS ───────────────────────────────────────────────────
    if (isMock) {
      console.log(`[OTP Verify] TEST MODE: Auto-verifying ${phone}`);
      await setOTPVerifiedCookie({ phone, examSlug });
      return NextResponse.json({
        success: true,
        message: 'Phone number verified automatically.',
      });
    }

    // ── LIVE MODE ──────────────────────────────────────────────────────────
    const authKey = process.env.MSG91_AUTH_KEY;
    if (!authKey || authKey === 'your_msg91_authkey_here') {
      console.error('[OTP Verify] MSG91_AUTH_KEY is not configured.');
      return NextResponse.json({ success: false, message: 'OTP service not configured.' }, { status: 503 });
    }

    const mobile = `91${phone}`;
    const url = `https://control.msg91.com/api/v5/otp/verify?mobile=${mobile}&otp=${encodeURIComponent(otp)}`;

    const msg91Res = await fetch(url, {
      method: 'GET',
      headers: {
        'authkey': authKey,
        'accept':  'application/json',
      },
    });

    let data = {};
    try { data = await msg91Res.json(); } catch { }

    if (data?.type === 'success') {
      await setOTPVerifiedCookie({ phone, examSlug });
      return NextResponse.json({ success: true, message: 'Verified successfully.' });
    }

    console.error('[OTP Verify] MSG91 error:', data?.message);
    return NextResponse.json({ success: false, message: data?.message || 'Verification failed.' }, { status: 400 });

  } catch (err) {
    console.error('[OTP Verify] Internal error:', err);
    return NextResponse.json({ success: false, message: 'Internal error.' }, { status: 500 });
  }
}
