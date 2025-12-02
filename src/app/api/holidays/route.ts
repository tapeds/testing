import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAdmin, forbiddenResponse, unauthorizedResponse } from '@/lib/auth';
import type { Holiday } from '@/types';

export async function GET() {
  try {
    await requireAdmin();
    const { data, error } = await db.from('holidays').select('*').order('created_at', { ascending: false });
    if (error) throw error;
    // Map snake_case to camelCase and convert isTaken from integer to boolean
    const holidays = (data || []).map((h: any) => ({
      id: h.id,
      engagementId: h.engagement_id,
      date: h.date,
      name: h.name,
      isTaken: Boolean(h.is_taken),
      createdAt: h.created_at,
    })) as Holiday[];
    return NextResponse.json(holidays);
  } catch (error: any) {
    if (error.message === 'Unauthorized') {
      return unauthorizedResponse();
    }
    if (error.message === 'Forbidden') {
      return forbiddenResponse();
    }
    return NextResponse.json({ error: 'Failed to fetch holidays' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireAdmin();
    const holiday: Holiday = await request.json();
    const { data, error } = await db.from('holidays').insert({
      id: holiday.id,
      engagement_id: holiday.engagementId,
      date: holiday.date,
      name: holiday.name,
      is_taken: holiday.isTaken ? 1 : 0,
      created_at: holiday.createdAt,
    }).select().single();
    if (error) throw error;
    return NextResponse.json({
      id: data.id,
      engagementId: data.engagement_id,
      date: data.date,
      name: data.name,
      isTaken: Boolean(data.is_taken),
      createdAt: data.created_at,
    } as Holiday);
  } catch (error: any) {
    if (error.message === 'Unauthorized') {
      return unauthorizedResponse();
    }
    if (error.message === 'Forbidden') {
      return forbiddenResponse();
    }
    return NextResponse.json({ error: 'Failed to create holiday' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    await requireAdmin();
    const { id, ...updates } = await request.json();
    const updateData: any = {};
    if ('engagementId' in updates) updateData.engagement_id = updates.engagementId;
    if ('date' in updates) updateData.date = updates.date;
    if ('name' in updates) updateData.name = updates.name;
    if ('isTaken' in updates) updateData.is_taken = updates.isTaken ? 1 : 0;
    if ('createdAt' in updates) updateData.created_at = updates.createdAt;
    const { error } = await db.from('holidays').update(updateData).eq('id', id);
    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (error: any) {
    if (error.message === 'Unauthorized') {
      return unauthorizedResponse();
    }
    if (error.message === 'Forbidden') {
      return forbiddenResponse();
    }
    return NextResponse.json({ error: 'Failed to update holiday' }, { status: 500 });
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
    const { error } = await db.from('holidays').delete().eq('id', id);
    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (error: any) {
    if (error.message === 'Unauthorized') {
      return unauthorizedResponse();
    }
    if (error.message === 'Forbidden') {
      return forbiddenResponse();
    }
    return NextResponse.json({ error: 'Failed to delete holiday' }, { status: 500 });
  }
}

