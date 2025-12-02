import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth, requireAdmin, getUserDeveloperId, unauthorizedResponse, forbiddenResponse } from '@/lib/auth';
import type { DayOffRequest } from '@/types';

export async function GET() {
  try {
    const user = await requireAuth();
    let query = db.from('day_off_requests').select('*');
    
    if (user.role !== 'admin') {
      const developerId = await getUserDeveloperId(user.id);
      if (!developerId) {
        return NextResponse.json([]);
      }
      query = query.eq('developer_id', developerId);
    }
    
    query = query.order('created_at', { ascending: false });
    const { data, error } = await query;
    if (error) throw error;
    const requests = (data || []).map((r: any) => ({
      id: r.id,
      engagementId: r.engagement_id,
      developerId: r.developer_id,
      clientId: r.client_id,
      startDate: r.start_date,
      endDate: r.end_date,
      days: r.days,
      type: r.type,
      reason: r.reason,
      status: r.status,
      submittedBy: r.submitted_by,
      reviewedBy: r.reviewed_by,
      createdAt: r.created_at,
      updatedAt: r.updated_at,
    })) as DayOffRequest[];
    return NextResponse.json(requests);
  } catch (error: any) {
    if (error.message === 'Unauthorized') {
      return unauthorizedResponse();
    }
    return NextResponse.json({ error: 'Failed to fetch day-off requests' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth();
    const dayOffRequest: DayOffRequest = await req.json();

    if (user.role !== 'admin') {
      const developerId = await getUserDeveloperId(user.id);
      if (!developerId || developerId !== dayOffRequest.developerId) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
    }
    const { data, error } = await db.from('day_off_requests').insert({
      id: dayOffRequest.id,
      engagement_id: dayOffRequest.engagementId,
      developer_id: dayOffRequest.developerId,
      client_id: dayOffRequest.clientId,
      start_date: dayOffRequest.startDate,
      end_date: dayOffRequest.endDate,
      days: dayOffRequest.days,
      type: dayOffRequest.type,
      reason: dayOffRequest.reason || null,
      status: dayOffRequest.status,
      submitted_by: dayOffRequest.submittedBy || null,
      reviewed_by: dayOffRequest.reviewedBy || null,
      created_at: dayOffRequest.createdAt,
      updated_at: dayOffRequest.updatedAt,
    }).select().single();
    if (error) throw error;
    return NextResponse.json({
      id: data.id,
      engagementId: data.engagement_id,
      developerId: data.developer_id,
      clientId: data.client_id,
      startDate: data.start_date,
      endDate: data.end_date,
      days: data.days,
      type: data.type,
      reason: data.reason,
      status: data.status,
      submittedBy: data.submitted_by,
      reviewedBy: data.reviewed_by,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    } as DayOffRequest);
  } catch (error: any) {
    if (error.message === 'Unauthorized') {
      return unauthorizedResponse();
    }
    return NextResponse.json({ error: 'Failed to create day-off request' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    await requireAdmin();
    const { id, ...updates } = await req.json();
    const updateData: any = {};
    if ('engagementId' in updates) updateData.engagement_id = updates.engagementId;
    if ('developerId' in updates) updateData.developer_id = updates.developerId;
    if ('clientId' in updates) updateData.client_id = updates.clientId;
    if ('startDate' in updates) updateData.start_date = updates.startDate;
    if ('endDate' in updates) updateData.end_date = updates.endDate;
    if ('days' in updates) updateData.days = updates.days;
    if ('type' in updates) updateData.type = updates.type;
    if ('reason' in updates) updateData.reason = updates.reason;
    if ('status' in updates) updateData.status = updates.status;
    if ('submittedBy' in updates) updateData.submitted_by = updates.submittedBy;
    if ('reviewedBy' in updates) updateData.reviewed_by = updates.reviewedBy;
    if ('createdAt' in updates) updateData.created_at = updates.createdAt;
    if ('updatedAt' in updates) {
      updateData.updated_at = updates.updatedAt;
    } else {
      updateData.updated_at = new Date().toISOString();
    }
    const { error } = await db.from('day_off_requests').update(updateData).eq('id', id);
    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (error: any) {
    if (error.message === 'Unauthorized') {
      return unauthorizedResponse();
    }
    if (error.message === 'Forbidden') {
      return forbiddenResponse();
    }
    return NextResponse.json({ error: 'Failed to update day-off request' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    // Only admins can delete day-off requests
    await requireAdmin();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 });
    }
    
    const { error } = await db.from('day_off_requests').delete().eq('id', id);
    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (error: any) {
    if (error.message === 'Unauthorized') {
      return unauthorizedResponse();
    }
    if (error.message === 'Forbidden') {
      return forbiddenResponse();
    }
    return NextResponse.json({ error: 'Failed to delete day-off request' }, { status: 500 });
  }
}

