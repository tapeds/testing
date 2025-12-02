"use client";

import { useEffect, useState, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSession } from '@/hooks/useSession';
import {
  getDayOffRequests,
  addDayOffRequest,
  updateDayOffRequest,
  getEngagements,
  getDevelopers,
  getClients,
  getHolidays,
  addHoliday,
  getHolidayCredits,
} from '@/lib/storage';
import type { DayOffRequest, Engagement, Developer, Client, Holiday } from '@/types';
import { calculateDays } from '@/lib/financials';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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
import { Badge } from '@/components/ui/badge';
import { Plus, Check, X, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import DeveloperCalendar from '@/components/DeveloperCalendar';

type DayOffFormData = {
  engagementId: string;
  type: DayOffRequest['type'];
  startDate: string;
  endDate: string;
  reason?: string;
};

type HolidayFormData = {
  name: string;
};

export default function DayOff() {
  const queryClient = useQueryClient();
  const { data: session } = useSession();
  const isAdmin = session?.role === 'admin';
  const [selectedMonth, setSelectedMonth] = useState<string>('');
  const [selectedDeveloper, setSelectedDeveloper] = useState<string>('all');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isHolidayDialogOpen, setIsHolidayDialogOpen] = useState(false);
  const [prefilledDate, setPrefilledDate] = useState<string>('');
  const [prefilledEngagementId, setPrefilledEngagementId] = useState<string>('');
  const { toast } = useToast();

  const dayOffForm = useForm<DayOffFormData>({
    defaultValues: {
      engagementId: '',
      type: 'vacation',
      startDate: '',
      endDate: '',
      reason: '',
    },
    mode: 'onChange',
  });

  const holidayForm = useForm<HolidayFormData>({
    defaultValues: {
      name: '',
    },
    mode: 'onChange',
  });

  const { data: dayOffRequestsRaw = [], isLoading: isLoadingDayOffRequests } = useQuery({
    queryKey: ['dayOffRequests'],
    queryFn: getDayOffRequests,
  });

  const requests = useMemo(
    () =>
      dayOffRequestsRaw.map((req) => ({
        ...req,
        type: req.type || 'vacation',
      })) as DayOffRequest[],
    [dayOffRequestsRaw]
  );

  const { data: engagements = [], isLoading: isLoadingEngagements } = useQuery({
    queryKey: ['engagements'],
    queryFn: getEngagements,
    enabled: isAdmin,
  });

  const { data: developers = [], isLoading: isLoadingDevelopers } = useQuery({
    queryKey: ['developers'],
    queryFn: getDevelopers,
    enabled: isAdmin,
  });

  const { data: clients = [], isLoading: isLoadingClients } = useQuery({
    queryKey: ['clients'],
    queryFn: getClients,
    enabled: isAdmin,
  });

  const { data: holidays = [], isLoading: isLoadingHolidays } = useQuery({
    queryKey: ['holidays'],
    queryFn: getHolidays,
    enabled: isAdmin,
  });

  const { data: holidayCredits = [], isLoading: isLoadingHolidayCredits } = useQuery({
    queryKey: ['holidayCredits'],
    queryFn: getHolidayCredits,
    enabled: isAdmin,
  });

  const isLoading = isLoadingDayOffRequests || (isAdmin && (isLoadingEngagements || isLoadingDevelopers || isLoadingClients || isLoadingHolidays || isLoadingHolidayCredits));

  const addDayOffMutation = useMutation({
    mutationFn: async (request: DayOffRequest) => {
      await addDayOffRequest(request);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dayOffRequests'] });
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      toast({
        title: 'Request submitted',
        description: 'Day off request has been submitted.',
      });
      dayOffForm.reset();
      setIsDialogOpen(false);
    },
  });

  const updateDayOffMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<DayOffRequest> }) => {
      await updateDayOffRequest(id, updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dayOffRequests'] });
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
    },
  });

  const addHolidayMutation = useMutation({
    mutationFn: async (holiday: Holiday) => {
      await addHoliday(holiday);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['holidays'] });
      queryClient.invalidateQueries({ queryKey: ['holidayCredits'] });
      toast({
        title: 'Holiday added',
      });
      holidayForm.reset();
      setIsHolidayDialogOpen(false);
      setPrefilledDate('');
      setPrefilledEngagementId('');
    },
  });

  useEffect(() => {
    const today = new Date();
    const monthKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-01`;
    setSelectedMonth(monthKey);
  }, []);

  const onSubmitDayOff = (data: DayOffFormData) => {
    const engagement = engagements.find((e) => e.id === data.engagementId);

    if (!engagement) return;

    const days = calculateDays(data.startDate, data.endDate);

    const newRequest: DayOffRequest = {
      id: Date.now().toString(),
      engagementId: data.engagementId,
      developerId: engagement.developerId,
      clientId: engagement.clientId,
      startDate: data.startDate,
      endDate: data.endDate,
      days,
      type: data.type,
      reason: data.reason,
      status: 'submitted',
      submittedBy: undefined,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    addDayOffMutation.mutate(newRequest, {
      onSuccess: () => {
        toast({
          description: `Day off request for ${days} day(s) has been submitted.`,
        });
      },
    });
  };

  const handleApprove = (requestId: string) => {
    updateDayOffMutation.mutate(
      {
        id: requestId,
        updates: {
          status: 'client_approved',
          reviewedBy: undefined,
        },
      },
      {
        onSuccess: () => {
          toast({
            title: 'Request approved',
            description: 'Day off request has been approved.',
          });
        },
      }
    );
  };

  const handleReject = (requestId: string) => {
    updateDayOffMutation.mutate(
      {
        id: requestId,
        updates: {
          status: 'client_rejected',
          reviewedBy: undefined,
        },
      },
      {
        onSuccess: () => {
          toast({
            title: 'Request rejected',
            description: 'Day off request has been rejected.',
            variant: 'destructive',
          });
        },
      }
    );
  };

  const handleAddDayOffFromCalendar = (date: string, engagementId: string) => {
    setPrefilledDate(date);
    setPrefilledEngagementId(engagementId);
    dayOffForm.reset({
      engagementId,
      type: 'vacation',
      startDate: date,
      endDate: date,
      reason: '',
    });
    setIsDialogOpen(true);
  };

  const handleAddHolidayFromCalendar = (date: string, engagementId: string) => {
    setPrefilledDate(date);
    setPrefilledEngagementId(engagementId);
    holidayForm.reset({ name: '' });
    setIsHolidayDialogOpen(true);
  };

  const onSubmitHoliday = (data: HolidayFormData) => {
    const newHoliday: Holiday = {
      id: Date.now().toString(),
      engagementId: prefilledEngagementId,
      date: prefilledDate,
      name: data.name,
      isTaken: false,
      createdAt: new Date().toISOString(),
    };

    addHolidayMutation.mutate(newHoliday, {
      onSuccess: () => {
        toast({
          description: `${newHoliday.name} has been added.`,
        });
      },
    });
  };

  const filteredEngagements = engagements.filter((eng) => {
    if (selectedDeveloper === 'all') return true;
    return eng.developerId === selectedDeveloper;
  });

  const calculateTotalCredits = (engagementId: string) => {
    const engagementHolidays = holidays.filter(
      (h) => h.engagementId === engagementId && !h.isTaken
    );
    const credits = holidayCredits.filter((c) => c.engagementId === engagementId);
    
    const engagement = engagements.find((e) => e.id === engagementId);
    if (!engagement) return 0;

    const engagementStart = new Date(engagement.startDate);
    
    // Count holiday credits from engagement start
    const holidayCreditsCount = engagementHolidays.filter(
      (h) => new Date(h.date) >= engagementStart
    ).length;
    
    const manualCredits = credits
      .filter((c) => new Date(c.date) >= engagementStart)
      .reduce((sum, c) => sum + c.creditDays, 0);

    // Count approved day offs from engagement start
    const approvedDayOffs = requests
      .filter(
        (req) =>
          req.engagementId === engagementId &&
          req.status === 'client_approved' &&
          new Date(req.startDate) >= engagementStart
      )
      .reduce((sum, req) => sum + req.days, 0);

    return holidayCreditsCount + manualCredits - approvedDayOffs;
  };

  const getMonthlyRequests = (engagementId: string) => {
    const monthDate = new Date(selectedMonth);
    return requests.filter((req) => {
      const reqDate = new Date(req.startDate);
      return (
        req.engagementId === engagementId &&
        reqDate.getMonth() === monthDate.getMonth() &&
        reqDate.getFullYear() === monthDate.getFullYear()
      );
    });
  };

  const getMonthlyHolidays = (engagementId: string) => {
    const monthDate = new Date(selectedMonth);
    return holidays.filter((h) => {
      const hDate = new Date(h.date);
      return (
        h.engagementId === engagementId &&
        hDate.getMonth() === monthDate.getMonth() &&
        hDate.getFullYear() === monthDate.getFullYear()
      );
    });
  };

  const availableMonths = Array.from({ length: 12 }, (_, i) => {
    const date = new Date();
    date.setMonth(date.getMonth() - i);
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-01`;
  });

  if (isLoading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          <p className="text-sm text-muted-foreground">Loading day off calendar...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-10">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <h1 className="text-4xl font-semibold tracking-tight">Day Off Calendar</h1>
          <p className="text-muted-foreground text-lg">
            View day offs, holidays, and credits per developer
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              New Request
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Day Off Request</DialogTitle>
            </DialogHeader>
            <Form {...dayOffForm}>
              <form onSubmit={dayOffForm.handleSubmit(onSubmitDayOff)} className="space-y-4">
                <FormField
                  control={dayOffForm.control}
                  name="engagementId"
                  rules={{ required: 'Engagement is required' }}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Engagement</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select engagement" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {engagements.map((eng) => {
                            const dev = developers.find((d) => d.id === eng.developerId);
                            const client = clients.find((c) => c.id === eng.clientId);
                            return (
                              <SelectItem key={eng.id} value={eng.id}>
                                {dev?.name} → {client?.name}
                              </SelectItem>
                            );
                          })}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={dayOffForm.control}
                  name="type"
                  rules={{ required: 'Type is required' }}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Type</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="vacation">Vacation</SelectItem>
                          <SelectItem value="sick_leave">Sick Leave</SelectItem>
                          <SelectItem value="personal">Personal Day</SelectItem>
                          <SelectItem value="unpaid">Unpaid Leave</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={dayOffForm.control}
                  name="startDate"
                  rules={{ required: 'Start date is required' }}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Start Date</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={dayOffForm.control}
                  name="endDate"
                  rules={{ required: 'End date is required' }}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>End Date</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={dayOffForm.control}
                  name="reason"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Reason (optional)</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Vacation, personal day, etc." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" className="w-full" disabled={addDayOffMutation.isPending}>
                  Submit Request
                </Button>
              </form>
            </Form>
          </DialogContent>
        </Dialog>

        {/* Holiday Dialog - Admin only */}
        {isAdmin && (
          <Dialog open={isHolidayDialogOpen} onOpenChange={setIsHolidayDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Holiday</DialogTitle>
            </DialogHeader>
            <Form {...holidayForm}>
              <form onSubmit={holidayForm.handleSubmit(onSubmitHoliday)} className="space-y-4">
                <FormItem>
                  <FormLabel>Date</FormLabel>
                  <Input 
                    type="date" 
                    value={prefilledDate}
                    readOnly
                    className="bg-muted"
                  />
                </FormItem>
                <FormField
                  control={holidayForm.control}
                  name="name"
                  rules={{ required: 'Holiday name is required' }}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Holiday Name</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Christmas, New Year" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" className="w-full" disabled={addHolidayMutation.isPending}>
                  Add Holiday
                </Button>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
        )}
      </div>

      {/* Filters */}
      <div className="flex gap-4">
        <div className="w-64">
          <Label>Month</Label>
          <Select value={selectedMonth} onValueChange={setSelectedMonth}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {availableMonths.map((month, index) => {
                const date = new Date(month);
                return (
                  <SelectItem key={`month-${index}-${month}`} value={month}>
                    {date.toLocaleDateString('en-US', { year: 'numeric', month: 'long' })}
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
        </div>
        {isAdmin && (
          <div className="w-64">
            <Label>Developer</Label>
            <Select value={selectedDeveloper} onValueChange={setSelectedDeveloper}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Developers</SelectItem>
                {developers.map((dev) => (
                  <SelectItem key={dev.id} value={dev.id}>
                    {dev.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      {isAdmin && requests.filter((r) => r.status === 'submitted').length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Pending Approvals</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Developer</TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Dates</TableHead>
                  <TableHead>Days</TableHead>
                  <TableHead>Reason</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {requests
                  .filter((r) => r.status === 'submitted')
                  .map((request) => {
                    const developer = developers.find((d) => d.id === request.developerId);
                    const client = clients.find((c) => c.id === request.clientId);
                    return (
                      <TableRow key={request.id}>
                        <TableCell className="font-medium">{developer?.name}</TableCell>
                        <TableCell>{client?.name}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="capitalize">
                            {(request.type || 'vacation').replace('_', ' ')}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {new Date(request.startDate).toLocaleDateString()} -{' '}
                          {new Date(request.endDate).toLocaleDateString()}
                        </TableCell>
                        <TableCell>{request.days}</TableCell>
                        <TableCell className="max-w-xs truncate">{request.reason || '-'}</TableCell>
                        <TableCell className="text-right space-x-2">
                          <Button
                            size="sm"
                            variant="default"
                            onClick={() => handleApprove(request.id)}
                          >
                            <Check className="w-4 h-4 mr-1" />
                            Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleReject(request.id)}
                          >
                            <X className="w-4 h-4 mr-1" />
                            Reject
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Calendars */}
      <div className="space-y-4">
        {engagements.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              No engagements yet. Create an engagement to view day off calendars.
            </CardContent>
          </Card>
        ) : !selectedMonth ? (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              Loading calendar...
            </CardContent>
          </Card>
        ) : filteredEngagements.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              No engagements found for this filter.
            </CardContent>
          </Card>
        ) : (
          filteredEngagements.map((engagement) => {
            const developer = developers.find((d) => d.id === engagement.developerId);
            const client = clients.find((c) => c.id === engagement.clientId);
            const monthlyRequests = getMonthlyRequests(engagement.id);
            const monthlyHolidays = getMonthlyHolidays(engagement.id);
            const totalCredits = calculateTotalCredits(engagement.id);

            return (
              <DeveloperCalendar
                key={engagement.id}
                developerName={`${developer?.name} → ${client?.name}`}
                engagement={engagement}
                month={selectedMonth}
                dayOffRequests={monthlyRequests}
                holidays={monthlyHolidays}
                totalCredits={totalCredits}
                onAddDayOff={handleAddDayOffFromCalendar}
                onAddHoliday={handleAddHolidayFromCalendar}
              />
            );
          })
        )}
      </div>
    </div>
  );
}

