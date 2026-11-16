'use client';

import { useState, useMemo, type ReactNode } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { Menu, ArrowLeft, LogOut, AlertCircle, ShieldCheck, Shield, Globe } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
} from '@/components/ui/dropdown-menu';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { useAuth } from '@/contexts/auth-context';
import { useAdminMe } from '@/lib/admin/hooks';
import { AdminThemeToggle } from './AdminThemeToggle';
import { RoleBadge } from './StatusBadge';
import { ADMIN_NAV_ITEMS, ADMIN_NAV_SECTIONS } from '@/lib/admin/modules';
import { IS_ADMIN_MOCK } from '@/lib/admin/api/client';
import { demoAdapter } from '@/lib/admin/api/mock/adapter';
import type { Role } from '@/lib/admin/types';
import { cn } from '@/lib/utils';

interface AdminShellProps {
  children: ReactNode;
  initialRole?: Role;
  initialName?: string;
  initialEmail?: string;
}

const CRUMB_LABELS: Record<string, string> = {
  admin: 'Admin',
  dashboard: 'Overview',
  quizzes: 'Quiz & Curriculum',
  chapters: 'Chapters',
  questions: 'Questions',
  reactions: 'Reactions',
  molecules: 'Molecules',
  students: 'Students',
  leaderboard: 'Leaderboard',
  analytics: 'Analytics',
  users: 'Users & Access',
  'audit-logs': 'Audit Logs',
  new: 'Create New',
};

function initialsOf(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return 'A';
  return ((parts[0]?.[0] ?? '') + (parts.length > 1 ? parts[parts.length - 1]?.[0] ?? '' : '')).toUpperCase();
}

