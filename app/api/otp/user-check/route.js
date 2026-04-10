import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

/**
 * GET /api/otp/user-check
 * 
 * This endpoint is designed for MSG91 "User Existence Validation".
 * MSG91 calls this API before sending an OTP to verify if the user exists.
 * 
 * Query Params (sent by MSG91):
 * - mobile: The phone number of the user
 * 
 * Required JSON Response:
 * {
 *   "user_found": true,
 *   "identifier": "name_or_email"
 * }
 */
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const phone = searchParams.get('mobile');

    // For current implementation, we treat all users as existing
    // so they can proceed with the assessment flow.
    return NextResponse.json({
      user_found: true,
      identifier: phone || 'Candidate'
    });
  } catch (err) {
    console.error('[User Check API] Error:', err);
    return NextResponse.json({ user_found: false }, { status: 500 });
  }
}
