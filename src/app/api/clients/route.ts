import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAdmin, forbiddenResponse, unauthorizedResponse } from '@/lib/auth';
import type { Client } from '@/types';

export async function GET() {
  try {
    await requireAdmin();
    const { data, error } = await db.from('clients').select('*').order('created_at', { ascending: false });
    if (error) throw error;
    const clients = (data || []).map((c: any) => ({
      id: c.id,
      name: c.name,
      primaryContactUserId: c.primary_contact_user_id,
      createdAt: c.created_at,
    })) as Client[];
    return NextResponse.json(clients);
  } catch (error: any) {
    if (error.message === 'Unauthorized') {
      return unauthorizedResponse();
    }
    if (error.message === 'Forbidden') {
      return forbiddenResponse();
    }
    return NextResponse.json({ error: 'Failed to fetch clients' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireAdmin();
    const client: Client = await request.json();
    const { data, error } = await db.from('clients').insert({
      id: client.id,
      name: client.name,
      primary_contact_user_id: client.primaryContactUserId || null,
      created_at: client.createdAt,
    }).select().single();
    if (error) throw error;
    return NextResponse.json({
      id: data.id,
      name: data.name,
      primaryContactUserId: data.primary_contact_user_id,
      createdAt: data.created_at,
    } as Client);
  } catch (error: any) {
    if (error.message === 'Unauthorized') {
      return unauthorizedResponse();
    }
    if (error.message === 'Forbidden') {
      return forbiddenResponse();
    }
    return NextResponse.json({ error: 'Failed to create client' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    await requireAdmin();
    const { id, ...updates } = await request.json();
    const updateData: any = {};
    if ('name' in updates) updateData.name = updates.name;
    if ('primaryContactUserId' in updates) updateData.primary_contact_user_id = updates.primaryContactUserId;
    if ('createdAt' in updates) updateData.created_at = updates.createdAt;
    const { error } = await db.from('clients').update(updateData).eq('id', id);
    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (error: any) {
    if (error.message === 'Unauthorized') {
      return unauthorizedResponse();
    }
    if (error.message === 'Forbidden') {
      return forbiddenResponse();
    }
    return NextResponse.json({ error: 'Failed to update client' }, { status: 500 });
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
    const { error } = await db.from('clients').delete().eq('id', id);
    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (error: any) {
    if (error.message === 'Unauthorized') {
      return unauthorizedResponse();
    }
    if (error.message === 'Forbidden') {
      return forbiddenResponse();
    }
    return NextResponse.json({ error: 'Failed to delete client' }, { status: 500 });
  }
}

