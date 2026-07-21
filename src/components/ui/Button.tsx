"use client";

import { clsx } from "clsx";
import type { ButtonHTMLAttributes } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
}

export function Button({ variant = "secondary", size = "md", className, ...props }: ButtonProps) {
  return (
    <button
      className={clsx(
        "inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-40",
        size === "sm" && "px-2.5 py-1.5 text-xs",
        size === "md" && "px-4 py-2 text-sm",
        size === "lg" && "px-6 py-3 text-base",
        variant === "primary" &&
          "bg-fuchsia-500 text-white hover:bg-fuchsia-400 shadow-[0_0_20px_-4px_rgba(217,70,239,0.6)]",
        variant === "secondary" && "bg-neutral-800 text-neutral-200 hover:bg-neutral-700",
        variant === "ghost" && "bg-transparent text-neutral-300 hover:bg-neutral-800",
        variant === "danger" && "bg-red-500/10 text-red-400 hover:bg-red-500/20",
        className,
      )}
      {...props}
    />
  );
}
