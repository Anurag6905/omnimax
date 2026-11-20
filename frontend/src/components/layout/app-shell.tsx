"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { ChevronDown, FileText, Gauge, LogOut, Menu, Palette, SlidersHorizontal, Users, UserCog, X } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { can, ROLE_LABEL, type Permission } from "@/lib/roles";
import { cn } from "@/lib/cn";
import { Avatar } from "@/components/ui/avatar";
import { Logo } from "./logo";

type NavItem = { href: string; label: string; icon: typeof Users; soon?: boolean; permission?: Permission };

const NAV: Array<{ group?: string; items: NavItem[] }> = [
  {
    items: [
      { href: "/clients", label: "Clients", icon: Users },
      { href: "/dashboard", label: "Dashboard", icon: Gauge, soon: true },
    ],
  },
  {
    group: "Planning",
    items: [
      { href: "/assumptions", label: "Firm assumptions", icon: SlidersHorizontal },
      { href: "/reports", label: "Reports", icon: FileText, soon: true },
    ],
  },
  {
    group: "Workspace",
    items: [
      { href: "/admin/users", label: "Staff and roles", icon: UserCog, permission: "users.manage" },
      { href: "/design-system", label: "Design system", icon: Palette },
    ],
  },
];

function SidebarNav({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const { user } = useAuth();
  return (
    <nav aria-label="Main" className="flex flex-col gap-5 px-3">
      {NAV.map((section, i) => {
        const items = section.items.filter((it) => !it.permission || can(user?.role, it.permission));
        if (!items.length) return null;
        return (
          <div key={i} className="flex flex-col gap-0.5">
            {section.group && <p className="px-3 pb-1 text-xs font-medium text-faint">{section.group}</p>}
            {items.map(({ href, label, icon: Icon, soon }) => {
              const active = pathname === href || pathname.startsWith(href + "/");
              if (soon)
                return (
                  <span key={href} className="flex h-9 cursor-default items-center gap-3 rounded-md px-3 text-sm text-faint" title="Comes later in Phase 1A">
                    <Icon size={17} strokeWidth={1.75} />
                    <span className="flex-1">{label}</span>
                    <span className="text-[11px]">Soon</span>
                  </span>
                );
              return (
                <Link
                  key={href}
                  href={href}
                  onClick={onNavigate}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "flex h-9 items-center gap-3 rounded-md px-3 text-sm transition-colors",
                    active ? "bg-brand-50 font-medium text-brand" : "text-ink-soft hover:bg-surface hover:text-ink",
                  )}
                >
                  <Icon size={17} strokeWidth={active ? 2 : 1.75} />
                  {label}
                </Link>
              );
            })}
          </div>
        );
      })}
    </nav>
  );
}

function UserMenu() {
  const { user, signOut } = useAuth();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => !ref.current?.contains(e.target as Node) && setOpen(false);
    const esc = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", esc);
    return () => {
      document.removeEventListener("mousedown", close);
      document.removeEventListener("keydown", esc);
    };
  }, [open]);

  if (!user) return null;
  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-haspopup="menu"
        className="flex items-center gap-2.5 rounded-md py-1 pr-2 pl-1 hover:bg-surface"
      >
        <Avatar name={user.fullName} />
        <span className="hidden text-left leading-tight sm:block">
          <span className="block text-[13px] font-medium text-ink">{user.fullName}</span>
          <span className="block text-xs text-muted">{ROLE_LABEL[user.role]}</span>
        </span>
        <ChevronDown size={15} className="text-muted" />
      </button>
      {open && (
        <div role="menu" className="animate-pop-in absolute right-0 z-40 mt-1.5 w-60 rounded-lg border border-line bg-white p-1.5 shadow-pop">
          <div className="px-2.5 py-2">
            <p className="text-[13px] font-medium text-ink">{user.fullName}</p>
            <p className="text-xs text-muted">{user.email}</p>
          </div>
          <div className="my-1 border-t border-line" />
          <button
            role="menuitem"
            onClick={() => {
              signOut();
              router.replace("/login");
            }}
            className="flex w-full items-center gap-2.5 rounded-md px-2.5 py-2 text-left text-[13px] text-ink-soft hover:bg-surface hover:text-ink"
          >
            <LogOut size={15} /> Sign out
          </button>
        </div>
      )}
    </div>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const { user, ready } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [drawer, setDrawer] = useState(false);

  useEffect(() => {
    if (ready && !user) router.replace(`/login?next=${encodeURIComponent(pathname)}`);
  }, [ready, user, router, pathname]);

  if (!ready || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center" aria-busy="true">
        <span className="size-5 animate-spin rounded-full border-2 border-line border-t-brand" />
        <span className="sr-only">Loading</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-60 flex-col border-r border-line bg-white lg:flex">
        <div className="flex h-15 items-center px-6">
          <Link href="/clients" aria-label="Omnimax home">
            <Logo />
          </Link>
        </div>
        <div className="flex-1 overflow-y-auto pt-3">
          <SidebarNav />
        </div>
        <p className="border-t border-line px-6 py-3 text-xs text-faint">Preview with sample data</p>
      </aside>

      {/* mobile drawer */}
      {drawer && (
        <div className="fixed inset-0 z-40 bg-ink/30 lg:hidden" onClick={() => setDrawer(false)}>
          <aside className="animate-pop-in flex h-full w-64 flex-col bg-white" onClick={(e) => e.stopPropagation()}>
            <div className="flex h-15 items-center justify-between px-5">
              <Logo />
              <button onClick={() => setDrawer(false)} aria-label="Close menu" className="rounded-md p-1.5 text-muted hover:bg-surface">
                <X size={18} />
              </button>
            </div>
            <div className="pt-3">
              <SidebarNav onNavigate={() => setDrawer(false)} />
            </div>
          </aside>
        </div>
      )}

      <div className="lg:pl-60">
        <header className="sticky top-0 z-20 flex h-15 items-center justify-between gap-4 border-b border-line bg-white/90 px-4 backdrop-blur sm:px-8">
          <button onClick={() => setDrawer(true)} aria-label="Open menu" className="rounded-md p-1.5 text-ink-soft hover:bg-surface lg:hidden">
            <Menu size={20} />
          </button>
          <span className="lg:hidden">
            <Logo />
          </span>
          <span className="hidden lg:block" />
          <UserMenu />
        </header>
        <main className="mx-auto max-w-[1240px] px-4 py-8 sm:px-8">{children}</main>
      </div>
    </div>
  );
}
