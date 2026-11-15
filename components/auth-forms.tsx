"use client"

import type React from "react"
import { useState, Suspense } from "react"
import { useSearchParams } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { AlertCircle, CheckCircle2, Clock, GraduationCap, Loader2, ShieldCheck } from "lucide-react"
import { cn } from "@/lib/utils"

interface AuthFormsProps {
  defaultTab?: "login" | "signup"
}

type AccountType = "student" | "staff" | "admin"
type Notice = { tone: "error" | "pending" | "success"; text: string } | null

const EMPTY_SIGNUP = { email: "", password: "", name: "", institution: "" }

/** Only same-site relative paths are allowed as post-login destinations. */
function safeRedirect(value: string | null, role: string): string {
  const isPortal = role === "admin" || role === "staff"
  const fallback = isPortal ? "/admin/dashboard" : "/"
  if (!value || !value.startsWith("/") || value.startsWith("//")) return fallback
  const isAdminPath = value.startsWith("/admin")
  // Admins go to admin pages; students never get sent into /admin
  return isPortal === isAdminPath ? value : fallback
}

function markPortal(role: string) {
  try {
    window.sessionStorage.setItem("chem_active_portal", role === "admin" || role === "staff" ? "admin" : "student")
  } catch {
    // sessionStorage can be unavailable (private mode) — safe to ignore
  }
}

function NoticeBanner({ notice }: { notice: Notice }) {
  if (!notice) return null
  const styles = {
    error: "border-red-200 bg-red-50 text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300",
    pending: "border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-200",
    success: "border-green-200 bg-green-50 text-green-700 dark:border-green-900 dark:bg-green-950/40 dark:text-green-300",
  }[notice.tone]
  const Icon = notice.tone === "pending" ? Clock : notice.tone === "success" ? CheckCircle2 : AlertCircle
  return (
    <div role={notice.tone === "error" ? "alert" : "status"} className={cn("flex gap-2.5 rounded-md border p-3 text-sm", styles)}>
      <Icon className="mt-0.5 h-4 w-4 shrink-0" />
      <p className="leading-snug">{notice.text}</p>
    </div>
  )
}