export function AdminShell({
  children,
  initialRole = 'admin',
  initialName,
  initialEmail,
}: AdminShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();
  const { data: adminMe } = useAdminMe();
  const activeRole = adminMe?.role || initialRole || 'admin';
  const activeName = adminMe?.name || initialName || user?.name || 'Administrator';
  const activeEmail = adminMe?.email || initialEmail || user?.email || '';
  const [mobileOpen, setMobileOpen] = useState(false);
  const [demoRole, setDemoRole] = useState<Role>(initialRole);

  const isAdmin = demoRole === 'admin';

  const handleRoleChange = (newRole: Role) => {
    setDemoRole(newRole);
    if (IS_ADMIN_MOCK) {
      demoAdapter.setRole(newRole);
      router.refresh();
    }
  };

  const breadcrumbSegments = useMemo(() => {
    const parts = pathname.split('/').filter(Boolean);
    let accumulatedPath = '';
    return parts.map((part, i) => {
      accumulatedPath += `/${part}`;
      const label = CRUMB_LABELS[part] ?? (/^\d+$/.test(part) ? `#${part}` : part);
      return { path: accumulatedPath, label, isLast: i === parts.length - 1 };
    });
  }, [pathname]);

  const visibleItems = ADMIN_NAV_ITEMS.filter((item) => !item.adminOnly || isAdmin);
  const close = () => setMobileOpen(false);

  const navContent = (
    <div className="flex h-full flex-col">
      {/* Brand */}
      <div className="flex h-16 shrink-0 items-center gap-2.5 border-b border-sidebar-border px-5">
        <Link
          href="/admin/dashboard"
          onClick={close}
          className="flex items-center gap-2.5 rounded-lg transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <Image
            src="/ChemCurious_logo_HD.png"
            alt="ChemCurious"
            width={140}
            height={38}
            priority
            className="h-8 w-auto object-contain"
          />
        </Link>
        <span className="rounded-full bg-teal-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-teal-700 ring-1 ring-teal-200 dark:bg-teal-500/10 dark:text-teal-300 dark:ring-teal-500/30">
          Portal
        </span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-5 overflow-y-auto px-3 py-5" aria-label="Admin navigation">
        {ADMIN_NAV_SECTIONS.map((section) => {
          const items = visibleItems.filter((i) => i.section === section);
          if (items.length === 0) return null;
          return (
            <div key={section}>
              {section !== 'Overview' && (
                <p className="mb-1.5 px-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                  {section}
                </p>
              )}
              <div className="space-y-0.5">
                {items.map((item) => {
                  const isActive = item.exact
                    ? pathname === item.url
                    : pathname === item.url || pathname.startsWith(`${item.url}/`);
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.url}
                      href={item.url}
                      onClick={close}
                      aria-current={isActive ? 'page' : undefined}
                      className={cn(
                        'flex h-10 items-center gap-3 rounded-xl border px-3 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                        isActive
                          ? 'border-teal-200 bg-teal-50 text-teal-700 dark:border-teal-500/30 dark:bg-teal-500/10 dark:text-teal-300'
                          : 'border-transparent text-slate-600 hover:bg-slate-50 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-white/5 dark:hover:text-white'
                      )}
                    >
                      <Icon
                        className={cn(
                          'h-4 w-4 shrink-0',
                          isActive ? 'text-teal-600 dark:text-teal-300' : 'text-slate-400 dark:text-slate-500'
                        )}
                        aria-hidden="true"
                      />
                      <span className="truncate">{item.title}</span>
                    </Link>
                  );
                })}
              </div>
            </div>
          );
        })}
      </nav>

      {/* Back to the public site */}
      <div className="shrink-0 border-t border-sidebar-border p-3">
        <Link
          href="/"
          onClick={close}
          className="group flex h-10 items-center gap-2 rounded-xl px-3 text-sm font-medium text-slate-600 transition-colors hover:bg-teal-50 hover:text-teal-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring dark:text-slate-300 dark:hover:bg-teal-500/10 dark:hover:text-teal-300"
        >
          <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" aria-hidden="true" />
          Back to ChemCurious
        </Link>
      </div>
    </div>
  );

  return (
    <div className="cc-portal flex min-h-screen bg-slate-50 text-foreground dark:bg-background">
      {/* Desktop sidebar: sticky, so the nav and the back link never scroll away */}
      <aside className="sticky top-0 hidden h-dvh w-64 shrink-0 flex-col border-r border-sidebar-border bg-sidebar lg:flex">
        {navContent}
      </aside>

      {/* Mobile drawer */}
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent side="left" className="w-72 border-sidebar-border bg-sidebar p-0">
          <SheetHeader className="sr-only">
            <SheetTitle>Admin navigation</SheetTitle>
          </SheetHeader>
          {navContent}
        </SheetContent>
      </Sheet>

      <div className="flex min-w-0 flex-1 flex-col">
        {IS_ADMIN_MOCK && (
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-amber-200 bg-amber-50 px-4 py-2 text-xs font-medium text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-300">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" />
              <span>
                <strong>Demo mode</strong>: changes are kept in memory and are not saved to the database.
              </span>
            </div>
            <div className="ml-auto flex items-center gap-2">
              <span className="text-[11px] opacity-80">Testing role:</span>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="h-7 px-2 text-xs">
                    {demoRole === 'admin' ? (
                      <span className="flex items-center gap-1 font-semibold text-teal-700">
                        <ShieldCheck className="h-3 w-3" /> Admin
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 font-semibold text-slate-700">
                        <Shield className="h-3 w-3" /> Staff
                      </span>
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="text-xs">
                  <DropdownMenuLabel>Switch demo persona</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuRadioGroup value={demoRole} onValueChange={(val) => handleRoleChange(val as Role)}>
                    <DropdownMenuRadioItem value="admin">Administrator (all access)</DropdownMenuRadioItem>
                    <DropdownMenuRadioItem value="staff">Staff member (content only)</DropdownMenuRadioItem>
                  </DropdownMenuRadioGroup>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        )}

        {/* Top bar */}
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-3 border-b border-slate-200/80 bg-white/85 px-4 backdrop-blur-md sm:px-6 lg:px-8 dark:border-border dark:bg-card/85">
          <div className="flex min-w-0 items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="h-10 w-10 shrink-0 text-slate-600 lg:hidden"
              onClick={() => setMobileOpen(true)}
              aria-label="Open navigation"
            >
              <Menu className="h-5 w-5" />
            </Button>
            {/* Brand on small screens, where the sidebar is hidden */}
            <Link href="/admin/dashboard" className="shrink-0 sm:hidden" aria-label="Portal overview">
              <Image src="/ChemCurious_logo_HD.png" alt="" width={110} height={30} className="h-7 w-auto object-contain" />
            </Link>
            <Breadcrumb className="hidden min-w-0 sm:block">
              <BreadcrumbList className="flex-nowrap">
                {breadcrumbSegments.map((crumb) => (
                  <span key={crumb.path} className="inline-flex min-w-0 items-center gap-1.5">
                    <BreadcrumbItem className="min-w-0">
                      {crumb.isLast ? (
                        <BreadcrumbPage className="truncate text-sm font-semibold text-slate-900 dark:text-foreground">
                          {crumb.label}
                        </BreadcrumbPage>
                      ) : (
                        <BreadcrumbLink
                          href={crumb.path}
                          className="text-sm text-slate-500 transition-colors hover:text-teal-700"
                        >
                          {crumb.label}
                        </BreadcrumbLink>
                      )}
                    </BreadcrumbItem>
                    {!crumb.isLast && <BreadcrumbSeparator />}
                  </span>
                ))}
              </BreadcrumbList>
            </Breadcrumb>
          </div>

          <div className="flex shrink-0 items-center gap-1.5 sm:gap-3">
            <span className="hidden sm:inline-flex">
              <RoleBadge role={IS_ADMIN_MOCK ? demoRole : activeRole} />
            </span>
            <AdminThemeToggle />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  className="flex h-10 items-center gap-2 rounded-full border border-slate-200/80 bg-white py-1 pl-1 pr-1 text-sm font-medium text-slate-700 shadow-sm transition-colors hover:border-teal-200 hover:bg-teal-50/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring md:pr-3 dark:border-border dark:bg-card dark:text-foreground"
                  aria-label="Account menu"
                >
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">
                    {initialsOf(activeName)}
                  </span>
                  <span className="hidden max-w-[10rem] truncate md:inline">{activeName}</span>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-60">
                <DropdownMenuLabel className="font-normal">
                  <p className="truncate text-sm font-semibold">{activeName}</p>
                  <p className="truncate text-xs text-muted-foreground">{activeEmail}</p>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/" className="cursor-pointer">
                    <Globe className="mr-2 h-4 w-4" />
                    Back to ChemCurious
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={async () => {
                    await logout();
                    window.location.href = '/auth?portal=admin';
                  }}
                  className="cursor-pointer text-destructive focus:text-destructive"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">{children}</main>
      </div>
    </div>
  );
}
