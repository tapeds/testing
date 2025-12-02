"use client";

import { useState, useEffect, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  getEngagements,
  getDayOffRequests,
  getHolidayCredits,
  getHolidays,
  getDevelopers,
  getClients,
} from '@/lib/storage';
import { getOrGenerateInvoices, getAvailableMonths } from '@/lib/financials';
import type { MonthlyFinancials } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Loader2 } from 'lucide-react';

export default function Invoices() {
  const [selectedMonth, setSelectedMonth] = useState<string>('');

  const { data: engagements = [], isLoading: isLoadingEngagements } = useQuery({
    queryKey: ['engagements'],
    queryFn: getEngagements,
  });

  const { data: dayOffRequests = [], isLoading: isLoadingDayOffRequests } = useQuery({
    queryKey: ['dayOffRequests'],
    queryFn: getDayOffRequests,
  });

  const { data: holidayCredits = [], isLoading: isLoadingHolidayCredits } = useQuery({
    queryKey: ['holidayCredits'],
    queryFn: getHolidayCredits,
  });

  const { data: holidays = [], isLoading: isLoadingHolidays } = useQuery({
    queryKey: ['holidays'],
    queryFn: getHolidays,
  });

  const { data: developers = [], isLoading: isLoadingDevelopers } = useQuery({
    queryKey: ['developers'],
    queryFn: getDevelopers,
  });

  const { data: clients = [], isLoading: isLoadingClients } = useQuery({
    queryKey: ['clients'],
    queryFn: getClients,
  });

  const isLoading = isLoadingEngagements || isLoadingDayOffRequests || isLoadingHolidayCredits || 
                    isLoadingHolidays || isLoadingDevelopers || isLoadingClients;

  const availableMonths = useMemo(() => {
    return getAvailableMonths(engagements);
  }, [engagements]);

  useEffect(() => {
    if (!selectedMonth && availableMonths.length > 0) {
      setSelectedMonth(availableMonths[0]);
    }
  }, [selectedMonth, availableMonths]);

  const { data: financials = [] } = useQuery({
    queryKey: ['invoices', selectedMonth, engagements, dayOffRequests, holidayCredits, holidays],
    queryFn: async () => {
      if (!selectedMonth) return [];
      return getOrGenerateInvoices(engagements, dayOffRequests, holidayCredits, selectedMonth, holidays);
    },
    enabled: !!selectedMonth,
  });

  const totals = financials.reduce(
    (acc, f) => ({
      section1: acc.section1 + f.section1CompanyNet,
      section2: acc.section2 + f.section2ClientInvoice,
      section3: acc.section3 + f.section3DevPay,
    }),
    { section1: 0, section2: 0, section3: 0 }
  );

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const formatMonth = (monthStr: string) => {
    const date = new Date(monthStr);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long' });
  };

  if (isLoading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          <p className="text-sm text-muted-foreground">Loading invoices...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-10">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <h1 className="text-4xl font-semibold tracking-tight">Invoice Report</h1>
          <p className="text-muted-foreground text-lg">
            Financial breakdown per month
          </p>
        </div>
        <div className="w-64">
          <Select value={selectedMonth} onValueChange={setSelectedMonth}>
            <SelectTrigger>
              <SelectValue placeholder="Select month" />
            </SelectTrigger>
            <SelectContent>
              {availableMonths.map((month) => (
                <SelectItem key={month} value={month}>
                  {formatMonth(month)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {availableMonths.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            No active engagements found. Create an engagement to generate invoices.
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Section 1: Company Net
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">
              {formatCurrency(totals.section1)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Invoice to clients minus dev pay
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Section 2: Client Invoice
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totals.section2)}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Total billed to clients
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Section 3: Developer Pay
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totals.section3)}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Total paid to developers
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Table */}
      <Card>
        <CardHeader>
          <CardTitle>Engagement Details</CardTitle>
        </CardHeader>
        <CardContent>
          {financials.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              No engagements for this month
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Developer</TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead className="text-right">Approved Days</TableHead>
                  <TableHead className="text-right">Credit Days</TableHead>
                  <TableHead className="text-right">Deduction Days</TableHead>
                  <TableHead className="text-right">Client Invoice</TableHead>
                  <TableHead className="text-right">Dev Pay</TableHead>
                  <TableHead className="text-right">Net</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {financials.map((f) => {
                  const engagement = engagements.find((e) => e.id === f.engagementId);
                  const developer = developers.find((d) => d.id === engagement?.developerId);
                  const client = clients.find((c) => c.id === engagement?.clientId);

                  return (
                    <TableRow key={f.engagementId}>
                      <TableCell className="font-medium">
                        {developer?.name}
                      </TableCell>
                      <TableCell>{client?.name}</TableCell>
                      <TableCell className="text-right">{f.approvedDays}</TableCell>
                      <TableCell className="text-right">{f.creditDays}</TableCell>
                      <TableCell className="text-right">
                        {f.billableDeductionDays}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(f.section2ClientInvoice)}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(f.section3DevPay)}
                      </TableCell>
                      <TableCell className="text-right font-bold text-primary">
                        {formatCurrency(f.section1CompanyNet)}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
        </>
      )}
    </div>
  );
}

