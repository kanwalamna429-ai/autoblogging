import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function extractExcerpt(html: string, maxLength = 200): string {
  const text = html.replace(/<[^>]*>/g, "").replace(/&[a-z]+;/gi, " ").trim();
  return text.length > maxLength ? text.slice(0, maxLength) + "..." : text;
}

export function formatDate(dateString: string): string {
  try {
    return new Intl.DateTimeFormat("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(dateString));
  } catch {
    return dateString;
  }
}

export function truncate(str: string, length: number): string {
  return str.length > length ? str.slice(0, length) + "..." : str;
}
