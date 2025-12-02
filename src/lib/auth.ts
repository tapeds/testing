import { NextResponse } from 'next/server';
import { createClient, db } from '@/lib/db';

export interface AuthUser {
  id: string;
  email: string;
  role: 'admin' | 'user';
}

/**
 * Get the current authenticated user from the session
 */
export async function getCurrentUser(): Promise<AuthUser | null> {
  const supabase = await createClient();
  const { data: claims } = await supabase.auth.getClaims();
  if (!claims || !claims.claims.email) {
    return null;
  }

  // Get user role from users table
  const { data: userData, error: userError } = await db
    .from('users')
    .select('id, email, role')
    .eq('email', claims.claims.email)
    .single();

  if (userError || !userData) {
    return null;
  }

  return {
    id: userData.id,
    email: userData.email,
    role: userData.role as 'admin' | 'user',
  };
}

/**
 * Check if the current user is an admin
 */
export async function requireAdmin(): Promise<AuthUser> {
  const user = await getCurrentUser();
  
  if (!user) {
    throw new Error('Unauthorized');
  }

  if (user.role !== 'admin') {
    throw new Error('Forbidden');
  }

  return user;
}

/**
 * Require authentication (any authenticated user)
 */
export async function requireAuth(): Promise<AuthUser> {
  const user = await getCurrentUser();
  
  if (!user) {
    throw new Error('Unauthorized');
  }

  return user;
}

/**
 * Get the developer ID associated with the current user
 */
export async function getUserDeveloperId(userId: string): Promise<string | null> {
  const { data, error } = await db
    .from('developers')
    .select('id')
    .eq('user_id', userId)
    .single()

  if (error || !data) {
    return null;
  }

  return data.id;
}

/**
 * Helper to return unauthorized response
 */
export function unauthorizedResponse() {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
}

/**
 * Helper to return forbidden response
 */
export function forbiddenResponse() {
  return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
}
