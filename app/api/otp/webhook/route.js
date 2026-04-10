import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

/**
 * POST /api/otp/webhook
 * 
 * This endpoint receives events and status updates from MSG91.
 * MSG91 calls this URL whenever there is a status change (e.g., OTP delivered, failed).
 */
export async function POST(request) {
  try {
    const data = await request.json();
    
    // Log the event data for debugging/audit purposes
    console.log('[MSG91 Webhook] Event Received:', JSON.stringify(data, null, 2));

    // Return 200 OK to acknowledge receipt of the event
    return NextResponse.json({ success: true, message: 'Event logged' });
  } catch (err) {
    // Even if parsing fails, we return a 200 OK to prevent MSG91 from retrying excessively
    console.error('[MSG91 Webhook] Error processing event:', err);
    return NextResponse.json({ success: false }, { status: 200 });
  }
}
