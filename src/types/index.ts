export type Role = 'admin' | 'employee' | 'client_approver';

export type DayOffStatus = 'draft' | 'submitted' | 'client_approved' | 'client_rejected' | 'cancelled';

export type DayOffType = 'vacation' | 'sick_leave' | 'personal' | 'unpaid';

export type Currency = 'USD' | 'EUR' | 'GBP' | 'IDR';

export type PeriodUnit = 'month' | 'week';

export interface User {
  id: string;
  email: string;
  fullName: string;
  role: Role;
  createdAt: string;
}

export interface Developer {
  id: string;
  name: string;
  userId?: string;
  createdAt: string;
}

export interface Client {
  id: string;
  name: string;
  primaryContactUserId?: string;
  createdAt: string;
}

export interface Engagement {
  id: string;
  developerId: string;
  clientId: string;
  startDate: string;
  endDate?: string;
  currency: Currency;
  pricePerPeriod: number;
  salaryPerPeriod: number;
  clientDayoffRate: number;
  devDayoffRate: number;
  periodUnit: PeriodUnit;
  isActive: boolean;
  createdAt: string;
}

export interface DayOffRequest {
  id: string;
  engagementId: string;
  developerId: string;
  clientId: string;
  startDate: string;
  endDate: string;
  days: number;
  type: DayOffType;
  reason?: string;
  status: DayOffStatus;
  submittedBy?: string;
  reviewedBy?: string;
  createdAt: string;
  updatedAt: string;
}

export interface HolidayCredit {
  id: string;
  engagementId: string;
  date: string;
  creditDays: number;
  note?: string;
  createdBy?: string;
  createdAt: string;
}

export interface Holiday {
  id: string;
  engagementId: string;
  date: string;
  name: string;
  isTaken: boolean;
  createdAt: string;
}

export interface MonthlyFinancials {
  engagementId: string;
  month: string;
  approvedDays: number;
  creditDays: number;
  billableDeductionDays: number;
  section2ClientInvoice: number;
  section3DevPay: number;
  section1CompanyNet: number;
}

export interface Invoice {
  id: string;
  engagementId: string;
  month: string;
  approvedDays: number;
  creditDays: number;
  billableDeductionDays: number;
  section2ClientInvoice: number;
  section3DevPay: number;
  section1CompanyNet: number;
  // Snapshot of engagement data at time of invoice generation
  pricePerPeriod: number;
  salaryPerPeriod: number;
  clientDayoffRate: number;
  devDayoffRate: number;
  periodUnit: PeriodUnit;
  currency: Currency;
  createdAt: string;
}
