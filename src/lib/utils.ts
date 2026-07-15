import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/** Gộp class name có xử lý xung đột Tailwind (class sau thắng). */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
