import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

/**
 * Handle OPTIONS (Pre-flight)
 */
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, authkey',
    },
  });
}

/**
 * Handle GET and POST for User Existence Validation
 */
async function handleRequest(request) {
  const url = new URL(request.url);
  const mobile = url.searchParams.get('mobile') || url.searchParams.get('phone') || '9876543210';
  
  console.log(`[MSG91 User-Check] ${request.method} hit by:`, request.headers.get('user-agent'));

  // Use a formatted JSON string to be absolutely safe with strict parsers
  const responseBody = {
    "user_found": true,
    "identifier": mobile.includes('@') ? mobile : `user_${mobile}@test.com`
  };

  // Stringify with spacing to match MSG91's exact example format
  const jsonResponse = JSON.stringify(responseBody, null, 2);

  return new NextResponse(jsonResponse, {
    status: 200,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Access-Control-Allow-Origin': '*',
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0',
    },
  });
}

export async function GET(request) { return handleRequest(request); }
export async function POST(request) { return handleRequest(request); }
