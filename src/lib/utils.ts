import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Formats a relative "N days ago" / "today" string for contact + alert UI. */
export function daysAgo(timestampMs: number): string {
  const diffMs = Date.now() - timestampMs;
  const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (days <= 0) return "today";
  if (days === 1) return "1 day ago";
  return `${days} days ago`;
}

export function daysUntil(isoDate: string | null): number | null {
  if (!isoDate) return null;
  const target = new Date(isoDate + "T00:00:00").getTime();
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.round((target - today.getTime()) / (1000 * 60 * 60 * 24));
}

export function formatDeadlineLabel(isoDate: string | null): string {
  const n = daysUntil(isoDate);
  if (n === null) return "No deadline";
  if (n < 0) return "Past due";
  if (n === 0) return "Today";
  if (n === 1) return "Tomorrow";
  return `In ${n} days`;
}

export function initials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("");
}
