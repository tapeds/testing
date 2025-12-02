"use client";

import { useQuery } from '@tanstack/react-query';
import {
  getDevelopers,
  getClients,
  getEngagements,
  getDayOffRequests,
  initializeDemoData,
} from '@/lib/storage';
import { useSession } from '@/hooks/useSession';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Building2, Briefcase, Calendar, FileText, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function Dashboard() {
  const { data: session } = useSession();
  const isAdmin = session?.role === 'admin';

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

  const { data: engagements = [], isLoading: isLoadingEngagements } = useQuery({
    queryKey: ['engagements'],
    queryFn: getEngagements,
    enabled: isAdmin,
  });

  const { data: dayOffRequests = [], isLoading: isLoadingDayOffRequests } = useQuery({
    queryKey: ['dayOffRequests'],
    queryFn: getDayOffRequests,
  });

  const isLoading = (isAdmin && (isLoadingDevelopers || isLoadingClients || isLoadingEngagements)) || isLoadingDayOffRequests;

  useQuery({
    queryKey: ['initializeDemoData'],
    queryFn: async () => {
      initializeDemoData();
      return true;
    },
    enabled: isAdmin,
    refetchOnMount: true,
    refetchOnWindowFocus: false,
    retry: false,
  });

  const stats = isAdmin
    ? {
        developers: developers.length,
        clients: clients.length,
        activeEngagements: engagements.filter((e) => e.isActive).length,
        pendingRequests: dayOffRequests.filter((r) => r.status === 'submitted').length,
      }
    : {
        myRequests: dayOffRequests.length,
        pendingRequests: dayOffRequests.filter((r) => r.status === 'submitted').length,
      };

  const statCards = isAdmin
    ? [
        {
          title: 'Developers',
          value: stats.developers,
          icon: Users,
          color: 'text-primary',
        },
        {
          title: 'Clients',
          value: stats.clients,
          icon: Building2,
          color: 'text-primary',
        },
        {
          title: 'Active Engagements',
          value: stats.activeEngagements,
          icon: Briefcase,
          color: 'text-primary',
        },
        {
          title: 'Pending Requests',
          value: stats.pendingRequests,
          icon: Calendar,
          color: 'text-destructive',
        },
      ]
    : [
        {
          title: 'My Day Off Requests',
          value: stats.myRequests,
          icon: Calendar,
          color: 'text-primary',
        },
        {
          title: 'Pending Requests',
          value: stats.pendingRequests,
          icon: FileText,
          color: 'text-destructive',
        },
      ];

  if (isLoading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          <p className="text-sm text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-10">
      <div className="space-y-2">
        <h1 className="text-4xl font-semibold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground text-lg">
          Overview of your HR operations
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.title} className="border-border/50 shadow-sm hover:shadow-md transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {stat.title}
                </CardTitle>
                <Icon className={cn('w-5 h-5', stat.color)} />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-semibold tracking-tight">{stat.value}</div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

