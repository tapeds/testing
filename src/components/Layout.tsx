"use client";

import { useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useSession } from '@/hooks/useSession';
import {
  LayoutDashboard,
  Calendar,
  FileText,
  Users,
  Building2,
  Briefcase,
  Palmtree,
  LogOut,
} from 'lucide-react';
import { logout } from '@/lib/storage';

const allNavigation = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard, adminOnly: false },
  { name: 'Developers', href: '/developers', icon: Users, adminOnly: true },
  { name: 'Clients', href: '/clients', icon: Building2, adminOnly: true },
  { name: 'Engagements', href: '/engagements', icon: Briefcase, adminOnly: true },
  { name: 'Invoices', href: '/invoices', icon: FileText, adminOnly: false },
  { name: 'Day Off', href: '/dayoff', icon: Calendar, adminOnly: false },
  { name: 'Holidays', href: '/holidays', icon: Palmtree, adminOnly: true },
];

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { data: session, isLoading } = useSession();

  const handleLogout = async () => {
    try {
      await logout();
      window.location.href = '/login';
    } catch {
      window.location.href = '/login';
    }
  };

  useEffect(() => {
    if (!isLoading && !session && (pathname !== '/login' && pathname !== '/callback')) {
      router.push('/login');
    }
  }, [session, isLoading, pathname, router]);

  // Show loading state while checking session
  if (isLoading && pathname !== '/login' && pathname !== '/callback') {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="text-center">
          <div className="text-muted-foreground">Loading...</div>
        </div>
      </div>
    );
  }

  // Don't render layout for login/callback pages
  if (pathname === '/login' || pathname === '/callback') {
    return children;
  }

  if (!session) {
    return null;
  }

  const navigation = allNavigation.filter((item) => {
    if (item.adminOnly && session?.role !== 'admin') {
      return false;
    }
    return true;
  });

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <div className="w-64 border-r border-border/50 bg-sidebar flex flex-col">
        <div className="p-6 border-b border-sidebar-border/50">
          <h1 className="text-lg font-semibold tracking-tight text-sidebar-primary">HR Mini-App</h1>
          {session && (
            <p className="text-xs text-sidebar-foreground/70 mt-1">
              {session.email} ({session.role})
            </p>
          )}
        </div>
        
        <nav className="flex-1 p-4 space-y-0.5">
          {navigation.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200',
                  isActive
                    ? 'bg-sidebar-accent text-sidebar-accent-foreground shadow-sm'
                    : 'text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground'
                )}
              >
                <Icon className="w-4 h-4" />
                {item.name}
              </Link>
            );
          })}
        </nav>
        <div className="px-4 pb-6 mt-auto">
          <button
            onClick={() => handleLogout()}
            className={cn(
              'flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground'
            )}
            title="Logout"
            type="button"
          >
            <LogOut className="w-4 h-4" />
            Logout
          </button>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 overflow-auto bg-background">
        <div className="p-8 max-w-7xl mx-auto">{children}</div>
      </div>
    </div>
  );
}