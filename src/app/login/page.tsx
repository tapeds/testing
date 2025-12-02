"use client";

import { useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { useMutation } from '@tanstack/react-query';
import { useSession } from '@/hooks/useSession';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Mail, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import axios from 'axios';

type LoginFormData = {
  email: string;
};

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const error = searchParams.get('error');
  const { data: session, isLoading } = useSession();

  useEffect(() => {
    if (!isLoading && session) {
      router.push('/');
    }
  }, [session, isLoading, router]);

  const form = useForm<LoginFormData>({
    defaultValues: {
      email: '',
    },
    mode: 'onChange',
  });

  const mutation = useMutation({
    mutationFn: async (email: string) => {
      const response = await axios.post('/api/auth/login', {
        email: email,
      });

      return response.data;
    },
    onError: () => {
      toast.error('An error occurred while logging in');
    },
  });

  const onSubmit = (data: LoginFormData) => {
    if(data.email.trim() === '') {
      toast.error('Please enter your email address');
      return;
    }

    mutation.mutate(data.email);
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-center">
          <div className="text-muted-foreground">Loading...</div>
        </div>
      </div>
    );
  }

  if (session) {
    return null;
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md border-border/50 shadow-lg">
        <CardHeader className="space-y-1 text-center">
          <CardTitle className="text-2xl font-semibold tracking-tight">
            Sign in
          </CardTitle>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="mb-4 rounded-lg border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
              {decodeURIComponent(error)}
            </div>
          )}
          
          {mutation.isSuccess ? (
            <div className="space-y-4 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                <Mail className="h-6 w-6 text-primary" />
              </div>
              <div className="space-y-2">
                <h3 className="text-lg font-semibold">Check your email</h3>
                <p className="text-sm text-muted-foreground">
                  We&apos;ve sent a magic link to <strong>{form.getValues('email')}</strong>
                </p>
                <p className="text-sm text-muted-foreground">
                  Click the link in the email to sign in. The link will expire in 1 hour.
                </p>
              </div>
              <Button
                variant="outline"
                onClick={() => {
                  mutation.reset();
                  form.reset();
                }}
                className="w-full"
              >
                Send another link
              </Button>
            </div>
          ) : (
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email address</FormLabel>
                      <FormControl>
                        <Input
                          type="email"
                          placeholder="you@example.com"
                          disabled={mutation.isPending}
                          autoFocus
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button
                  type="submit"
                  className="w-full"
                  disabled={mutation.isPending}
                >
                  {mutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Loading...
                    </>
                  ) : (
                    <>
                      Login
                    </>
                  )}
                </Button>
              </form>
            </Form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
