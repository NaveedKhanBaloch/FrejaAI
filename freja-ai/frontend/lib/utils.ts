import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function money(amount: number) {
  return new Intl.NumberFormat("sv-SE", { style: "currency", currency: "SEK" }).format(amount / 100);
}
