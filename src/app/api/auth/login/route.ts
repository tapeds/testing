import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    async function signInWithEmail(userEmail: string) {
      const supabase = await createClient();

      const { data, error } = await supabase.auth.signInWithOtp({
        email: userEmail,
        options: {
          shouldCreateUser: true,
          emailRedirectTo: process.env.NEXT_PUBLIC_APP_URL,
        },
      });
      return { data, error };
    }

    await signInWithEmail(email);

    return NextResponse.json({ message: 'Login successful' });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to login' }, { status: 500 });
  }
}