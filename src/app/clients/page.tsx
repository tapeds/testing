"use client";

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getClients, addClient, updateClient, deleteClient } from '@/lib/storage';
import type { Client } from '@/types';
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

type ClientFormData = {
  name: string;
};

export default function Clients() {
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [deletingClientId, setDeletingClientId] = useState<string | null>(null);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const { toast } = useToast();

  const form = useForm<ClientFormData>({
    defaultValues: {
      name: '',
    },
    mode: 'onChange',
  });

  const { data: clients = [], isLoading } = useQuery({
    queryKey: ['clients'],
    queryFn: getClients,
  });

  const addMutation = useMutation({
    mutationFn: async (client: Client) => {
      await addClient(client);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      queryClient.invalidateQueries({ queryKey: ['engagements'] });
      toast({ title: 'Client added' });
      form.reset();
      setIsDialogOpen(false);
      setEditingClient(null);
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<Client> }) => {
      await updateClient(id, updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      queryClient.invalidateQueries({ queryKey: ['engagements'] });
      toast({ title: 'Client updated' });
      form.reset();
      setIsDialogOpen(false);
      setEditingClient(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await deleteClient(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      queryClient.invalidateQueries({ queryKey: ['engagements'] });
      toast({ title: 'Client deleted' });
    },
  });

  const onSubmit = (data: ClientFormData) => {
    if (editingClient) {
      updateMutation.mutate({ id: editingClient.id, updates: { name: data.name } });
    } else {
      const newClient: Client = {
        id: Date.now().toString(),
        name: data.name,
        createdAt: new Date().toISOString(),
      };
      addMutation.mutate(newClient);
    }
  };

  const handleDelete = (id: string) => {
    setDeletingClientId(id);
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (deletingClientId) {
      deleteMutation.mutate(deletingClientId);
      setIsDeleteDialogOpen(false);
      setDeletingClientId(null);
    }
  };

  const openEditDialog = (client: Client) => {
    setEditingClient(client);
    form.reset({ name: client.name });
    setIsDialogOpen(true);
  };

  const openNewDialog = () => {
    setEditingClient(null);
    form.reset({ name: '' });
    setIsDialogOpen(true);
  };

  return (
    <div className="space-y-10">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <h1 className="text-4xl font-semibold tracking-tight">Clients</h1>
          <p className="text-muted-foreground text-lg">Manage your client organizations</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={openNewDialog}>
              <Plus className="w-4 h-4 mr-2" />
              Add Client
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingClient ? 'Edit Client' : 'Add Client'}</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  rules={{ required: 'Client name is required' }}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Client Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Acme Corp" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" className="w-full" disabled={addMutation.isPending || updateMutation.isPending}>
                  {editingClient ? 'Update' : 'Add'} Client
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
            <p className="text-sm text-muted-foreground">Loading clients...</p>
          </div>
        </div>
      ) : clients.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            No clients found.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {clients.map((client) => (
            <Card key={client.id} className="group hover:shadow-md transition-shadow">
              <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-4">
                <CardTitle className="text-lg">{client.name}</CardTitle>
                <div className="flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-8 w-8 p-0 hover:bg-muted"
                    onClick={() => openEditDialog(client)}
                    title="Edit client"
                  >
                    <Pencil className="w-4 h-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-8 w-8 p-0 hover:bg-destructive/10 hover:text-destructive"
                    onClick={() => handleDelete(client.id)}
                    title="Delete client"
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
            <AlertDialogTitle>Delete Client</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this client? This action cannot be undone and may affect related engagements.
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

