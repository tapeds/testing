"use client";

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getHolidays,
  addHoliday,
  updateHoliday,
  deleteHoliday,
  getEngagements,
  getDevelopers,
  getClients,
  addHolidayCredit,
  deleteHolidayCredit,
  getHolidayCredits,
} from '@/lib/storage';
import type { Holiday, Engagement, HolidayCredit } from '@/types';
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
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
import { Loader2, Plus, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

type HolidayFormData = {
  engagementId: string;
  startDate: string;
  endDate: string;
  name: string;
};

export default function Holidays() {
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [inputMode, setInputMode] = useState<'single' | 'json'>('single');
  const [jsonInput, setJsonInput] = useState('');
  const { toast } = useToast();

  const form = useForm<HolidayFormData>({
    defaultValues: {
      engagementId: '',
      startDate: '',
      endDate: '',
      name: '',
    },
    mode: 'onChange',
  });

  const { data: holidays = [], isLoading: isLoadingHolidays } = useQuery({
    queryKey: ['holidays'],
    queryFn: getHolidays,
  });

  const { data: holidayCredits = [], isLoading: isLoadingHolidayCredits } = useQuery({
    queryKey: ['holidayCredits'],
    queryFn: getHolidayCredits,
  });

  const { data: engagements = [], isLoading: isLoadingEngagements } = useQuery({
    queryKey: ['engagements'],
    queryFn: getEngagements,
  });

  const { data: developers = [], isLoading: isLoadingDevelopers } = useQuery({
    queryKey: ['developers'],
    queryFn: getDevelopers,
  });

  const { data: clients = [], isLoading: isLoadingClients } = useQuery({
    queryKey: ['clients'],
    queryFn: getClients,
  });

  const isLoading = isLoadingHolidays || isLoadingHolidayCredits || isLoadingEngagements || isLoadingDevelopers || isLoadingClients;

  const addMutation = useMutation({
    mutationFn: async (holiday: Holiday) => {
      await addHoliday(holiday);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['holidays'] });
      queryClient.invalidateQueries({ queryKey: ['holidayCredits'] });
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      toast({
        title: 'Holiday added',
      });
      form.reset();
      setIsDialogOpen(false);
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<Holiday> }) => {
      await updateHoliday(id, updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['holidays'] });
      queryClient.invalidateQueries({ queryKey: ['holidayCredits'] });
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await deleteHoliday(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['holidays'] });
      queryClient.invalidateQueries({ queryKey: ['holidayCredits'] });
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      toast({
        title: 'Holiday deleted',
      });
    },
  });

  const addCreditMutation = useMutation({
    mutationFn: async (credit: HolidayCredit) => {
      await addHolidayCredit(credit);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['holidayCredits'] });
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
    },
  });

  const deleteCreditMutation = useMutation({
    mutationFn: async (id: string) => {
      await deleteHolidayCredit(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['holidayCredits'] });
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
    },
  });

  const onSubmit = (data: HolidayFormData) => {
    const startDate = new Date(data.startDate);
    const endDate = new Date(data.endDate);
    
    const dates: string[] = [];
    const currentDate = new Date(startDate);
    
    while (currentDate <= endDate) {
      dates.push(currentDate.toISOString().split('T')[0]);
      currentDate.setDate(currentDate.getDate() + 1);
    }

    const holidaysToCreate = dates.map((date, index) => ({
      id: `${Date.now()}-${index}`,
      engagementId: data.engagementId,
      date,
      name: data.name,
      isTaken: false,
      createdAt: new Date().toISOString(),
    }));

    Promise.all(
      holidaysToCreate.map((holiday) => {
        return addHoliday(holiday).then(() => {
          return addHolidayCredit({
            id: `${Date.now()}-credit-${holiday.date}`,
            engagementId: data.engagementId,
            date: holiday.date,
            creditDays: 1,
            note: `Credit from ${data.name}`,
            createdBy: undefined,
            createdAt: new Date().toISOString(),
          });
        });
      })
    ).then(() => {
      queryClient.invalidateQueries({ queryKey: ['holidays'] });
      queryClient.invalidateQueries({ queryKey: ['holidayCredits'] });
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      toast({
        title: `Added ${dates.length} holiday${dates.length > 1 ? 's' : ''}`,
        description: `${data.name} from ${startDate.toLocaleDateString()} to ${endDate.toLocaleDateString()}`,
      });
      form.reset();
      setIsDialogOpen(false);
    }).catch((error) => {
      toast({
        title: 'Error',
        description: 'Failed to add holidays',
        variant: 'destructive',
      });
    });
  };

  const handleJsonImport = () => {
    try {
      const parsed = JSON.parse(jsonInput);
      
      if (!Array.isArray(parsed)) {
        toast({
          title: 'Invalid JSON',
          description: 'JSON must be an array of holidays',
          variant: 'destructive',
        });
        return;
      }

      const holidaysToCreate: Holiday[] = [];
      const creditsToCreate: HolidayCredit[] = [];
      
      parsed.forEach((item, index) => {
        if (!item.date || !item.name) {
          throw new Error(`Item ${index + 1} is missing required fields (date, name)`);
        }
        
        const holiday: Holiday = {
          id: `${Date.now()}-${index}`,
          engagementId: form.watch('engagementId') || item.engagementId,
          date: item.date,
          name: item.name,
          isTaken: item.isTaken || false,
          createdAt: new Date().toISOString(),
        };
        
        holidaysToCreate.push(holiday);
        
        if (!holiday.isTaken) {
          creditsToCreate.push({
            id: `${Date.now()}-credit-${index}`,
            engagementId: holiday.engagementId,
            date: holiday.date,
            creditDays: 1,
            note: `Credit from ${holiday.name}`,
            createdBy: undefined,
            createdAt: new Date().toISOString(),
          });
        }
      });

      if (!form.watch('engagementId') && holidaysToCreate.some(h => !h.engagementId)) {
        toast({
          title: 'Engagement required',
          description: 'Please select an engagement or include engagementId in JSON',
          variant: 'destructive',
        });
        return;
      }

      Promise.all([
        ...holidaysToCreate.map(holiday => addHoliday(holiday)),
        ...creditsToCreate.map(credit => addHolidayCredit(credit)),
      ]).then(() => {
        queryClient.invalidateQueries({ queryKey: ['holidays'] });
        queryClient.invalidateQueries({ queryKey: ['holidayCredits'] });
        queryClient.invalidateQueries({ queryKey: ['invoices'] });
        toast({
          title: `Added ${holidaysToCreate.length} holiday${holidaysToCreate.length > 1 ? 's' : ''}`,
          description: `Successfully imported from JSON`,
        });
        setJsonInput('');
        form.reset();
        setIsDialogOpen(false);
      }).catch((error) => {
        toast({
          title: 'Error',
          description: error.message || 'Failed to import holidays',
          variant: 'destructive',
        });
      });
    } catch (error: any) {
      toast({
        title: 'Invalid JSON',
        description: error.message || 'Please check your JSON format',
        variant: 'destructive',
      });
    }
  };

  const handleToggleTaken = (holiday: Holiday) => {
    const newIsTaken = !holiday.isTaken;
    
    updateMutation.mutate(
      { id: holiday.id, updates: { isTaken: newIsTaken } },
      {
        onSuccess: () => {
          if (!newIsTaken) {
            const engagement = engagements.find((e) => e.id === holiday.engagementId);
            if (engagement) {
              addCreditMutation.mutate({
                id: Date.now().toString(),
                engagementId: holiday.engagementId,
                date: holiday.date,
                creditDays: 1,
                note: `Credit from ${holiday.name}`,
                createdBy: undefined,
                createdAt: new Date().toISOString(),
              });
            }
            toast({
              title: 'Holiday saved as credit',
            });
          } else {
            const associatedCredit = holidayCredits.find(
              (credit) =>
                credit.engagementId === holiday.engagementId &&
                credit.date === holiday.date &&
                (credit.note?.includes(holiday.name) || credit.note?.includes(`Credit from ${holiday.name}`))
            );
            if (associatedCredit) {
              deleteCreditMutation.mutate(associatedCredit.id);
            }
            toast({
              title: 'Holiday marked as taken',
            });
          }
        },
      }
    );
  };

  const handleDelete = (id: string) => {
    deleteMutation.mutate(id);
  };

  const groupedHolidays = holidays.reduce((acc, holiday) => {
    const engagement = engagements.find(e => e.id === holiday.engagementId);
    if (!engagement) return acc;
    
    const key = engagement.id;
    if (!acc[key]) {
      acc[key] = { engagement, holidays: [] };
    }
    acc[key].holidays.push(holiday);
    return acc;
  }, {} as Record<string, { engagement: Engagement; holidays: Holiday[] }>);

  if (isLoading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          <p className="text-sm text-muted-foreground">Loading holidays...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-10">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <h1 className="text-4xl font-semibold tracking-tight">Holiday Management</h1>
          <p className="text-muted-foreground text-lg">
            Configure holidays for each engagement
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Add Holiday
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Add Holiday</DialogTitle>
            </DialogHeader>
            <Tabs value={inputMode} onValueChange={(v) => setInputMode(v as 'single' | 'json')} className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="single">Single/Range</TabsTrigger>
                <TabsTrigger value="json">JSON Import</TabsTrigger>
              </TabsList>
              
              <TabsContent value="single" className="space-y-4">
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <FormField
                      control={form.control}
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
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
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
                    control={form.control}
                    name="endDate"
                    rules={{ required: 'End date is required' }}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>End Date</FormLabel>
                        <FormControl>
                          <Input 
                            type="date" 
                            {...field}
                            min={form.watch('startDate') || undefined}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                {form.watch('startDate') && form.watch('endDate') && (
                  <p className="text-xs text-muted-foreground">
                    {(() => {
                      const start = new Date(form.watch('startDate'));
                      const end = new Date(form.watch('endDate'));
                      const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
                      return `This will create ${days} holiday${days > 1 ? 's' : ''}`;
                    })()}
                  </p>
                )}
                <FormField
                  control={form.control}
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
                    <Button type="submit" className="w-full" disabled={addMutation.isPending}>
                      Add Holiday
                    </Button>
                  </form>
                </Form>
              </TabsContent>
              
              <TabsContent value="json" className="space-y-4">
                <Form {...form}>
                  <div className="space-y-4">
                    <FormField
                      control={form.control}
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
                    <div className="space-y-2">
                      <Label>JSON Holidays</Label>
                      <Textarea
                        placeholder={`[\n  { "date": "2024-01-01", "name": "New Year" },\n  { "date": "2024-12-25", "name": "Christmas" }\n]`}
                        value={jsonInput}
                        onChange={(e) => setJsonInput(e.target.value)}
                        className="font-mono text-sm min-h-[200px]"
                      />
                      <p className="text-xs text-muted-foreground">
                        Enter an array of holidays. Each holiday should have: date (YYYY-MM-DD) and name. Optional: isTaken (boolean), engagementId (string).
                      </p>
                      {jsonInput && (() => {
                        try {
                          const parsed = JSON.parse(jsonInput);
                          if (Array.isArray(parsed)) {
                            return (
                              <p className="text-xs text-muted-foreground">
                                Will create {parsed.length} holiday{parsed.length !== 1 ? 's' : ''}
                              </p>
                            );
                          }
                        } catch {}
                        return null;
                      })()}
                    </div>
                    <Button
                      type="button"
                      className="w-full"
                      onClick={handleJsonImport}
                      disabled={!jsonInput || !form.watch('engagementId')}
                    >
                      Import from JSON
                    </Button>
                  </div>
                </Form>
              </TabsContent>
            </Tabs>
          </DialogContent>
        </Dialog>
      </div>

      <div className="space-y-6">
        {Object.entries(groupedHolidays).map(([engId, { engagement, holidays: engHolidays }]) => {
          const developer = developers.find((d) => d.id === engagement.developerId);
          const client = clients.find((c) => c.id === engagement.clientId);

          return (
            <Card key={engId}>
              <CardHeader>
                <CardTitle className="text-lg">
                  {developer?.name} → {client?.name}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Holiday Name</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {engHolidays
                      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                      .map((holiday) => (
                        <TableRow key={holiday.id}>
                          <TableCell>
                            {new Date(holiday.date).toLocaleDateString()}
                          </TableCell>
                          <TableCell>{holiday.name}</TableCell>
                          <TableCell>
                            {holiday.isTaken ? (
                              <Badge variant="secondary">Taken</Badge>
                            ) : (
                              <Badge variant="default" className="bg-green-500">
                                Saved as Credit
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center justify-end gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-8"
                                onClick={() => handleToggleTaken(holiday)}
                              >
                                Toggle Status
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-8 w-8 p-0 hover:bg-destructive/10 hover:text-destructive"
                                onClick={() => handleDelete(holiday.id)}
                                title="Delete holiday"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          );
        })}

        {Object.keys(groupedHolidays).length === 0 && (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              No holidays configured yet. Add your first one!
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

