import Link from "next/link";
import type { ComponentPropsWithoutRef, ReactNode } from "react";

type ButtonProps = {
  children: ReactNode;
  href?: string;
  variant?: "primary" | "secondary" | "ghost";
  className?: string;
} & ComponentPropsWithoutRef<"button">;

const variants = {
  primary:
    "bg-[linear-gradient(135deg,#E2B4C1_0%,#D38C9D_42%,#A55166_100%)] text-white shadow-[0_14px_28px_rgba(211,140,157,0.3),inset_0_1px_0_rgba(255,255,255,0.32)] hover:shadow-[0_18px_38px_rgba(211,140,157,0.4),inset_0_1px_0_rgba(255,255,255,0.36)] focus-visible:ring-[#D5A84F]",
  secondary:
    "border border-[#f2c8d5] bg-[#fff9f5]/94 text-[#8f4968] shadow-[0_10px_22px_rgba(211,140,157,0.14),inset_0_1px_0_rgba(255,255,255,0.85)] hover:bg-[#FBE6EE] hover:text-[#A55166] focus-visible:ring-[#D5A84F]",
  ghost: "text-[#8f4968] hover:bg-white/78 hover:text-[#A55166] focus-visible:ring-[#D5A84F]",
};

export function Button({
  children,
  href,
  variant = "primary",
  className = "",
  ...buttonProps
}: ButtonProps) {
  const classes = `inline-flex min-h-11 items-center justify-center rounded-full px-6 py-2 text-sm font-semibold outline-none transition hover:-translate-y-0.5 focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-[#fff8fb] ${variants[variant]} ${className}`;

  if (href) {
    return (
      <Link href={href} className={classes}>
        {children}
      </Link>
    );
  }

  return (
    <button className={classes} {...buttonProps}>
      {children}
    </button>
  );
}
