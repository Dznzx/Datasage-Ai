import { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

type Tone = "sage" | "violet" | "amber" | "rose" | "neutral";

const tones: Record<Tone, string> = {
  sage: "bg-sage/10 text-sage border-sage/30",
  violet: "bg-signal-violet/10 text-signal-violet border-signal-violet/30",
  amber: "bg-signal-amber/10 text-signal-amber border-signal-amber/30",
  rose: "bg-signal-rose/10 text-signal-rose border-signal-rose/30",
  neutral: "bg-white/5 text-ink-soft border-border",
};

export function Badge({
  className,
  tone = "neutral",
  ...props
}: HTMLAttributes<HTMLSpanElement> & { tone?: Tone }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium",
        tones[tone],
        className
      )}
      {...props}
    />
  );
}
