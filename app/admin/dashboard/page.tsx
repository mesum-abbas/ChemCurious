'use client';

import Link from 'next/link';
import {
  Atom,
  FlaskConical,
  ClipboardList,
  GraduationCap,
  TrendingUp,
  Plus,
  Trophy,
  History,
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PageHeader } from '@/components/admin/PageHeader';
import { StatCard } from '@/components/admin/StatCard';
import { AttemptsChart } from '@/components/admin/charts/AttemptsChart';
import { ErrorState } from '@/components/admin/ErrorState';
import { Skeleton } from '@/components/ui/skeleton';
import { useDashboardStats } from '@/lib/admin/hooks';

export default function AdminDashboardPage() {
  const { data: stats, isLoading, error, refetch } = useDashboardStats();

  if (error) {
    return <ErrorState error={error} onRetry={() => refetch()} />;
  }

  return (
    <div className="space-y-8">
      {/* Page Title & Quick Actions */}
      <PageHeader
        title="Admin Portal Overview"
        description="Monitor system metrics, content publication state, student quiz engagement, and curriculum activity."
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Button asChild size="sm" variant="outline" className="gap-1.5">
              <Link href="/admin/quizzes/questions/new">
                <Plus className="h-4 w-4" /> Add Question
              </Link>
            </Button>
            <Button asChild size="sm" variant="outline" className="gap-1.5">
              <Link href="/admin/reactions/new">
                <Plus className="h-4 w-4" /> Add Reaction
              </Link>
            </Button>
            <Button asChild size="sm" variant="default" className="gap-1.5">
              <Link href="/admin/molecules/new">
                <Plus className="h-4 w-4" /> Add Molecule
              </Link>
            </Button>
          </div>
        }
      />

      {/* Top Stat Cards */}
      {isLoading || !stats ? (
        <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 xl:grid-cols-5">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className={`h-32 rounded-2xl ${i === 4 ? 'col-span-2 md:col-span-1' : ''}`} />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 xl:grid-cols-5">
          <StatCard
            title="3D Molecules"
            value={stats.counts.molecules}
            subtitle={`${stats.content.molecules.published} published`}
            icon={Atom}
          />
          <StatCard
            title="Reactions"
            value={stats.counts.reactions}
            subtitle={`${stats.content.reactions.published} published`}
            icon={FlaskConical}
          />
          <StatCard
            title="Quiz Questions"
            value={stats.counts.questions}
            subtitle={`${stats.content.questions.published} published`}
            icon={ClipboardList}
          />
          <StatCard
            title="Total Attempts"
            value={stats.counts.quizAttempts}
            subtitle={`${stats.attempts.last7Days} in last 7 days`}
            icon={TrendingUp}
          />
          <StatCard
            title="Enrolled Students"
            value={stats.counts.students}
            subtitle={`${stats.attempts.activeStudents30d} active this month`}
            icon={GraduationCap}
            className="col-span-2 md:col-span-1"
          />
        </div>
      )}

      {/* Content Status Breakdown Grid */}
      {stats && (
        <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
          {(
            [
              ['Chapters', stats.counts.chapters, stats.content.chapters],
              ['Questions', stats.counts.questions, stats.content.questions],
              ['Reactions', stats.counts.reactions, stats.content.reactions],
              ['Molecules', stats.counts.molecules, stats.content.molecules],
            ] as const
          ).map(([label, total, breakdown]) => (
            <div
              key={label}
              className="flex h-full flex-col justify-between gap-3 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm sm:p-5 dark:border-border dark:bg-card"
            >
              <div className="flex items-baseline justify-between gap-2">
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-muted-foreground">{label}</p>
                <span className="font-serif text-2xl font-bold tabular-nums text-slate-900 dark:text-foreground">{total}</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700 ring-1 ring-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-300 dark:ring-emerald-500/30">
                  {breakdown.published} published
                </span>
                <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-semibold text-amber-700 ring-1 ring-amber-200 dark:bg-amber-500/10 dark:text-amber-300 dark:ring-amber-500/30">
                  {breakdown.draft} draft
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Main 2-column Section: Chart & Top Students */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: 30-Day Attempts Chart */}
        <Card className="lg:col-span-2 shadow-sm border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div>
              <CardTitle className="font-serif text-lg">Quiz Activity (Last 30 Days)</CardTitle>
              <p className="text-xs text-muted-foreground mt-0.5">
                Daily volume of completed student assessments
              </p>
            </div>
            {stats && (
              <div className="text-right">
                <span className="text-xl font-bold font-serif text-primary">
                  {stats.attempts.avgPercentage}%
                </span>
                <p className="text-[10px] text-muted-foreground uppercase">Avg Score</p>
              </div>
            )}
          </CardHeader>
          <CardContent className="pt-4">
            {isLoading || !stats ? (
              <Skeleton className="h-64 w-full" />
            ) : (
              <AttemptsChart data={stats.attemptsByDay} height={260} />
            )}
          </CardContent>
        </Card>

        {/* Right Col: Top Students Leaderboard Snippet */}
        <Card className="shadow-sm border-border flex flex-col justify-between">
          <CardHeader className="pb-3 flex flex-row items-center justify-between">
            <div className="flex items-center gap-2">
              <Trophy className="h-4 w-4 text-amber-500" />
              <CardTitle className="font-serif text-base">Top Students</CardTitle>
            </div>
            <Link
              href="/admin/leaderboard"
              className="text-xs font-semibold text-primary hover:underline flex items-center gap-1"
            >
              Full Board <ArrowRight className="h-3 w-3" />
            </Link>
          </CardHeader>
          <CardContent className="space-y-3 flex-1">
            {isLoading || !stats ? (
              <div className="space-y-2">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-10 w-full" />
                ))}
              </div>
            ) : (
              stats.topStudents.map((student, idx) => (
                <div
                  key={student.userId}
                  className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/40 transition-colors border border-border/50"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span
                      className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                        idx === 0
                          ? 'bg-amber-400 text-amber-950'
                          : idx === 1
                          ? 'bg-slate-300 text-slate-800'
                          : idx === 2
                          ? 'bg-amber-700/20 text-amber-700'
                          : 'bg-muted text-muted-foreground'
                      }`}
                    >
                      {idx + 1}
                    </span>
                    <div className="min-w-0">
                      <Link
                        href={`/admin/students/${student.userId}`}
                        className="text-xs font-semibold hover:text-primary transition-colors truncate block"
                      >
                        {student.name}
                      </Link>
                      <p className="text-[10px] text-muted-foreground truncate">
                        {student.institution}
                      </p>
                    </div>
                  </div>
                  <span className="font-mono text-xs font-bold text-foreground shrink-0">
                    {student.points} pts
                  </span>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity Audit List */}
      <Card className="shadow-sm border-border">
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <div className="flex items-center gap-2">
            <History className="h-4 w-4 text-primary" />
            <CardTitle className="font-serif text-base">Recent Audit Activity</CardTitle>
          </div>
          <Link
            href="/admin/audit-logs"
            className="text-xs font-semibold text-primary hover:underline flex items-center gap-1"
          >
            All Logs <ArrowRight className="h-3 w-3" />
          </Link>
        </CardHeader>
        <CardContent>
          {isLoading || !stats ? (
            <div className="space-y-2">
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-full" />
            </div>
          ) : stats.recentActivity.length === 0 ? (
            <p className="text-xs text-muted-foreground py-4 text-center">No recent audit logs.</p>
          ) : (
            <div className="divide-y divide-border/60">
              {stats.recentActivity.map((log) => (
                <div key={log.id} className="flex items-start justify-between gap-3 py-3 text-xs sm:items-center">
                  <div className="flex min-w-0 flex-col gap-1 sm:flex-row sm:flex-wrap sm:items-center sm:gap-x-2">
                    <span className="w-fit rounded-full bg-teal-50 px-2 py-0.5 font-semibold capitalize text-teal-700 ring-1 ring-teal-100 dark:bg-teal-500/10 dark:text-teal-300 dark:ring-teal-500/20">
                      {log.action.replace(/_/g, ' ').toLowerCase()}
                    </span>
                    <span className="min-w-0 truncate text-slate-500 dark:text-muted-foreground">
                      on <span className="font-medium capitalize text-slate-800 dark:text-foreground">{log.entityType} #{log.entityId}</span>
                      {' '}by <span className="font-medium text-slate-800 dark:text-foreground">{log.actor.name}</span>
                    </span>
                  </div>
                  <time dateTime={log.timestamp} className="shrink-0 tabular-nums text-slate-500 dark:text-muted-foreground">
                    {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </time>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
