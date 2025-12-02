import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAdmin, forbiddenResponse, unauthorizedResponse } from '@/lib/auth';
import type { User } from '@/types';

export async function GET() {
  try {
    await requireAdmin();
    const { data, error } = await db.from('users').select('*').order('created_at', { ascending: false });
    if (error) throw error;
    const users = (data || []).map((u: any) => ({
      id: u.id,
      email: u.email,
      fullName: u.full_name,
      role: u.role,
      createdAt: u.created_at,
    })) as User[];
    return NextResponse.json(users);
  } catch (error: any) {
    if (error.message === 'Unauthorized') {
      return unauthorizedResponse();
    }
    if (error.message === 'Forbidden') {
      return forbiddenResponse();
    }
    return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireAdmin();
    const user: User = await request.json();
    const { data, error } = await db.from('users').insert({
      id: user.id,
      email: user.email,
      full_name: user.fullName,
      role: user.role,
      created_at: user.createdAt,
    }).select().single();
    if (error) throw error;
    return NextResponse.json({
      id: data.id,
      email: data.email,
      fullName: data.full_name,
      role: data.role,
      createdAt: data.created_at,
    } as User);
  } catch (error: any) {
    if (error.message === 'Unauthorized') {
      return unauthorizedResponse();
    }
    if (error.message === 'Forbidden') {
      return forbiddenResponse();
    }
    return NextResponse.json({ error: 'Failed to create user' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    await requireAdmin();
    const { id, ...updates } = await request.json();
    const dbUpdates: any = {};
    if ('fullName' in updates) dbUpdates.full_name = updates.fullName;
    if ('createdAt' in updates) dbUpdates.created_at = updates.createdAt;
    if ('email' in updates) dbUpdates.email = updates.email;
    if ('role' in updates) dbUpdates.role = updates.role;
    const { error } = await db.from('users').update(dbUpdates).eq('id', id);
    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (error: any) {
    if (error.message === 'Unauthorized') {
      return unauthorizedResponse();
    }
    if (error.message === 'Forbidden') {
      return forbiddenResponse();
    }
    return NextResponse.json({ error: 'Failed to update user' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    await requireAdmin();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 });
    }
    const { error } = await db.from('users').delete().eq('id', id);
    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (error: any) {
    if (error.message === 'Unauthorized') {
      return unauthorizedResponse();
    }
    if (error.message === 'Forbidden') {
      return forbiddenResponse();
    }
    return NextResponse.json({ error: 'Failed to delete user' }, { status: 500 });
  }
}

