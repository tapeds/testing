"use client";

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getEngagements,
  addEngagement,
  updateEngagement,
  deleteEngagement,
  getDevelopers,
  getClients,
} from '@/lib/storage';
import type { Engagement } from '@/types';
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Plus, Pencil, Trash2, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';

type EngagementFormData = {
  developerId: string;
  clientId: string;
  startDate: string;
  endDate?: string;
  currency: Engagement['currency'];
  pricePerPeriod: number;
  salaryPerPeriod: number;
  clientDayoffRate: number;
  devDayoffRate: number;
  periodUnit: Engagement['periodUnit'];
  isActive: boolean;
};

export default function Engagements() {
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [deletingEngId, setDeletingEngId] = useState<string | null>(null);
  const [editingEng, setEditingEng] = useState<Engagement | null>(null);
  const { toast } = useToast();

  const form = useForm<EngagementFormData>({
    defaultValues: {
      developerId: '',
      clientId: '',
      startDate: '',
      endDate: undefined,
      currency: 'USD',
      pricePerPeriod: 0,
      salaryPerPeriod: 0,
      clientDayoffRate: 0,
      devDayoffRate: 0,
      periodUnit: 'month',
      isActive: true,
    },
    mode: 'onChange',
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

  const isLoading = isLoadingEngagements || isLoadingDevelopers || isLoadingClients;

  const addMutation = useMutation({
    mutationFn: async (engagement: Engagement) => {
      await addEngagement(engagement);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['engagements'] });
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      toast({ title: 'Engagement created' });
      form.reset();
      setIsDialogOpen(false);
      setEditingEng(null);
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<Engagement> }) => {
      await updateEngagement(id, updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['engagements'] });
      queryClient.invalidateQueries({ queryKey: ['dayOffRequests'] });
      queryClient.invalidateQueries({ queryKey: ['holidays'] });
      queryClient.invalidateQueries({ queryKey: ['holidayCredits'] });
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      toast({ title: 'Engagement updated' });
      form.reset();
      setIsDialogOpen(false);
      setEditingEng(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await deleteEngagement(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['engagements'] });
      queryClient.invalidateQueries({ queryKey: ['dayOffRequests'] });
      queryClient.invalidateQueries({ queryKey: ['holidays'] });
      queryClient.invalidateQueries({ queryKey: ['holidayCredits'] });
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      toast({ title: 'Engagement deleted' });
    },
  });

  const onSubmit = (data: EngagementFormData) => {
    const engagementData: Partial<Engagement> = {
      developerId: data.developerId,
      clientId: data.clientId,
      startDate: data.startDate,
      endDate: data.endDate || undefined,
      currency: data.currency,
      pricePerPeriod: data.pricePerPeriod,
      salaryPerPeriod: data.salaryPerPeriod,
      clientDayoffRate: data.clientDayoffRate,
      devDayoffRate: data.devDayoffRate,
      periodUnit: data.periodUnit,
      isActive: data.isActive,
    };

    if (editingEng) {
      updateMutation.mutate({ id: editingEng.id, updates: engagementData });
    } else {
      const newEng: Engagement = {
        ...engagementData,
        id: Date.now().toString(),
        createdAt: new Date().toISOString(),
      } as Engagement;
      addMutation.mutate(newEng);
    }
  };

  const handleDelete = (id: string) => {
    setDeletingEngId(id);
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (deletingEngId) {
      deleteMutation.mutate(deletingEngId);
      setIsDeleteDialogOpen(false);
      setDeletingEngId(null);
    }
  };

  const openEditDialog = (eng: Engagement) => {
    setEditingEng(eng);
    form.reset({
      developerId: eng.developerId,
      clientId: eng.clientId,
      startDate: eng.startDate,
      endDate: eng.endDate,
      currency: eng.currency,
      pricePerPeriod: eng.pricePerPeriod,
      salaryPerPeriod: eng.salaryPerPeriod,
      clientDayoffRate: eng.clientDayoffRate,
      devDayoffRate: eng.devDayoffRate,
      periodUnit: eng.periodUnit,
      isActive: eng.isActive,
    });
    setIsDialogOpen(true);
  };

  const openNewDialog = () => {
    setEditingEng(null);
    form.reset({
      developerId: '',
      clientId: '',
      startDate: '',
      endDate: undefined,
      currency: 'USD',
      pricePerPeriod: 0,
      salaryPerPeriod: 0,
      clientDayoffRate: 0,
      devDayoffRate: 0,
      periodUnit: 'month',
      isActive: true,
    });
    setIsDialogOpen(true);
  };

  return (
    <div className="space-y-10">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <h1 className="text-4xl font-semibold tracking-tight">Engagements</h1>
          <p className="text-muted-foreground text-lg">
            Manage developer-client engagements and rates
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={openNewDialog}>
              <Plus className="w-4 h-4 mr-2" />
              New Engagement
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingEng ? 'Edit Engagement' : 'Create Engagement'}
              </DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="developerId"
                    rules={{ required: 'Developer is required' }}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Developer</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select developer" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {developers.map((dev) => (
                              <SelectItem key={dev.id} value={dev.id}>
                                {dev.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="clientId"
                    rules={{ required: 'Client is required' }}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Client</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select client" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {clients.map((client) => (
                              <SelectItem key={client.id} value={client.id}>
                                {client.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

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
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>End Date (optional)</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} value={field.value || ''} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="pricePerPeriod"
                    rules={{ required: 'Price per period is required', min: { value: 0, message: 'Must be positive' } }}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Price per Period</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.01"
                            {...field}
                            value={field.value ?? ''}
                            onChange={(e) => {
                              const value = e.target.value;
                              field.onChange(value === '' ? '' : parseFloat(value) || 0);
                            }}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="salaryPerPeriod"
                    rules={{ required: 'Salary per period is required', min: { value: 0, message: 'Must be positive' } }}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Salary per Period</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.01"
                            {...field}
                            value={field.value ?? ''}
                            onChange={(e) => {
                              const value = e.target.value;
                              field.onChange(value === '' ? '' : parseFloat(value) || 0);
                            }}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="clientDayoffRate"
                    rules={{ required: 'Client day-off rate is required', min: { value: 0, message: 'Must be positive' } }}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Client Day-off Rate</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.01"
                            {...field}
                            value={field.value ?? ''}
                            onChange={(e) => {
                              const value = e.target.value;
                              field.onChange(value === '' ? '' : parseFloat(value) || 0);
                            }}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="devDayoffRate"
                    rules={{ required: 'Dev day-off rate is required', min: { value: 0, message: 'Must be positive' } }}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Dev Day-off Rate</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.01"
                            {...field}
                            value={field.value ?? ''}
                            onChange={(e) => {
                              const value = e.target.value;
                              field.onChange(value === '' ? '' : parseFloat(value) || 0);
                            }}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="periodUnit"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Period Unit</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="month">Month</SelectItem>
                            <SelectItem value="week">Week</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="currency"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Currency</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="USD">USD</SelectItem>
                            <SelectItem value="EUR">EUR</SelectItem>
                            <SelectItem value="IDR">IDR</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="isActive"
                  render={({ field }) => (
                    <FormItem className="flex items-center space-x-2 space-y-0">
                      <FormControl>
                        <Switch checked={field.value} onCheckedChange={field.onChange} />
                      </FormControl>
                      <FormLabel>Active</FormLabel>
                    </FormItem>
                  )}
                />

                <Button type="submit" className="w-full" disabled={addMutation.isPending || updateMutation.isPending}>
                  {editingEng ? 'Update' : 'Create'} Engagement
                </Button>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="flex h-[60vh] items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            <p className="text-sm text-muted-foreground">Loading engagements...</p>
          </div>
        </div>
      ) : engagements.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            No engagements found.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {engagements.map((eng) => {
            const dev = developers.find((d) => d.id === eng.developerId);
            const client = clients.find((c) => c.id === eng.clientId);

            return (
              <Card key={eng.id}>
                <CardHeader className="group">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg">
                        {dev?.name} → {client?.name}
                      </CardTitle>
                      <p className="text-sm text-muted-foreground mt-1">
                        {new Date(eng.startDate).toLocaleDateString()} -{' '}
                        {eng.endDate
                          ? new Date(eng.endDate).toLocaleDateString()
                          : 'Ongoing'}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={eng.isActive ? 'default' : 'secondary'}>
                        {eng.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-8 w-8 p-0 hover:bg-muted"
                          onClick={() => openEditDialog(eng)}
                          title="Edit engagement"
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-8 w-8 p-0 hover:bg-destructive/10 hover:text-destructive"
                          onClick={() => handleDelete(eng.id)}
                          title="Delete engagement"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Price:</span> $
                      {eng.pricePerPeriod}/{eng.periodUnit}
                    </div>
                    <div>
                      <span className="text-muted-foreground">Salary:</span> $
                      {eng.salaryPerPeriod}/{eng.periodUnit}
                    </div>
                    <div>
                      <span className="text-muted-foreground">Client day-off rate:</span> $
                      {eng.clientDayoffRate}
                    </div>
                    <div>
                      <span className="text-muted-foreground">Dev day-off rate:</span> $
                      {eng.devDayoffRate}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Engagement</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this engagement? This action cannot be undone and will also delete related day-off requests and holidays.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

