import { forwardRef, useId, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes, type TextareaHTMLAttributes } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/cn";

const control =
  "rounded-md border bg-white px-3 text-sm text-ink placeholder:text-faint transition-colors " +
  "border-line-strong hover:border-faint focus:border-brand focus:outline-none focus:ring-3 focus:ring-brand/15 " +
  "disabled:bg-surface disabled:text-muted aria-invalid:border-danger aria-invalid:focus:ring-danger/15";

/** Full width unless the caller sets its own width class. */
const width = (className?: string) => (/(^|\s)(w-|min-w-)/.test(className ?? "") ? "" : "w-full");

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(function Input(
  { className, ...props },
  ref,
) {
  return <input ref={ref} className={cn(control, width(className), "h-9", className)} {...props} />;
});

export const Select = forwardRef<HTMLSelectElement, SelectHTMLAttributes<HTMLSelectElement>>(function Select(
  { className, children, ...props },
  ref,
) {
  // width classes size the wrapper; everything else styles the select
  const parts = (className ?? "").split(/\s+/).filter(Boolean);
  const sizing = parts.filter((c) => /^(min-)?w-/.test(c)).join(" ");
  const rest = parts.filter((c) => !/^(min-)?w-/.test(c)).join(" ");
  return (
    <span className={cn("relative inline-flex", sizing || "w-full")}>
      <select ref={ref} className={cn(control, "h-9 w-full appearance-none pr-9", rest)} {...props}>
        {children}
      </select>
      <ChevronDown aria-hidden size={15} className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-muted" />
    </span>
  );
});

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement>>(function Textarea(
  { className, ...props },
  ref,
) {
  return <textarea ref={ref} className={cn(control, "min-h-20 w-full py-2", className)} {...props} />;
});

interface FieldProps {
  label: string;
  hint?: string;
  error?: string;
  required?: boolean;
  className?: string;
  children: (id: string, describedBy?: string) => ReactNode;
}

/** Label + control + hint/error, wired up for screen readers. */
export function Field({ label, hint, error, required, className, children }: FieldProps) {
  const id = useId();
  const msgId = `${id}-msg`;
  const message = error ?? hint;
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <label htmlFor={id} className="text-[13px] font-medium text-ink-soft">
        {label}
        {required && <span className="ml-0.5 text-danger" aria-hidden>*</span>}
      </label>
      {children(id, message ? msgId : undefined)}
      {message && (
        <p id={msgId} className={cn("text-xs", error ? "text-danger" : "text-muted")}>
          {message}
        </p>
      )}
    </div>
  );
}
