import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import {
  requireAuth,
  requireAdmin,
  getUserDeveloperId,
  unauthorizedResponse,
  forbiddenResponse,
} from "@/lib/auth";
import type { Invoice, MonthlyFinancials } from "@/types";

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth();
    const { searchParams } = new URL(request.url);
    const month = searchParams.get("month");
    const engagementId = searchParams.get("engagementId");

    let query = db.from("invoices").select("*");

    // If user is not admin, filter by their developer's engagements
    if (user.role !== "admin") {
      const developerId = await getUserDeveloperId(user.id);
      if (!developerId) {
        // User has no developer profile, return empty array
        return NextResponse.json([]);
      }
      // Get engagements for this developer
      const { data: engagements } = await db
        .from("engagements")
        .select("id")
        .eq("developer_id", developerId);

      if (!engagements || engagements.length === 0) {
        return NextResponse.json([]);
      }

      const engagementIds = engagements.map((e) => e.id);
      query = query.in("engagement_id", engagementIds);
    }

    if (month) {
      query = query.eq("month", month);
    }
    if (engagementId) {
      query = query.eq("engagement_id", engagementId);
    }

    query = query
      .order("month", { ascending: false })
      .order("created_at", { ascending: false });

    const { data, error } = await query;
    if (error) throw error;
    // Map snake_case to camelCase
    const invoices = (data || []).map((inv: any) => ({
      id: inv.id,
      engagementId: inv.engagement_id,
      month: inv.month,
      approvedDays: inv.approved_days,
      creditDays: inv.credit_days,
      billableDeductionDays: inv.billable_deduction_days,
      section2ClientInvoice: inv.section2_client_invoice,
      section3DevPay: inv.section3_dev_pay,
      section1CompanyNet: inv.section1_company_net,
      pricePerPeriod: inv.price_per_period,
      salaryPerPeriod: inv.salary_per_period,
      clientDayoffRate: inv.client_dayoff_rate,
      devDayoffRate: inv.dev_dayoff_rate,
      periodUnit: inv.period_unit,
      currency: inv.currency,
      createdAt: inv.created_at,
    })) as Invoice[];
    return NextResponse.json(invoices);
  } catch (error: any) {
    if (error.message === "Unauthorized") {
      return unauthorizedResponse();
    }
    return NextResponse.json(
      { error: "Failed to fetch invoices" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Only admins can create invoices
    await requireAdmin();
    const invoice: Invoice = await request.json();
    // Use upsert to handle INSERT OR REPLACE behavior
    const { data, error } = await db
      .from("invoices")
      .upsert(
        {
          id: invoice.id,
          engagement_id: invoice.engagementId,
          month: invoice.month,
          approved_days: invoice.approvedDays,
          credit_days: invoice.creditDays,
          billable_deduction_days: invoice.billableDeductionDays,
          section2_client_invoice: invoice.section2ClientInvoice,
          section3_dev_pay: invoice.section3DevPay,
          section1_company_net: invoice.section1CompanyNet,
          price_per_period: invoice.pricePerPeriod,
          salary_per_period: invoice.salaryPerPeriod,
          client_dayoff_rate: invoice.clientDayoffRate,
          dev_dayoff_rate: invoice.devDayoffRate,
          period_unit: invoice.periodUnit,
          currency: invoice.currency,
          created_at: invoice.createdAt,
        },
        { onConflict: "engagement_id,month" },
      )
      .select()
      .single();
    if (error) throw error;
    // Map back to camelCase
    return NextResponse.json({
      id: data.id,
      engagementId: data.engagement_id,
      month: data.month,
      approvedDays: data.approved_days,
      creditDays: data.credit_days,
      billableDeductionDays: data.billable_deduction_days,
      section2ClientInvoice: data.section2_client_invoice,
      section3DevPay: data.section3_dev_pay,
      section1CompanyNet: data.section1_company_net,
      pricePerPeriod: data.price_per_period,
      salaryPerPeriod: data.salary_per_period,
      clientDayoffRate: data.client_dayoff_rate,
      devDayoffRate: data.dev_dayoff_rate,
      periodUnit: data.period_unit,
      currency: data.currency,
      createdAt: data.created_at,
    } as Invoice);
  } catch (error: any) {
    if (error.message === "Unauthorized") {
      return unauthorizedResponse();
    }
    if (error.message === "Forbidden") {
      return forbiddenResponse();
    }
    return NextResponse.json(
      { error: "Failed to create invoice" },
      { status: 500 },
    );
  }
}
