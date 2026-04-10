import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

/**
 * POST /api/otp/send
 * Sends a 6-digit OTP via MSG91 v5 API.
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

    // Read env at request time
    const authKey    = process.env.MSG91_AUTH_KEY;
    const templateId = process.env.MSG91_TEMPLATE_ID;
    const expiry     = parseInt(process.env.MSG91_OTP_EXPIRY || '10', 10);
    const isMock     = process.env.OTP_SERVICE_ENABLED !== 'true';

    // ── TEST MODE BYPASS ───────────────────────────────────────────────────
    if (isMock) {
      console.log(`[OTP Send] TEST MODE: Bypassing real SMS for ${phone}`);
      return NextResponse.json({
        success: true,
        message: `OTP bypassed for ${phone.slice(0, 4)}••••••${phone.slice(-2)}`,
        expiresInMinutes: 10,
      });
    }

    // ── LIVE MODE ──────────────────────────────────────────────────────────
    if (!authKey || authKey === 'your_msg91_authkey_here') {
      console.error('[OTP Send] MSG91_AUTH_KEY is not configured.');
      return NextResponse.json({ success: false, message: 'OTP service not configured.' }, { status: 503 });
    }

    if (!templateId || templateId === 'your_dlt_template_id_here') {
      console.error('[OTP Send] MSG91_TEMPLATE_ID is not configured.');
      return NextResponse.json({ success: false, message: 'OTP service not configured.' }, { status: 503 });
    }

    const mobile = `91${phone}`; 
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
    try { data = await msg91Res.json(); } catch { }

    if (data?.type === 'success') {
      return NextResponse.json({
        success: true,
        message: `OTP sent to ${phone.slice(0, 4)}••••••${phone.slice(-2)}`,
        expiresInMinutes: expiry,
      });
    }

    console.error('[OTP Send] MSG91 error:', data?.message);
    return NextResponse.json({ success: false, message: 'Failed to send OTP.' }, { status: 502 });

  } catch (err) {
    console.error('[OTP Send] Internal error:', err);
    return NextResponse.json({ success: false, message: 'Error sending OTP.' }, { status: 500 });
  }
}
