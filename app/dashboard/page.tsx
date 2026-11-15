"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { Award, BookOpen, CalendarDays, Loader2, Mail, RotateCcw, TrendingUp, Trophy } from "lucide-react"
import { Navigation } from "@/components/navigation"
import { useAuth } from "@/contexts/auth-context"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

type Attempt = {
  id: number
  quizId: number
  chapterName: string
  score: number
  totalQuestions: number
  percentage: number | string
  createdAt: string
}

type StudentRank = {
  enabled: boolean
  currentRank: number | null
  totalStudents: number
  points: number
  bestPercentage: number
  attemptsCount: number
  chaptersAttempted: number
}

function percentageClass(value: number) {
  if (value >= 70) return "border-green-200 bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-200"
  if (value >= 50) return "border-yellow-200 bg-yellow-50 text-yellow-700 dark:bg-yellow-950 dark:text-yellow-200"
  return "border-red-200 bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-200"
}

function percentageBarClass(value: number) {
  if (value >= 70) return "bg-green-500"
  if (value >= 50) return "bg-yellow-500"
  return "bg-red-500"
}

function formatDate(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return "—"
  return date.toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" })
}

const SMALL_WORDS = new Set(["of", "and", "the", "in", "on", "a", "an", "to", "for", "or"])

// Chapter names are entered by admins and some are ALL CAPS; show those in title case.
function displayChapterName(name: string) {
  if (!name) return name
  if (name !== name.toUpperCase() || !/[A-Z]/.test(name)) return name.charAt(0).toUpperCase() + name.slice(1)
  return name
    .toLowerCase()
    .split(" ")
    .map((word, i) => {
      if (/^[ivx]+:?$/.test(word)) return word.toUpperCase() // roman numerals: "I", "II:"
      if (i > 0 && SMALL_WORDS.has(word)) return word
      return word.replace(/^(\(?)(\p{L})/u, (_, paren, ch) => paren + ch.toUpperCase())
    })
    .join(" ")
}

export default function DashboardPage() {
  const { user, isLoading: authLoading } = useAuth()
  const [attempts, setAttempts] = useState<Attempt[]>([])
  const [rank, setRank] = useState<StudentRank | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (authLoading || !user) return
    fetch("/api/quizzes/attempts")
      .then(async (response) => {
        if (!response.ok) throw new Error("Unable to load quiz history")
        return response.json()
      })
      .then((data) => {
        setAttempts(data.attempts || [])
        if (data.rank) {
          setRank(data.rank)
        }
      })
      .catch((requestError) => setError(requestError.message))
      .finally(() => setLoading(false))
  }, [authLoading, user])

  if (authLoading || (user && loading)) {
    return (
      <>
        <Navigation />
        <div className="flex min-h-[70vh] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </>
    )
  }

  if (!user) {
    return (
      <>
        <Navigation />
        <main className="container mx-auto px-4 py-16">
          <Card className="mx-auto max-w-md text-center">
            <CardHeader>
              <CardTitle>Sign In Required</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="mb-5 text-sm text-muted-foreground">Sign in to view your quiz history and performance.</p>
              <Button asChild className="h-11 w-full sm:w-auto">
                <Link href="/auth">Sign In</Link>
              </Button>
            </CardContent>
          </Card>
        </main>
      </>
    )
  }

  const average = attempts.length
    ? Math.round(attempts.reduce((sum, attempt) => sum + Number(attempt.percentage), 0) / attempts.length)
    : 0

  const highest = attempts.reduce<Attempt | null>(
    (best, attempt) => (!best || Number(attempt.percentage) > Number(best.percentage) ? attempt : best),
    null
  )

  const showRank = Boolean(rank && rank.enabled)

  return (
    <>
      <Navigation />
      <main className="container mx-auto space-y-6 px-4 py-6 sm:space-y-8 sm:py-8">
        <header>
          <p className="text-sm font-medium text-primary">Welcome back, {user.name}</p>
          <h1 className="font-serif text-2xl font-bold sm:text-3xl">Student Dashboard</h1>
          <p className="mt-1 text-muted-foreground">
            Review your chemistry quiz performance and keep building momentum.
          </p>
        </header>

        <section className="grid gap-6 lg:grid-cols-[1fr_2fr]">
          {/* Profile Summary */}
          <Card className="shadow-xs border-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="h-5 w-5 text-primary" />
                Profile Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-lg font-semibold">{user.name}</p>
                <p className="flex min-w-0 items-center gap-2 break-all text-sm text-muted-foreground">
                  <Mail className="h-4 w-4" />
                  {user.email}
                </p>
              </div>

              {/* Overall Class Rank Badge when enabled */}
              {showRank && (
                <div className="border-t pt-4">
                  <div className="rounded-xl border border-amber-200/80 bg-gradient-to-br from-amber-50 to-amber-100/40 dark:border-amber-900/60 dark:from-amber-950/30 dark:to-background p-3.5 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-semibold uppercase tracking-wider text-amber-800 dark:text-amber-300 flex items-center gap-1.5">
                        <Trophy className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                        Overall Class Standing
                      </span>
                      <Badge
                        variant="outline"
                        className="border-amber-300 bg-amber-100/80 text-amber-900 dark:bg-amber-900/60 dark:text-amber-200 text-[11px] font-mono font-medium"
                      >
                        {rank?.points ?? 0} Pts
                      </Badge>
                    </div>

                    {rank?.currentRank !== null ? (
                      <div className="flex items-baseline gap-2">
                        <span className="text-2xl font-black text-amber-900 dark:text-amber-200 tracking-tight">
                          Rank #{rank?.currentRank}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          among {rank?.totalStudents} {rank?.totalStudents === 1 ? "student" : "students"}
                        </span>
                      </div>
                    ) : (
                      <p className="text-xs text-muted-foreground">
                        Unranked. Take a quiz to receive your ranking!
                      </p>
                    )}
                  </div>
                </div>
              )}

              <div className="border-t pt-4">
                <p className="text-2xl font-bold">{attempts.length}</p>
                <p className="text-sm text-muted-foreground">Total quizzes completed</p>
              </div>
            </CardContent>
          </Card>

          {/* Metric Cards Grid */}
          <div className={`grid grid-cols-2 gap-3 sm:gap-6 ${showRank ? "lg:grid-cols-4" : "sm:grid-cols-3"}`}>
            {showRank && (
              <Card className="border-amber-500/30 bg-gradient-to-br from-amber-500/5 to-transparent shadow-xs">
                <CardHeader className="pb-2">
                  <CardTitle className="text-xs font-medium text-muted-foreground sm:text-sm">Overall Rank</CardTitle>
                </CardHeader>
                <CardContent>
                  <Trophy className="mb-3 h-5 w-5 text-amber-500" />
                  <p className="text-2xl font-bold sm:text-3xl text-amber-600 dark:text-amber-400">
                    {rank?.currentRank !== null ? `#${rank?.currentRank}` : "—"}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {rank?.currentRank !== null
                      ? `Cohort of ${rank?.totalStudents} students`
                      : "Take a quiz to enter rank"}
                  </p>
                </CardContent>
              </Card>
            )}

            <Card className="shadow-xs">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-medium sm:text-sm">Total Quizzes Attempted</CardTitle>
              </CardHeader>
              <CardContent>
                <BookOpen className="mb-3 h-5 w-5 text-primary" />
                <p className="text-2xl font-bold sm:text-3xl">{attempts.length}</p>
              </CardContent>
            </Card>

            <Card className="shadow-xs">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-medium sm:text-sm">Average Percentage Score</CardTitle>
              </CardHeader>
              <CardContent>
                <TrendingUp className="mb-3 h-5 w-5 text-emerald-600" />
                <p className="text-2xl font-bold sm:text-3xl">{average}%</p>
              </CardContent>
            </Card>

            <Card className={`shadow-xs ${showRank ? "" : "col-span-2 sm:col-span-1"}`}>
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-medium sm:text-sm">Highest Scoring Chapter</CardTitle>
              </CardHeader>
              <CardContent>
                <Award className="mb-3 h-5 w-5 text-amber-600" />
                <p className="line-clamp-2 break-words font-semibold leading-snug">
                  {highest ? displayChapterName(highest.chapterName) : "No attempts yet"}
                </p>
                <p className="text-sm text-muted-foreground">
                  {highest ? `${Math.round(Number(highest.percentage))}%` : "Start a quiz"}
                </p>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Quiz History */}
        <Card className="shadow-xs">
          <CardHeader>
            <CardTitle>Quiz History</CardTitle>
          </CardHeader>
          <CardContent>
            {error ? (
              <p className="py-8 text-center text-sm text-destructive">{error}</p>
            ) : attempts.length === 0 ? (
              <div className="py-10 text-center">
                <p className="text-muted-foreground">No completed quizzes yet.</p>
                <Button asChild className="mt-4 h-11">
                  <Link href="/quizzes">Take Your First Quiz</Link>
                </Button>
              </div>
            ) : (
              <>
                {/* Phones: one card per attempt */}
                <ul className="space-y-3 md:hidden">
                  {attempts.map((attempt) => {
                    const percentage = Math.round(Number(attempt.percentage))
                    return (
                      <li key={attempt.id} className="rounded-xl border bg-card p-4 shadow-xs">
                        <div className="flex items-start justify-between gap-3">
                          <p className="min-w-0 break-words font-semibold leading-snug">
                            {displayChapterName(attempt.chapterName)}
                          </p>
                          <Badge variant="outline" className={`shrink-0 text-sm ${percentageClass(percentage)}`}>
                            {percentage}%
                          </Badge>
                        </div>
                        <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-muted">
                          <div
                            className={`h-full rounded-full ${percentageBarClass(percentage)}`}
                            style={{ width: `${Math.min(100, Math.max(0, percentage))}%` }}
                          />
                        </div>
                        <div className="mt-3 flex items-center justify-between gap-3 text-sm text-muted-foreground">
                          <span>
                            <span className="font-semibold text-foreground">
                              {attempt.score}/{attempt.totalQuestions}
                            </span>{" "}
                            correct
                          </span>
                          <span className="inline-flex items-center gap-1.5">
                            <CalendarDays className="h-4 w-4" />
                            {formatDate(attempt.createdAt)}
                          </span>
                        </div>
                        <Button asChild variant="outline" className="mt-4 h-11 w-full gap-2">
                          <Link href={`/quizzes/${attempt.quizId}`}>
                            <RotateCcw className="h-4 w-4" />
                            Retake Quiz
                          </Link>
                        </Button>
                      </li>
                    )
                  })}
                </ul>

                {/* Tablet & desktop: table */}
                <div className="hidden overflow-x-auto md:block">
                  <table className="w-full text-left text-sm">
                    <thead className="border-b text-muted-foreground">
                      <tr>
                        <th className="pb-3 pr-4 font-medium">Chapter</th>
                        <th className="whitespace-nowrap pb-3 pr-4 font-medium">Score</th>
                        <th className="whitespace-nowrap pb-3 pr-4 font-medium">Result</th>
                        <th className="whitespace-nowrap pb-3 pr-4 font-medium">Completed</th>
                        <th className="pb-3 text-right font-medium">
                          <span className="sr-only">Action</span>
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {attempts.map((attempt) => {
                        const percentage = Math.round(Number(attempt.percentage))
                        return (
                          <tr key={attempt.id} className="border-b transition-colors last:border-0 hover:bg-muted/40">
                            <td className="py-3.5 pr-4 font-medium">{displayChapterName(attempt.chapterName)}</td>
                            <td className="whitespace-nowrap py-3.5 pr-4 tabular-nums">
                              {attempt.score} / {attempt.totalQuestions}
                            </td>
                            <td className="py-3.5 pr-4">
                              <div className="flex items-center gap-3">
                                <Badge variant="outline" className={`w-14 justify-center tabular-nums ${percentageClass(percentage)}`}>
                                  {percentage}%
                                </Badge>
                                <div className="hidden h-1.5 w-24 overflow-hidden rounded-full bg-muted lg:block">
                                  <div
                                    className={`h-full rounded-full ${percentageBarClass(percentage)}`}
                                    style={{ width: `${Math.min(100, Math.max(0, percentage))}%` }}
                                  />
                                </div>
                              </div>
                            </td>
                            <td className="whitespace-nowrap py-3.5 pr-4 text-muted-foreground">
                              <span className="inline-flex items-center gap-1.5">
                                <CalendarDays className="h-4 w-4" />
                                {formatDate(attempt.createdAt)}
                              </span>
                            </td>
                            <td className="py-3.5 text-right">
                              <Button asChild variant="outline" size="sm" className="gap-1.5">
                                <Link href={`/quizzes/${attempt.quizId}`}>
                                  <RotateCcw className="h-3.5 w-3.5" />
                                  Retake
                                </Link>
                              </Button>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </main>
    </>
  )
}
