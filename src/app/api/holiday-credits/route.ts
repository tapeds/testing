import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAdmin, forbiddenResponse, unauthorizedResponse } from '@/lib/auth';
import type { HolidayCredit } from '@/types';

export async function GET() {
  try {
    await requireAdmin();
    const { data, error } = await db.from('holiday_credits').select('*').order('created_at', { ascending: false });
    if (error) throw error;
    const credits = (data || []).map((c: any) => ({
      id: c.id,
      engagementId: c.engagement_id,
      date: c.date,
      creditDays: c.credit_days,
      note: c.note,
      createdBy: c.created_by,
      createdAt: c.created_at,
    })) as HolidayCredit[];
    return NextResponse.json(credits);
  } catch (error: any) {
    if (error.message === 'Unauthorized') {
      return unauthorizedResponse();
    }
    if (error.message === 'Forbidden') {
      return forbiddenResponse();
    }
    return NextResponse.json({ error: 'Failed to fetch holiday credits' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireAdmin();
    const credit: HolidayCredit = await request.json();
    const { data, error } = await db.from('holiday_credits').insert({
      id: credit.id,
      engagement_id: credit.engagementId,
      date: credit.date,
      credit_days: credit.creditDays,
      note: credit.note || null,
      created_by: credit.createdBy || null,
      created_at: credit.createdAt,
    }).select().single();
    if (error) throw error;
    return NextResponse.json({
      id: data.id,
      engagementId: data.engagement_id,
      date: data.date,
      creditDays: data.credit_days,
      note: data.note,
      createdBy: data.created_by,
      createdAt: data.created_at,
    } as HolidayCredit);
  } catch (error: any) {
    if (error.message === 'Unauthorized') {
      return unauthorizedResponse();
    }
    if (error.message === 'Forbidden') {
      return forbiddenResponse();
    }
    return NextResponse.json({ error: 'Failed to create holiday credit' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    await requireAdmin();
    const { id, ...updates } = await request.json();
    const updateData: any = {};
    if ('engagementId' in updates) updateData.engagement_id = updates.engagementId;
    if ('date' in updates) updateData.date = updates.date;
    if ('creditDays' in updates) updateData.credit_days = updates.creditDays;
    if ('note' in updates) updateData.note = updates.note;
    if ('createdBy' in updates) updateData.created_by = updates.createdBy;
    if ('createdAt' in updates) updateData.created_at = updates.createdAt;
    const { error } = await db.from('holiday_credits').update(updateData).eq('id', id);
    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (error: any) {
    if (error.message === 'Unauthorized') {
      return unauthorizedResponse();
    }
    if (error.message === 'Forbidden') {
      return forbiddenResponse();
    }
    return NextResponse.json({ error: 'Failed to update holiday credit' }, { status: 500 });
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
    const { error } = await db.from('holiday_credits').delete().eq('id', id);
    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (error: any) {
    if (error.message === 'Unauthorized') {
      return unauthorizedResponse();
    }
    if (error.message === 'Forbidden') {
      return forbiddenResponse();
    }
    return NextResponse.json({ error: 'Failed to delete holiday credit' }, { status: 500 });
  }
}

