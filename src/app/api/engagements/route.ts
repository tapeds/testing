import { NextRequest, NextResponse } from 'next/server';
import type { Engagement } from '@/types';
import { db } from '@/lib/db';
import { requireAdmin, forbiddenResponse, unauthorizedResponse } from '@/lib/auth';

export async function GET() {
  try {
    await requireAdmin();
    const { data, error } = await db.from('engagements').select('*').order('created_at', { ascending: false });
    if (error) throw error;
    const engagements = (data || []).map((e: any) => ({
      id: e.id,
      developerId: e.developer_id,
      clientId: e.client_id,
      startDate: e.start_date,
      endDate: e.end_date,
      currency: e.currency,
      pricePerPeriod: e.price_per_period,
      salaryPerPeriod: e.salary_per_period,
      clientDayoffRate: e.client_dayoff_rate,
      devDayoffRate: e.dev_dayoff_rate,
      periodUnit: e.period_unit,
      isActive: Boolean(e.is_active),
      createdAt: e.created_at,
    })) as Engagement[];
    return NextResponse.json(engagements);
  } catch (error: any) {
    if (error.message === 'Unauthorized') {
      return unauthorizedResponse();
    }
    if (error.message === 'Forbidden') {
      return forbiddenResponse();
    }
    return NextResponse.json({ error: 'Failed to fetch engagements' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireAdmin();
    const engagement: Engagement = await request.json();
    const { data, error } = await db.from('engagements').insert({
      id: engagement.id,
      developer_id: engagement.developerId,
      client_id: engagement.clientId,
      start_date: engagement.startDate,
      end_date: engagement.endDate || null,
      currency: engagement.currency,
      price_per_period: engagement.pricePerPeriod,
      salary_per_period: engagement.salaryPerPeriod,
      client_dayoff_rate: engagement.clientDayoffRate,
      dev_dayoff_rate: engagement.devDayoffRate,
      period_unit: engagement.periodUnit,
      is_active: engagement.isActive ? 1 : 0,
      created_at: engagement.createdAt,
    }).select().single();
    if (error) throw error;
    // Map back to camelCase
    return NextResponse.json({
      id: data.id,
      developerId: data.developer_id,
      clientId: data.client_id,
      startDate: data.start_date,
      endDate: data.end_date,
      currency: data.currency,
      pricePerPeriod: data.price_per_period,
      salaryPerPeriod: data.salary_per_period,
      clientDayoffRate: data.client_dayoff_rate,
      devDayoffRate: data.dev_dayoff_rate,
      periodUnit: data.period_unit,
      isActive: Boolean(data.is_active),
      createdAt: data.created_at,
    } as Engagement);
  } catch (error: any) {
    if (error.message === 'Unauthorized') {
      return unauthorizedResponse();
    }
    if (error.message === 'Forbidden') {
      return forbiddenResponse();
    }
    return NextResponse.json({ error: 'Failed to create engagement' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    await requireAdmin();
    const { id, ...updates } = await request.json();
    const updateData: any = {};
    if ('developerId' in updates) updateData.developer_id = updates.developerId;
    if ('clientId' in updates) updateData.client_id = updates.clientId;
    if ('startDate' in updates) updateData.start_date = updates.startDate;
    if ('endDate' in updates) updateData.end_date = updates.endDate;
    if ('currency' in updates) updateData.currency = updates.currency;
    if ('pricePerPeriod' in updates) updateData.price_per_period = updates.pricePerPeriod;
    if ('salaryPerPeriod' in updates) updateData.salary_per_period = updates.salaryPerPeriod;
    if ('clientDayoffRate' in updates) updateData.client_dayoff_rate = updates.clientDayoffRate;
    if ('devDayoffRate' in updates) updateData.dev_dayoff_rate = updates.devDayoffRate;
    if ('periodUnit' in updates) updateData.period_unit = updates.periodUnit;
    if ('isActive' in updates) updateData.is_active = updates.isActive ? 1 : 0;
    if ('createdAt' in updates) updateData.created_at = updates.createdAt;
    const { error } = await db.from('engagements').update(updateData).eq('id', id);
    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (error: any) {
    if (error.message === 'Unauthorized') {
      return unauthorizedResponse();
    }
    if (error.message === 'Forbidden') {
      return forbiddenResponse();
    }
    return NextResponse.json({ error: 'Failed to update engagement' }, { status: 500 });
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
    const { error } = await db.from('engagements').delete().eq('id', id);
    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (error: any) {
    if (error.message === 'Unauthorized') {
      return unauthorizedResponse();
    }
    if (error.message === 'Forbidden') {
      return forbiddenResponse();
    }
    return NextResponse.json({ error: 'Failed to delete engagement' }, { status: 500 });
  }
}

