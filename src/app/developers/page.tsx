"use client";

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getDevelopers, addDeveloper, updateDeveloper, deleteDeveloper } from '@/lib/storage';
import type { Developer } from '@/types';
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
import { Plus, Pencil, Trash2, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

type DeveloperFormData = {
  name: string;
  email?: string;
};

export default function Developers() {
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [deletingDevId, setDeletingDevId] = useState<string | null>(null);
  const [editingDev, setEditingDev] = useState<Developer | null>(null);
  const { toast } = useToast();

  const form = useForm<DeveloperFormData>({
    defaultValues: {
      name: '',
      email: '',
    },
    mode: 'onChange',
  });

  const { data: developers = [], isLoading } = useQuery({
    queryKey: ['developers'],
    queryFn: getDevelopers,
  });

  const addMutation = useMutation({
    mutationFn: async (dev: Developer) => {
      await addDeveloper(dev);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['developers'] });
      queryClient.invalidateQueries({ queryKey: ['engagements'] });
      toast({ title: 'Developer added' });
      form.reset();
      setIsDialogOpen(false);
      setEditingDev(null);
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<Developer> }) => {
      await updateDeveloper(id, updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['developers'] });
      queryClient.invalidateQueries({ queryKey: ['engagements'] });
      toast({ title: 'Developer updated' });
      form.reset();
      setIsDialogOpen(false);
      setEditingDev(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await deleteDeveloper(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['developers'] });
      queryClient.invalidateQueries({ queryKey: ['engagements'] });
      toast({ title: 'Developer deleted' });
    },
  });

  const onSubmit = (data: DeveloperFormData) => {
    if (editingDev) {
      const updates: any = { name: data.name };
      if (data.email && data.email.trim() !== '') {
        updates.email = data.email.trim();
      }
      updateMutation.mutate({ id: editingDev.id, updates });
    } else {
      const newDev: any = {
        id: Date.now().toString(),
        name: data.name,
        createdAt: new Date().toISOString(),
      };
      // Include email if provided
      if (data.email && data.email.trim() !== '') {
        newDev.email = data.email.trim();
      }
      addMutation.mutate(newDev);
    }
  };

  const handleDelete = (id: string) => {
    setDeletingDevId(id);
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (deletingDevId) {
      deleteMutation.mutate(deletingDevId);
      setIsDeleteDialogOpen(false);
      setDeletingDevId(null);
    }
  };

  const openEditDialog = (dev: Developer) => {
    setEditingDev(dev);
    form.reset({ name: dev.name, email: '' });
    setIsDialogOpen(true);
  };

  const openNewDialog = () => {
    setEditingDev(null);
    form.reset({ name: '', email: '' });
    setIsDialogOpen(true);
  };

  return (
    <div className="space-y-10">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <h1 className="text-4xl font-semibold tracking-tight">Developers</h1>
          <p className="text-muted-foreground text-lg">Manage your development team</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={openNewDialog}>
              <Plus className="w-4 h-4 mr-2" />
              Add Developer
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingDev ? 'Edit Developer' : 'Add Developer'}
              </DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  rules={{ required: 'Name is required' }}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Name</FormLabel>
                      <FormControl>
                        <Input placeholder="John Doe" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email (optional)</FormLabel>
                      <FormControl>
                        <Input
                          type="email"
                          placeholder="john.doe@example.com"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                      <p className="text-xs text-muted-foreground">
                        If provided, will link this developer to the user account with this email
                      </p>
                    </FormItem>
                  )}
                />
                <Button type="submit" className="w-full" disabled={addMutation.isPending || updateMutation.isPending}>
                  {editingDev ? 'Update' : 'Add'} Developer
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
            <p className="text-sm text-muted-foreground">Loading developers...</p>
          </div>
        </div>
      ) : developers.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            No developers found.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {developers.map((dev) => (
            <Card key={dev.id} className="group hover:shadow-md transition-shadow">
              <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-4">
                <CardTitle className="text-lg">{dev.name}</CardTitle>
                <div className="flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-8 w-8 p-0 hover:bg-muted"
                    onClick={() => openEditDialog(dev)}
                    title="Edit developer"
                  >
                    <Pencil className="w-4 h-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-8 w-8 p-0 hover:bg-destructive/10 hover:text-destructive"
                    onClick={() => handleDelete(dev.id)}
                    title="Delete developer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </CardHeader>
            </Card>
          ))}
        </div>
      )}

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Developer</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this developer? This action cannot be undone and may affect related engagements.
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

