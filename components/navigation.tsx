"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { useAuth } from "@/contexts/auth-context";
import { cn } from "@/lib/utils";
import { User, LogOut, Menu, LogIn } from "lucide-react";

const NAV_LINKS = [
  { href: "/", label: "Home" },
  { href: "/about", label: "About us" },
  { href: "/molecules", label: "3D Molecules" },
  { href: "/periodic", label: "Periodic Table", aliases: ["/periodic-table"] },
  { href: "/reactions", label: "Reactions" },
  { href: "/concepts", label: "Concept Lab" },
  { href: "/news", label: "News" },
  { href: "/quizzes", label: "Quizzes", studentOnly: true },
  { href: "/dashboard", label: "Dashboard", studentOnly: true },
] as const;

const ADMIN_CONSOLE_LINK = { href: "/admin/dashboard", label: "Admin Console" } as const;

export function Navigation() {
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const isActive = (href: string, aliases: readonly string[] = []) =>
    pathname === href ||
    aliases.some((alias) => pathname === alias) ||
    (href !== "/" && pathname.startsWith(`${href}/`));

  // Admin/staff sessions don't cover student-only pages (quizzes, progress dashboard):
  // hide those links and offer the admin console instead.
  const isPortalUser = user?.role === "admin" || user?.role === "staff";
  const visibleLinks = [
    ...NAV_LINKS.filter((l) => !(isPortalUser && "studentOnly" in l && l.studentOnly)),
    ...(isPortalUser ? [ADMIN_CONSOLE_LINK] : []),
  ];
  const desktopLinks = visibleLinks.filter((l) => l.href !== "/");

  const initials = (user?.name || "")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]!.toUpperCase())
    .join("");

  return (
    // Outer bar is transparent; only the centred pill has a surface (glassmorphism).
    <nav className="sticky top-0 z-40 px-3 pt-3 sm:px-4" aria-label="Main">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-2 rounded-full border border-white/70 bg-white/70 pl-4 pr-2 shadow-[0_8px_30px_-12px_rgba(15,23,42,0.25)] ring-1 ring-slate-900/5 backdrop-blur-md supports-[backdrop-filter]:bg-white/60 sm:pl-5">
        <Link href="/" className="flex shrink-0 items-center transition-opacity hover:opacity-90" aria-label="ChemCurious home">
          <Image
            src="/ChemCurious_logo_HD.png"
            alt="ChemCurious"
            width={140}
            height={38}
            priority
            className="h-8 w-auto object-contain"
          />
        </Link>

        <div className="hidden min-w-0 flex-1 items-center justify-center gap-0.5 md:flex lg:gap-1">
          {desktopLinks.map((item) => {
            const active = isActive(item.href, "aliases" in item ? item.aliases : []);
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "whitespace-nowrap rounded-full px-2.5 py-1.5 text-sm font-medium transition-colors lg:px-3.5",
                  active
                    ? "bg-primary/10 text-primary"
                    : "text-slate-600 hover:bg-slate-900/5 hover:text-slate-900"
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </div>

        {/* Desktop auth */}
        <div className="hidden shrink-0 items-center gap-1.5 md:flex">
          {user ? (
            <>
              <div
                className="flex items-center gap-2 rounded-full bg-slate-900/5 py-1 pl-1 pr-1 lg:pr-3"
                title={user.email ? `${user.name} · ${user.email}` : user.name}
              >
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary text-[11px] font-bold text-primary-foreground">
                  {initials || <User className="h-3.5 w-3.5" />}
                </span>
                <span className="hidden max-w-[9rem] truncate text-sm font-medium text-slate-800 lg:inline">{user.name}</span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={logout}
                className="h-9 rounded-full px-3 text-slate-600 hover:bg-rose-50 hover:text-rose-600"
                aria-label="Logout"
              >
                <LogOut className="h-4 w-4 lg:mr-1.5" />
                <span className="hidden lg:inline">Logout</span>
              </Button>
            </>
          ) : (
            <Button asChild size="sm" className="h-9 rounded-full px-5 shadow-md shadow-primary/25">
              <Link href="/auth">Sign In</Link>
            </Button>
          )}
        </div>

        {/* Mobile menu trigger */}
        <Button
          variant="ghost"
          size="icon"
          className="h-10 w-10 rounded-full md:hidden"
          aria-label="Open menu"
          onClick={() => setOpen(true)}
        >
          <Menu className="h-5 w-5" />
        </Button>
      </div>

      {/* Mobile drawer */}
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="right" className="flex w-[85%] max-w-sm flex-col gap-0 p-0">
          <SheetHeader className="border-b p-4 text-left">
            <SheetTitle className="sr-only">Menu</SheetTitle>
            <SheetDescription className="sr-only">Site navigation</SheetDescription>
            <Image
              src="/ChemCurious_logo_HD.png"
              alt="ChemCurious"
              width={140}
              height={38}
              className="h-9 w-auto object-contain object-left"
            />
          </SheetHeader>

          <div className="flex-1 overflow-y-auto p-3">
            <div className="flex flex-col gap-1">
              {visibleLinks.map((item) => {
                const active =
                  item.href === "/"
                    ? pathname === "/"
                    : isActive(item.href, "aliases" in item ? item.aliases : []);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setOpen(false)}
                    className={cn(
                      "rounded-lg px-4 py-3 text-base font-medium transition-colors",
                      active
                        ? "bg-primary/10 text-primary"
                        : "text-gray-800 hover:bg-muted active:bg-muted"
                    )}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </div>
          </div>

          <div className="border-t p-4">
            {user ? (
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <User className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold">{user.name}</p>
                    {user.email && (
                      <p className="truncate text-xs text-muted-foreground">{user.email}</p>
                    )}
                  </div>
                </div>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => {
                    setOpen(false);
                    logout();
                  }}
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Logout
                </Button>
              </div>
            ) : (
              <Button asChild className="h-11 w-full">
                <Link href="/auth" onClick={() => setOpen(false)}>
                  <LogIn className="mr-2 h-4 w-4" />
                  Sign In
                </Link>
              </Button>
            )}
          </div>
        </SheetContent>
      </Sheet>
    </nav>
  );
}
