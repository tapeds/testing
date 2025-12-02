import { NextRequest, NextResponse } from 'next/server';
import type { Developer } from '@/types';
import { db } from '@/lib/db';
import { requireAdmin, forbiddenResponse, unauthorizedResponse } from '@/lib/auth';

export async function GET() {
  try {
    await requireAdmin();
    const { data, error } = await db.from('developers').select('*').order('created_at', { ascending: false });
    if (error) throw error;
    const developers = (data || []).map((d: any) => ({
      id: d.id,
      name: d.name,
      userId: d.user_id,
      createdAt: d.created_at,
    })) as Developer[];
    return NextResponse.json(developers);
  } catch (error: any) {
    if (error.message === 'Unauthorized') {
      return unauthorizedResponse();
    }
    if (error.message === 'Forbidden') {
      return forbiddenResponse();
    }
    return NextResponse.json({ error: 'Failed to fetch developers' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireAdmin();
    const body = await request.json();
    const { id, name, email, createdAt } = body;

    let finalUserId = null;

    if (email) {
      const { data: userData, error: userError } = await db
        .from('users')
        .select('id')
        .eq('email', email)
        .single();

      if (userError || !userData) {
        return NextResponse.json(
          { error: `User with email ${email} not found` },
          { status: 404 }
        );
      }

      finalUserId = userData.id;
    }

    const { data, error } = await db.from('developers').insert({
      id,
      name,
      user_id: finalUserId,
      created_at: createdAt,
    }).select().single();
    
    if (error) throw error;
    
    return NextResponse.json({
      id: data.id,
      name: data.name,
      userId: data.user_id,
      createdAt: data.created_at,
    } as Developer);
  } catch (error: any) {
    if (error.message === 'Unauthorized') {
      return unauthorizedResponse();
    }
    if (error.message === 'Forbidden') {
      return forbiddenResponse();
    }
    return NextResponse.json({ error: 'Failed to create developer' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    await requireAdmin();
    const { id, ...updates } = await request.json();
    const updateData: any = {};
    
    if ('name' in updates) updateData.name = updates.name;
    if ('createdAt' in updates) updateData.created_at = updates.createdAt;
    
    if ('userId' in updates) {
      updateData.user_id = updates.userId || null;
    }
    
    // If email is provided, look up the user ID from the users table
    if ('email' in updates && updates.email) {
      const { data: userData, error: userError } = await db
        .from('users')
        .select('id')
        .eq('email', updates.email)
        .single();

      if (userError || !userData) {
        return NextResponse.json(
          { error: `User with email ${updates.email} not found` },
          { status: 404 }
        );
      }

      updateData.user_id = userData.id;
    }
    
    const { error } = await db.from('developers').update(updateData).eq('id', id);
    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (error: any) {
    if (error.message === 'Unauthorized') {
      return unauthorizedResponse();
    }
    if (error.message === 'Forbidden') {
      return forbiddenResponse();
    }
    return NextResponse.json({ error: 'Failed to update developer' }, { status: 500 });
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
    const { error } = await db.from('developers').delete().eq('id', id);
    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (error: any) {
    if (error.message === 'Unauthorized') {
      return unauthorizedResponse();
    }
    if (error.message === 'Forbidden') {
      return forbiddenResponse();
    }
    return NextResponse.json({ error: 'Failed to delete developer' }, { status: 500 });
  }
}

