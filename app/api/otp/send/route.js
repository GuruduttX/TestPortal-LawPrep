import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

/**
 * POST /api/otp/send
 * Sends a 6-digit OTP to the given 10-digit Indian mobile number via MSG91.
 *
 * ENV required:
 *   MSG91_AUTH_KEY    — from MSG91 dashboard (passed as HTTP header, NOT query param)
 *   MSG91_TEMPLATE_ID — DLT-registered OTP template ID
 *   MSG91_OTP_EXPIRY  — OTP validity in minutes (default: 10)
 */
export async function POST(request) {
  try {
    const { phone } = await request.json();

    // ── Validation ──────────────────────────────────────────────────────────
    if (!phone || !/^\d{10}$/.test(phone)) {
      return NextResponse.json(
        { success: false, message: 'A valid 10-digit phone number is required.' },
        { status: 400 }
      );
    }

    // Read env at request time (not module load time) so hot-reload works
    const authKey    = process.env.MSG91_AUTH_KEY;
    const templateId = process.env.MSG91_TEMPLATE_ID;
    const expiry     = parseInt(process.env.MSG91_OTP_EXPIRY || '10', 10);

    if (!authKey || authKey === 'your_msg91_authkey_here') {
      console.error('[OTP Send] MSG91_AUTH_KEY is not configured in env.');
      return NextResponse.json(
        { success: false, message: 'OTP service is not configured. Please contact the administrator.' },
        { status: 503 }
      );
    }

    if (!templateId || templateId === 'your_dlt_template_id_here') {
      console.error('[OTP Send] MSG91_TEMPLATE_ID is not configured in env.');
      return NextResponse.json(
        { success: false, message: 'OTP service is not configured. Please contact the administrator.' },
        { status: 503 }
      );
    }

    // ── MSG91 Send OTP API ─────────────────────────────────────────────────
    // authkey MUST be in the header (not query string) per MSG91 v5 API docs
    const mobile = `91${phone}`; // country code prefix, no + sign

    const msg91Res = await fetch(
      `https://control.msg91.com/api/v5/otp?otp_expiry=${expiry}&otp_length=6`,
      {
        method: 'POST',
        headers: {
          'authkey':      authKey,
          'content-type': 'application/json',
          'accept':       'application/json',
        },
        body: JSON.stringify({
          template_id: templateId,
          mobile:      mobile,
        }),
      }
    );

    let data = {};
    try { data = await msg91Res.json(); } catch { /* empty body */ }

    console.log('[OTP Send] MSG91 response:', data);

    if (data?.type === 'success') {
      return NextResponse.json({
        success: true,
        message: `OTP sent to ${mobile.slice(0, 4)}••••••${mobile.slice(-2)}`,
        expiresInMinutes: expiry,
      });
    }

    // MSG91 error — surface a clean message
    const errMsg = data?.message || `MSG91 returned status ${msg91Res.status}`;
    console.error('[OTP Send] MSG91 error:', errMsg);
    return NextResponse.json(
      { success: false, message: 'Failed to send OTP. Please try again.' },
      { status: 502 }
    );

  } catch (err) {
    console.error('[OTP Send] Internal error:', err);
    return NextResponse.json(
      { success: false, message: 'Internal error sending OTP. Please try again.' },
      { status: 500 }
    );
  }
}
