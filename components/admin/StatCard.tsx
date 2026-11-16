import type { LucideIcon } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

export interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  badge?: string;
  trend?: {
    value: string;
    isPositive: boolean;
  };
  className?: string;
}

/**
 * Equal-height stat tile. The card fills its grid cell (h-full) and the value block is
 * pinned to the bottom (mt-auto), so values line up across a row even when one title
 * wraps onto two lines. The Card's own py-6/gap-6 is zeroed so padding isn't doubled.
 */
export function StatCard({ title, value, subtitle, icon: Icon, badge, trend, className }: StatCardProps) {
  return (
    <Card className={cn('h-full gap-0 py-0 shadow-sm transition-shadow hover:shadow-md', className)}>
      <CardContent className="flex h-full flex-col p-5">
        <div className="flex items-start justify-between gap-3">
          <p className="text-sm font-medium leading-snug text-slate-600 dark:text-muted-foreground">{title}</p>
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-teal-50 text-teal-700 ring-1 ring-teal-100 dark:bg-teal-500/10 dark:text-teal-300 dark:ring-teal-500/20">
            <Icon className="h-5 w-5" aria-hidden="true" />
          </div>
        </div>
        <div className="mt-auto pt-4">
          <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
            <span className="font-serif text-3xl font-bold tracking-tight text-slate-900 tabular-nums dark:text-foreground">
              {value}
            </span>
            {badge && (
              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-600 dark:bg-muted dark:text-muted-foreground">
                {badge}
              </span>
            )}
            {trend && (
              <span className={cn('text-xs font-semibold', trend.isPositive ? 'text-emerald-600' : 'text-rose-600')}>
                {trend.value}
              </span>
            )}
          </div>
          {subtitle && <p className="mt-1 truncate text-xs text-slate-500 dark:text-muted-foreground">{subtitle}</p>}
        </div>
      </CardContent>
    </Card>
  );
}
