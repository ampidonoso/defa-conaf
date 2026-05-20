import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCLP(amount: number): string {
  return new Intl.NumberFormat("es-CL", {
    style: "currency",
    currency: "CLP",
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatMillions(amount: number): string {
  const m = amount / 1_000_000;
  if (m >= 1) return `$${m.toFixed(1)}M`;
  const k = amount / 1_000;
  return `$${k.toFixed(0)}K`;
}

export function pctColor(pct: number): string {
  if (pct > 100) return "text-red-600 bg-red-50";
  if (pct > 90) return "text-amber-600 bg-amber-50";
  if (pct > 70) return "text-green-600 bg-green-50";
  return "text-blue-600 bg-blue-50";
}