function AuthFormsContent({ defaultTab = "login" }: AuthFormsProps) {
  const searchParams = useSearchParams()
  const redirectParam = searchParams.get("redirect")
  const fromAdminArea = searchParams.get("portal") === "admin"

  const [activeTab, setActiveTab] = useState<"login" | "signup">(defaultTab)
  const [loginForm, setLoginForm] = useState({ email: "", password: "" })
  const [signupForm, setSignupForm] = useState(EMPTY_SIGNUP)
  const [accountType, setAccountType] = useState<AccountType>("student")
  const [loginNotice, setLoginNotice] = useState<Notice>(null)
  const [signupNotice, setSignupNotice] = useState<Notice>(null)
  const [requestSubmitted, setRequestSubmitted] = useState<{ email: string; role: AccountType } | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const switchTab = (tab: "login" | "signup") => {
    setActiveTab(tab)
    setLoginNotice(null)
    setSignupNotice(null)
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoginNotice(null)
    setIsSubmitting(true)

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: loginForm.email, password: loginForm.password }),
      })
      const data = await response.json().catch(() => ({}))

      if (!response.ok) {
        setLoginNotice({
          tone: response.status === 403 && data.status === "pending_approval" ? "pending" : "error",
          text: data.error || "Invalid email or password",
        })
        setIsSubmitting(false)
        return
      }

      // Role comes from the database; route each role to its own area
      const role: string = data.role || data.user?.role || "student"
      markPortal(role)
      window.location.href = safeRedirect(redirectParam, role)
    } catch (err) {
      console.error("Login submission error:", err)
      setLoginNotice({ tone: "error", text: "Network error: Unable to connect to server. Please try again." })
      setIsSubmitting(false)
    }
  }

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    setSignupNotice(null)

    if (signupForm.password.length < 6) {
      setSignupNotice({ tone: "error", text: "Password must be at least 6 characters." })
      return
    }
    if (!signupForm.institution.trim()) {
      setSignupNotice({ tone: "error", text: "Please enter your school, college or organisation." })
      return
    }

    setIsSubmitting(true)
    try {
      const response = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...signupForm, role: accountType }),
      })
      const data = await response.json().catch(() => ({}))

      if (!response.ok) {
        setSignupNotice({
          tone: "error",
          text:
            data.error === "EMAIL_ALREADY_EXISTS"
              ? "This email is already registered. Please sign in instead."
              : data.error || "Registration failed. Please try again.",
        })
        setIsSubmitting(false)
        return
      }

      if (data.requiresApproval) {
        // No session is issued for staff/admin requests — show the confirmation screen
        setRequestSubmitted({ email: signupForm.email.trim(), role: accountType })
        setSignupForm(EMPTY_SIGNUP)
        setIsSubmitting(false)
        return
      }

      // Student accounts are active immediately and already signed in
      markPortal("student")
      window.location.href = safeRedirect(redirectParam, "student")
    } catch (err) {
      console.error("Signup request failed:", err)
      setSignupNotice({ tone: "error", text: "Registration failed. Please check your connection and try again." })
      setIsSubmitting(false)
    }
  }

  const isStaffRequest = accountType !== "student"

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <Card className="w-full max-w-md border-border/60 shadow-md">
        <CardHeader className="pb-4 text-center">
          <div className="mb-2 flex justify-center">
            <Image src="/ChemCurious_logo.svg" alt="ChemCurious Logo" width={44} height={44} />
          </div>
          <CardTitle className="text-2xl font-bold text-primary">ChemCurious</CardTitle>
          <CardDescription>
            {fromAdminArea
              ? "Sign in with your staff or administrator account"
              : "Sign in to track your progress and save your work"}
          </CardDescription>
        </CardHeader>

        <CardContent>
          {requestSubmitted ? (
            <div className="space-y-4 py-2 text-center" role="status">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-amber-100 text-amber-600 dark:bg-amber-950 dark:text-amber-300">
                <Clock className="h-7 w-7" />
              </div>
              <div className="space-y-2">
                <h2 className="text-lg font-semibold">Account request submitted!</h2>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  Your {requestSubmitted.role === "admin" ? "administrator" : "staff"} account for{" "}
                  <span className="font-medium text-foreground">{requestSubmitted.email}</span> requires verification
                  from an administrator before you can access the admin portal.
                </p>
                <p className="text-xs text-muted-foreground">
                  You can sign in as soon as your request is approved.
                </p>
              </div>
              <Button
                className="h-11 w-full"
                onClick={() => {
                  setLoginForm({ email: requestSubmitted.email, password: "" })
                  setRequestSubmitted(null)
                  setAccountType("student")
                  switchTab("login")
                }}
              >
                Back to Sign In
              </Button>
            </div>
          ) : (
            <Tabs value={activeTab} onValueChange={(v) => switchTab(v as "login" | "signup")} className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="login">Sign In</TabsTrigger>
                <TabsTrigger value="signup">Create Account</TabsTrigger>
              </TabsList>

              {/* ---------- SIGN IN (one form for every role) ---------- */}
              <TabsContent value="login">
                <form onSubmit={handleLogin} className="space-y-4 pt-2">
                  <div className="space-y-2">
                    <Label htmlFor="login-email">Email</Label>
                    <Input
                      id="login-email"
                      type="email"
                      autoComplete="email"
                      placeholder="you@example.com"
                      value={loginForm.email}
                      onChange={(e) => setLoginForm({ ...loginForm, email: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="login-password">Password</Label>
                      <Link href="/forgot-password" className="text-sm text-primary hover:underline">
                        Forgot password?
                      </Link>
                    </div>
                    <Input
                      id="login-password"
                      type="password"
                      autoComplete="current-password"
                      placeholder="••••••••"
                      value={loginForm.password}
                      onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                      required
                    />
                  </div>
                  <NoticeBanner notice={loginNotice} />
                  <Button type="submit" className="h-11 w-full" disabled={isSubmitting}>
                    {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Sign In
                  </Button>
                  <p className="text-center text-xs text-muted-foreground">
                    Students, staff and administrators all sign in here.
                  </p>
                </form>
              </TabsContent>

              {/* ---------- CREATE ACCOUNT ---------- */}
              <TabsContent value="signup">
                <form onSubmit={handleSignup} className="space-y-4 pt-2">
                  <fieldset className="space-y-2">
                    <legend className="mb-2 text-sm font-medium">Account type</legend>
                    <div role="radiogroup" aria-label="Account type" className="grid grid-cols-2 gap-2">
                      {(
                        [
                          { key: "student", title: "Student", hint: "Instant access", icon: GraduationCap },
                          { key: "staff", title: "Staff / Teacher / Admin", hint: "Requires approval", icon: ShieldCheck },
                        ] as const
                      ).map(({ key, title, hint, icon: Icon }) => {
                        const selected = key === "student" ? !isStaffRequest : isStaffRequest
                        return (
                          <button
                            key={key}
                            type="button"
                            role="radio"
                            aria-checked={selected}
                            onClick={() => setAccountType(key === "student" ? "student" : "staff")}
                            className={cn(
                              "flex min-h-[76px] flex-col items-start gap-1 rounded-lg border-2 p-3 text-left transition-colors",
                              selected
                                ? "border-primary bg-primary/5"
                                : "border-border hover:border-primary/40 hover:bg-muted/40"
                            )}
                          >
                            <span className="flex items-center gap-1.5 text-sm font-semibold">
                              <Icon className={cn("h-4 w-4", selected ? "text-primary" : "text-muted-foreground")} />
                              {title}
                            </span>
                            <span
                              className={cn(
                                "rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
                                key === "student"
                                  ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"
                                  : "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300"
                              )}
                            >
                              {hint}
                            </span>
                          </button>
                        )
                      })}
                    </div>

                    {isStaffRequest && (
                      <div className="space-y-2 rounded-lg border border-amber-200 bg-amber-50/60 p-3 dark:border-amber-900 dark:bg-amber-950/20">
                        <p className="text-xs font-medium text-amber-900 dark:text-amber-200">Requested access level</p>
                        <div role="radiogroup" aria-label="Requested access level" className="grid grid-cols-2 gap-2">
                          {(
                            [
                              { key: "staff", label: "Staff / Teacher", desc: "Create & edit content" },
                              { key: "admin", label: "Administrator", desc: "Full access & users" },
                            ] as const
                          ).map(({ key, label, desc }) => (
                            <button
                              key={key}
                              type="button"
                              role="radio"
                              aria-checked={accountType === key}
                              onClick={() => setAccountType(key)}
                              className={cn(
                                "rounded-md border bg-background px-2.5 py-2 text-left transition-colors",
                                accountType === key ? "border-primary ring-1 ring-primary" : "border-border hover:border-primary/40"
                              )}
                            >
                              <span className="block text-xs font-semibold">{label}</span>
                              <span className="block text-[11px] text-muted-foreground">{desc}</span>
                            </button>
                          ))}
                        </div>
                        <p className="text-[11px] leading-snug text-amber-800/90 dark:text-amber-300/90">
                          An existing administrator must approve your request before you can sign in.
                        </p>
                      </div>
                    )}
                  </fieldset>

                  <div className="space-y-2">
                    <Label htmlFor="signup-name">Full Name</Label>
                    <Input
                      id="signup-name"
                      type="text"
                      autoComplete="name"
                      placeholder="Your full name"
                      value={signupForm.name}
                      onChange={(e) => setSignupForm({ ...signupForm, name: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-institution">
                      {isStaffRequest ? "School / Organisation" : "School / College Name"}
                    </Label>
                    <Input
                      id="signup-institution"
                      type="text"
                      autoComplete="organization"
                      placeholder={isStaffRequest ? "Where you teach or work" : "School or college"}
                      value={signupForm.institution}
                      onChange={(e) => setSignupForm({ ...signupForm, institution: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-email">Email</Label>
                    <Input
                      id="signup-email"
                      type="email"
                      autoComplete="email"
                      placeholder="you@example.com"
                      value={signupForm.email}
                      onChange={(e) => setSignupForm({ ...signupForm, email: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-password">Password</Label>
                    <Input
                      id="signup-password"
                      type="password"
                      autoComplete="new-password"
                      placeholder="At least 6 characters"
                      value={signupForm.password}
                      onChange={(e) => setSignupForm({ ...signupForm, password: e.target.value })}
                      minLength={6}
                      required
                    />
                  </div>
                  <NoticeBanner notice={signupNotice} />
                  <Button type="submit" className="h-11 w-full" disabled={isSubmitting}>
                    {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {isStaffRequest ? "Request Access" : "Create Account"}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export function AuthForms(props: AuthFormsProps) {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      }
    >
      <AuthFormsContent {...props} />
    </Suspense>
  )
}
