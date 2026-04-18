import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

// helper to combine tailwind classes
export function cn(...inputs: any[]) {
  // merges and cleans up classes
  return twMerge(clsx(inputs));
}
