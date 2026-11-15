"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect } from "react"

interface User {
  id: string
  email: string
  name: string
  institution: string
  role?: string
  status?: string
  createdAt?: string
}

interface AuthContextType {
  user: User | null
  error: string | null
  login: (email: string, password: string) => Promise<User | null>
  signup: (
    email: string,
    password: string,
    name: string,
    institution: string,
    role?: "student" | "staff" | "admin"
  ) => Promise<{ ok: boolean; requiresApproval: boolean }>
  logout: () => void
  isLoading: boolean
}

function getSessionPortal(): string | null {
  try {
    return typeof window !== "undefined" ? window.sessionStorage.getItem("chem_active_portal") : null
  } catch {
    return null
  }
}

function setSessionPortal(val: string): void {
  try {
    if (typeof window !== "undefined") {
      window.sessionStorage.setItem("chem_active_portal", val)
    }
  } catch {}
}

function removeSessionPortal(): void {
  try {
    if (typeof window !== "undefined") {
      window.sessionStorage.removeItem("chem_active_portal")
    }
  } catch {}
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Check for existing session via HTTP cookie + current URL pathname
    const checkSession = async () => {
      try {
        const portal = getSessionPortal()
        const isAdminPath = typeof window !== "undefined" && window.location.pathname.startsWith("/admin")

        if (portal === "admin" || isAdminPath) {
          // Check Admin session endpoint
          try {
            const adminRes = await fetch("/api/admin/me")
            if (adminRes.ok) {
              const data = await adminRes.json()
              if (data && (data.role === "admin" || data.role === "staff")) {
                setUser({
                  id: String(data.id),
                  email: data.email,
                  name: data.name,
                  institution: data.institution || "",
                  role: data.role,
                  status: data.status,
                })
                setSessionPortal("admin")
                setIsLoading(false)
                return
              }
            }
          } catch {}
        }

        // Student session check
        try {
          const studentRes = await fetch("/api/auth/me")
          if (studentRes.ok) {
            const data = await studentRes.json()
            if (data.user && data.user.role === "student") {
              setUser(data.user)
              setSessionPortal("student")
              setIsLoading(false)
              return
            }
          }
        } catch {}

        // Fallback: Check admin session if not on admin path
        try {
          const fallbackAdmin = await fetch("/api/admin/me")
          if (fallbackAdmin.ok) {
            const data = await fallbackAdmin.json()
            if (data && (data.role === "admin" || data.role === "staff")) {
              setUser({
                id: String(data.id),
                email: data.email,
                name: data.name,
                institution: data.institution || "",
                role: data.role,
                status: data.status,
              })
              setSessionPortal("admin")
              setIsLoading(false)
              return
            }
          }
        } catch {}

        // No active session found
        removeSessionPortal()
        setUser(null)
      } catch (err) {
        console.error("Session verification failed:", err)
        setUser(null)
      } finally {
        setIsLoading(false)
      }
    }

    checkSession()
  }, [])

  const login = async (email: string, password: string): Promise<User | null> => {
    setIsLoading(true)
    setError(null)
    try {
      // Unified endpoint: the server decides student vs admin/staff from the database
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      })

      if (response.ok) {
        const data = await response.json()
        const u = data.user ?? data
        const userObj: User = {
          id: String(u.id),
          email: u.email,
          name: u.name,
          institution: u.institution || "",
          role: u.role,
          status: u.status,
        }
        setUser(userObj)
        setError(null)
        setSessionPortal(data.role === "admin" || data.role === "staff" ? "admin" : "student")
        setIsLoading(false)
        return userObj
      } else {
        const errData = await response.json().catch(() => null)
        const errMsg = errData?.error || "Invalid email or password"
        setError(errMsg)
      }
    } catch (err) {
      console.error("Login request failed:", err)
      setError("Network error: Unable to connect to server")
    }

    setIsLoading(false)
    return null
  }

  const signup = async (
    email: string,
    password: string,
    name: string,
    institution: string,
    role: "student" | "staff" | "admin" = "student"
  ): Promise<{ ok: boolean; requiresApproval: boolean }> => {
    setIsLoading(true)
    setError(null)
    try {
      const response = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, name, institution, role }),
      })

      if (response.ok) {
        const data = await response.json()
        if (data.requiresApproval) {
          // Staff/admin request: no session until an administrator approves it
          setIsLoading(false)
          return { ok: true, requiresApproval: true }
        }
        const u = data.user ?? data
        setUser({ ...u, id: String(u.id) })
        setSessionPortal("student")
        setIsLoading(false)
        return { ok: true, requiresApproval: false }
      } else {
        const errData = await response.json().catch(() => null)
        setError(errData?.error || "Registration failed")
      }
    } catch (err) {
      console.error("Signup request failed:", err)
      setError("Network error: Unable to connect to server")
    }

    setIsLoading(false)
    return { ok: false, requiresApproval: false }
  }

  const logout = async () => {
    setIsLoading(true)

    try {
      // Clear all potential sessions
      await Promise.allSettled([
        fetch("/api/auth/admin-logout", { method: "POST" }),
        fetch("/api/auth/logout", { method: "POST" }),
      ])
    } catch (err) {
      console.error("Logout request failed:", err)
    }

    removeSessionPortal()
    setUser(null)
    setError(null)
    setIsLoading(false)
  }

  return (
    <AuthContext.Provider value={{ user, error, login, signup, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
