"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { DEMO_PASSWORD } from "@/lib/sample-data";
import { ROLE_LABEL, ROLE_SUMMARY } from "@/lib/roles";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/form";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Logo } from "@/components/shell/logo";

function nextPath(): string {
  const next = new URLSearchParams(window.location.search).get("next");
  return next && next.startsWith("/") && !next.startsWith("//") ? next : "/clients";
}

export default function LoginPage() {
  const { user, ready, users, signIn } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (ready && user) router.replace(nextPath());
  }, [ready, user, router]);

  function submit(e: FormEvent) {
    e.preventDefault();
    if (!email.trim() || !password) {
      setError("Enter your work email and password.");
      return;
    }
    const err = signIn(email, password);
    setError(err);
  }

  // one demo account per role
  const demo = (["adviser", "operations", "admin"] as const).map((role) => users.find((u) => u.role === role)!);

  return (
    <div className="grid min-h-screen bg-white lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)]">
      <div className="flex flex-col px-6 py-8 sm:px-12">
        <Logo />
        <div className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center py-12">
          <h1 className="text-2xl font-semibold tracking-[-0.015em] text-ink">Sign in</h1>
          <p className="mt-1.5 text-sm text-muted">Use your firm account to open your client plans.</p>

          <form onSubmit={submit} noValidate className="mt-8 flex flex-col gap-4">
            <Field label="Work email">
              {(id) => (
                <Input
                  id={id}
                  type="email"
                  autoComplete="username"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  aria-invalid={!!error}
                  placeholder="name@firm.in"
                  autoFocus
                />
              )}
            </Field>
            <Field label="Password">
              {(id) => (
                <div className="relative">
                  <Input
                    id={id}
                    type={show ? "text" : "password"}
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    aria-invalid={!!error}
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShow((s) => !s)}
                    aria-label={show ? "Hide password" : "Show password"}
                    className="absolute top-1/2 right-2 -translate-y-1/2 rounded p-1 text-muted hover:text-ink"
                  >
                    {show ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              )}
            </Field>
            {error && (
              <p role="alert" className="rounded-md bg-danger-50 px-3 py-2 text-[13px] text-danger">
                {error}
              </p>
            )}
            <Button type="submit" className="mt-2 h-10 w-full">
              Sign in
            </Button>
          </form>

          <div className="mt-10">
            <p className="text-[13px] font-medium text-ink-soft">Try a demo account</p>
            <p className="mt-0.5 text-xs text-muted">Each one shows what that role can see. Password: {DEMO_PASSWORD}</p>
            <div className="mt-3 flex flex-col gap-2">
              {demo.map((u) => (
                <button
                  key={u.id}
                  type="button"
                  onClick={() => {
                    setEmail(u.email);
                    setPassword(DEMO_PASSWORD);
                    setError(null);
                  }}
                  className="flex items-center gap-3 rounded-md border border-line px-3 py-2.5 text-left transition-colors hover:border-brand-100 hover:bg-brand-50/50"
                >
                  <Avatar name={u.fullName} />
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-2 text-[13px] font-medium text-ink">
                      {u.fullName}
                      <Badge tone={u.role === "admin" ? "brand" : u.role === "operations" ? "warn" : "neutral"}>{ROLE_LABEL[u.role]}</Badge>
                    </span>
                    <span className="block truncate text-xs text-muted">{ROLE_SUMMARY[u.role]}</span>
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <aside className="relative hidden overflow-hidden border-l border-line bg-surface lg:flex lg:flex-col lg:justify-center lg:px-16">
        <p className="max-w-md text-[28px] leading-[1.25] font-semibold tracking-[-0.02em] text-ink">
          Every goal, every investment and every year of a family&apos;s plan, on one screen.
        </p>
        <LifelinePreview />
      </aside>
    </div>
  );
}

/** Decorative preview of the household life line used on client profiles. */
function LifelinePreview() {
  const people = [
    { name: "Rahul", age: 41, retire: 55, life: 85 },
    { name: "Neha", age: 38, retire: 55, life: 85 },
    { name: "Aarav", age: 12, retire: undefined, life: 85 },
  ];
  return (
    <div aria-hidden className="mt-12 max-w-md rounded-lg border border-line bg-white p-5">
      <div className="flex flex-col gap-4">
        {people.map((p) => (
          <div key={p.name} className="grid grid-cols-[56px_1fr] items-center gap-3">
            <span className="text-[13px] font-medium text-ink-soft">{p.name}</span>
            <div className="relative h-2 rounded-full bg-line/70">
              <div className="absolute inset-y-0 left-0 rounded-full bg-ink/80" style={{ width: `${p.age}%` }} />
              {p.retire && (
                <div className="absolute -top-1 h-4 w-0.5 rounded bg-brand" style={{ left: `${p.retire}%` }} />
              )}
              <div className="absolute -top-0.5 size-3 rounded-full border-2 border-faint bg-white" style={{ left: `calc(${p.life}% - 6px)` }} />
            </div>
          </div>
        ))}
      </div>
      <div className="mt-4 flex gap-4 text-xs text-muted">
        <span className="flex items-center gap-1.5"><span className="h-1.5 w-4 rounded-full bg-ink/80" />Age today</span>
        <span className="flex items-center gap-1.5"><span className="h-3 w-0.5 rounded bg-brand" />Retirement</span>
        <span className="flex items-center gap-1.5"><span className="size-2.5 rounded-full border-2 border-faint" />Life expectancy</span>
      </div>
    </div>
  );
}
