import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser, unauthorizedResponse } from '@/lib/auth';

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return unauthorizedResponse();
    }
    // Return only email and role
    return NextResponse.json({ 
      email: user.email,
      role: user.role 
    });
  } catch {
    return NextResponse.json({ error: 'Failed to fetch session' }, { status: 500 });
  }
}