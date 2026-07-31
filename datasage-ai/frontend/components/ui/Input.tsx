import { InputHTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/utils";

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => (
    <input
      ref={ref}
      className={cn(
        "w-full rounded-xl border border-border bg-white/[0.03] px-4 py-2.5 text-sm text-ink placeholder:text-ink-muted outline-none transition-colors focus:border-sage/50",
        className
      )}
      {...props}
    />
  )
);
Input.displayName = "Input";
