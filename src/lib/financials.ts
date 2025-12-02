import type { Engagement, DayOffRequest, HolidayCredit, Holiday, MonthlyFinancials, Invoice } from '@/types';
import { getInvoices, saveInvoice } from './storage';

export function calculateDays(startDate: string, endDate: string): number {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const diffTime = Math.abs(end.getTime() - start.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
  return Math.max(0, diffDays);
}

export function getMonthKey(date: string): string {
  const d = new Date(date);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`;
}

export function isEngagementActiveInMonth(engagement: Engagement, month: string): boolean {
  const monthDate = new Date(month);
  const monthStart = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1);
  const monthEnd = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0);
  
  const engagementStart = new Date(engagement.startDate);
  const engagementEnd = engagement.endDate ? new Date(engagement.endDate) : null;
  
  if (!engagement.isActive) return false;
  
  if (engagementStart > monthEnd) return false;
  
  if (engagementEnd && engagementEnd < monthStart) return false;
  
  return true;
}

export function calculateMonthlyFinancials(
  engagements: Engagement[],
  dayOffRequests: DayOffRequest[],
  holidayCredits: HolidayCredit[],
  month: string,
  holidays?: Holiday[]
): MonthlyFinancials[] {
  const activeEngagements = engagements.filter((engagement) =>
    isEngagementActiveInMonth(engagement, month)
  );

  return activeEngagements.map((engagement) => {
    const approvedDayOffs = dayOffRequests.filter(
      (req) =>
        req.engagementId === engagement.id &&
        req.status === 'client_approved' &&
        getMonthKey(req.startDate) === month
    );

    const explicitCredits = holidayCredits.filter(
      (credit) => {
        const creditMonth = getMonthKey(credit.date);
        return credit.engagementId === engagement.id && creditMonth === month;
      }
    );

    const holidaysWithoutCredits = holidays
      ? holidays.filter(
          (holiday) => {
            const hasCredit = holidayCredits.some(
              (credit) =>
                credit.engagementId === holiday.engagementId &&
                credit.date === holiday.date
            );
            const holidayMonth = getMonthKey(holiday.date);
            return (
              holiday.engagementId === engagement.id &&
              !holiday.isTaken &&
              !hasCredit &&
              holidayMonth === month
            );
          }
        ).length
      : 0;

    const approvedDays = approvedDayOffs.reduce((sum, req) => sum + req.days, 0);
    const explicitCreditDays = explicitCredits.reduce((sum, credit) => sum + credit.creditDays, 0);
    const totalCreditDays = explicitCreditDays + holidaysWithoutCredits;
    
    const creditDays = totalCreditDays;
    const billableDeductionDays = approvedDays > totalCreditDays ? approvedDays - totalCreditDays : 0;

    const weeksPerMonth = 52 / 12;
    const monthlyPricePerPeriod =
      engagement.periodUnit === 'month'
        ? engagement.pricePerPeriod
        : engagement.pricePerPeriod * weeksPerMonth;
    const monthlySalaryPerPeriod =
      engagement.periodUnit === 'month'
        ? engagement.salaryPerPeriod
        : engagement.salaryPerPeriod * weeksPerMonth;

    const section2ClientInvoice =
      monthlyPricePerPeriod - billableDeductionDays * engagement.clientDayoffRate;
    
    const section3DevPay = monthlySalaryPerPeriod - billableDeductionDays * engagement.devDayoffRate;
    
    const section1CompanyNet = section2ClientInvoice - section3DevPay;

    return {
      engagementId: engagement.id,
      month,
      approvedDays,
      creditDays,
      billableDeductionDays,
      section2ClientInvoice,
      section3DevPay,
      section1CompanyNet,
    };
  });
}

export async function getOrGenerateInvoices(
  engagements: Engagement[],
  dayOffRequests: DayOffRequest[],
  holidayCredits: HolidayCredit[],
  month: string,
  holidays?: Holiday[]
): Promise<MonthlyFinancials[]> {
  const monthDate = new Date(month);
  const today = new Date();
  const isPastMonth = monthDate < new Date(today.getFullYear(), today.getMonth(), 1);

  const activeEngagements = engagements.filter((engagement) =>
    isEngagementActiveInMonth(engagement, month)
  );

  if (isPastMonth && activeEngagements.length > 0) {
    try {
      const existingInvoices = await getInvoices(month);
      const engagementIdsWithInvoices = new Set(existingInvoices.map((inv) => inv.engagementId));
      const allEngagementsHaveInvoices = activeEngagements.every((eng) =>
        engagementIdsWithInvoices.has(eng.id)
      );

      if (allEngagementsHaveInvoices && existingInvoices.length > 0) {
        // Recalculate credits for existing invoices (holidays might have been added later)
        // but keep other values as they were when the invoice was generated
        return existingInvoices.map((invoice) => {
          const engagement = engagements.find((e) => e.id === invoice.engagementId);
          if (!engagement) {
            return {
              engagementId: invoice.engagementId,
              month: invoice.month,
              approvedDays: invoice.approvedDays,
              creditDays: invoice.creditDays,
              billableDeductionDays: invoice.billableDeductionDays,
              section2ClientInvoice: invoice.section2ClientInvoice,
              section3DevPay: invoice.section3DevPay,
              section1CompanyNet: invoice.section1CompanyNet,
            };
          }

          // Recalculate credits for this month
          const explicitCredits = holidayCredits.filter(
            (credit) => {
              const creditMonth = getMonthKey(credit.date);
              return credit.engagementId === engagement.id && creditMonth === month;
            }
          );

          const holidaysWithoutCredits = holidays
            ? holidays.filter(
                (holiday) => {
                  const hasCredit = holidayCredits.some(
                    (credit) =>
                      credit.engagementId === holiday.engagementId &&
                      credit.date === holiday.date
                  );
                  const holidayMonth = getMonthKey(holiday.date);
                  return (
                    holiday.engagementId === engagement.id &&
                    !holiday.isTaken &&
                    !hasCredit &&
                    holidayMonth === month
                  );
                }
              ).length
            : 0;

          const explicitCreditDays = explicitCredits.reduce((sum, credit) => sum + credit.creditDays, 0);
          const recalculatedCreditDays = explicitCreditDays + holidaysWithoutCredits;

          return {
            engagementId: invoice.engagementId,
            month: invoice.month,
            approvedDays: invoice.approvedDays,
            creditDays: recalculatedCreditDays,
            billableDeductionDays: invoice.billableDeductionDays,
            section2ClientInvoice: invoice.section2ClientInvoice,
            section3DevPay: invoice.section3DevPay,
            section1CompanyNet: invoice.section1CompanyNet,
          };
        });
      }
    } catch (error) {
      console.error('Failed to fetch existing invoices:', error);
    }
  }

  const financials = calculateMonthlyFinancials(engagements, dayOffRequests, holidayCredits, month, holidays);

  if (isPastMonth && financials.length > 0) {
    try {
      const invoices: Invoice[] = financials.map((f) => {
        const engagement = engagements.find((e) => e.id === f.engagementId);
        if (!engagement) throw new Error(`Engagement ${f.engagementId} not found`);

        return {
          id: `${f.engagementId}-${month}`,
          engagementId: f.engagementId,
          month: f.month,
          approvedDays: f.approvedDays,
          creditDays: f.creditDays,
          billableDeductionDays: f.billableDeductionDays,
          section2ClientInvoice: f.section2ClientInvoice,
          section3DevPay: f.section3DevPay,
          section1CompanyNet: f.section1CompanyNet,
          pricePerPeriod: engagement.pricePerPeriod,
          salaryPerPeriod: engagement.salaryPerPeriod,
          clientDayoffRate: engagement.clientDayoffRate,
          devDayoffRate: engagement.devDayoffRate,
          periodUnit: engagement.periodUnit,
          currency: engagement.currency,
          createdAt: new Date().toISOString(),
        };
      });

      await Promise.all(invoices.map((invoice) => saveInvoice(invoice)));
    } catch (error) {
      console.error('Failed to save invoices:', error);
    }
  }

  return financials;
}

export function getAvailableMonths(engagements: Engagement[]): string[] {
  const months = new Set<string>();
  const today = new Date();
  
  const activeEngagements = engagements.filter((e) => e.isActive);
  
  activeEngagements.forEach((engagement) => {
    const start = new Date(engagement.startDate);
    const end = engagement.endDate ? new Date(engagement.endDate) : today;
    
    const current = new Date(start.getFullYear(), start.getMonth(), 1);
    while (current <= end) {
      const monthKey = getMonthKey(current.toISOString());
      if (isEngagementActiveInMonth(engagement, monthKey)) {
        months.add(monthKey);
      }
      current.setMonth(current.getMonth() + 1);
    }
  });
  
  return Array.from(months).sort().reverse();
}
