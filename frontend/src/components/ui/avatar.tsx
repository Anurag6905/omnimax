import { initials } from "@/lib/format";
import { cn } from "@/lib/cn";

// Calm, distinguishable fills; chosen by name so a person keeps the same colour.
const fills = ["bg-brand-50 text-brand", "bg-[#eaeef7] text-[#2b4a8b]", "bg-[#f3ecf6] text-[#6b3d82]", "bg-warn-50 text-warn", "bg-[#e9f2f7] text-[#1f5f7a]"];

export function Avatar({ name, size = "md", className }: { name: string; size?: "sm" | "md" | "lg"; className?: string }) {
  const n = [...name].reduce((a, c) => a + c.charCodeAt(0), 0) % fills.length;
  const dims = { sm: "size-7 text-[10px] tracking-tight", md: "size-8 text-xs", lg: "size-11 text-sm" }[size];
  return (
    <span aria-hidden className={cn("inline-flex shrink-0 items-center justify-center rounded-full font-semibold", fills[n], dims, className)}>
      {initials(name)}
    </span>
  );
}
