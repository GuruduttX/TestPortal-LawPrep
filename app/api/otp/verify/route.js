import { NextResponse } from 'next/server';
import { setOTPVerifiedCookie } from '@/lib/security-tokens';

export const dynamic = 'force-dynamic';

/**
 * POST /api/otp/verify
 * Verifies the OTP entered by the candidate against MSG91.
 * On success, sets a signed HttpOnly server cookie so the exam page
 * can confirm OTP was completed without trusting the client.
 *
 * Body: { phone: "10digits", otp: "6digits", examSlug: "exam-slug" }
 * ENV required: MSG91_AUTH_KEY
 */
export async function POST(request) {
  try {
    const { phone, otp, examSlug } = await request.json();

    // ── Validation ──────────────────────────────────────────────────────────
    if (!phone || !/^\d{10}$/.test(phone)) {
      return NextResponse.json(
        { success: false, message: 'Invalid phone number.' },
        { status: 400 }
      );
    }

    if (!otp || !/^\d{4,8}$/.test(String(otp))) {
      return NextResponse.json(
        { success: false, message: 'Invalid OTP format.' },
        { status: 400 }
      );
    }

    if (!examSlug || typeof examSlug !== 'string') {
      return NextResponse.json(
        { success: false, message: 'Exam context missing.' },
        { status: 400 }
      );
    }

    const authKey = process.env.MSG91_AUTH_KEY;

    if (!authKey || authKey === 'your_msg91_authkey_here') {
      console.error('[OTP Verify] MSG91_AUTH_KEY is not configured in env.');
      return NextResponse.json(
        { success: false, message: 'OTP service is not configured.' },
        { status: 503 }
      );
    }

    // ── MSG91 Verify OTP API ────────────────────────────────────────────────
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
    try { data = await msg91Res.json(); } catch { /* empty body */ }

    console.log('[OTP Verify] MSG91 response:', data);

    if (data?.type === 'success') {
      // ── Set server-side OTP verification cookie ──────────────────────────
      // This is what actually secures the exam route — not client-side state.
      await setOTPVerifiedCookie({ phone, examSlug });

      return NextResponse.json({
        success: true,
        message: 'Phone number verified successfully.',
      });
    }

    // ── Map MSG91 errors to user-friendly messages ──────────────────────────
    const rawMsg = String(data?.message || '').toLowerCase();
    let userMsg;
    if (rawMsg.includes('not match') || rawMsg.includes('mismatch') || rawMsg.includes('incorrect')) {
      userMsg = 'Incorrect OTP. Please check and try again.';
    } else if (rawMsg.includes('already verified') || rawMsg.includes('already used')) {
      userMsg = 'This OTP has already been used. Please request a new one.';
    } else if (rawMsg.includes('expir')) {
      userMsg = 'OTP has expired. Please click "Resend SMS" to get a new one.';
    } else if (rawMsg.includes('not found') || rawMsg.includes('no otp')) {
      userMsg = 'No OTP found for this number. Please request a new one.';
    } else {
      userMsg = 'OTP verification failed. Please try again.';
    }

    console.error('[OTP Verify] Failed:', data?.message);
    return NextResponse.json({ success: false, message: userMsg }, { status: 400 });

  } catch (err) {
    console.error('[OTP Verify] Internal error:', err);
    return NextResponse.json(
      { success: false, message: 'Internal error verifying OTP. Please try again.' },
      { status: 500 }
    );
  }
}
