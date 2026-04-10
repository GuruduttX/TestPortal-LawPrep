import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

/**
 * GET /api/otp/user-check
 * 
 * Robust version for MSG91 User Existence Validation.
 * Logs incoming requests to help debug connectivity issues with Hostinger/MSG91.
 */
export async function GET(request) {
  const url = new URL(request.url);
  const mobile = url.searchParams.get('mobile') || url.searchParams.get('phone');
  
  // LOGGING: This will help us see if MSG91 is actually hitting our server
  console.log('[MSG91 User-Check] Incoming Request:', {
    fullUrl: request.url,
    mobileParam: mobile,
    userAgent: request.headers.get('user-agent'),
    ip: request.headers.get('x-forwarded-for') || 'unknown'
  });

  try {
    // MSG91 is very strict about the JSON format.
    // We return user_found: true so the transition is never blocked.
    const responseBody = {
      user_found: true,
      identifier: mobile || 'Candidate'
    };

    return new NextResponse(JSON.stringify(responseBody), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (err) {
    console.error('[MSG91 User-Check] Internal Error:', err);
    return new NextResponse(JSON.stringify({ user_found: false, error: 'Internal Error' }), { 
      status: 200, // Return 200 even on error to satisfy some validation crawlers
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
