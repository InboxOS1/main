import { Inbox } from "lucide-react";
import type { LucideIcon } from "lucide-react";

export function EmptyState({
  title,
  body,
  icon: Icon = Inbox,
}: {
  title: string;
  body: string;
  icon?: LucideIcon;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 rounded-md border border-dashed border-ink-line py-10 text-center">
      <Icon className="h-5 w-5 text-paper/30" />
      <p className="text-sm font-medium text-paper/70">{title}</p>
      <p className="max-w-xs text-xs text-paper/40">{body}</p>
    </div>
  );
}
