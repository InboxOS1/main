"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Radar,
  LayoutDashboard,
  Target,
  CalendarClock,
  Users,
  MessageSquareText,
  Inbox,
  Sunrise,
  LogOut,
} from "lucide-react";
import { cn, initials } from "@/lib/utils";
import { useAuth } from "@/components/providers/AuthProvider";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import type { InboxUser } from "@/lib/types";

const NAV = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
  { href: "/dashboard/opportunities", label: "Opportunities", icon: Target },
  { href: "/dashboard/deadlines", label: "Deadlines", icon: CalendarClock },
  { href: "/dashboard/contacts", label: "Contacts", icon: Users },
  { href: "/dashboard/ask", label: "Ask Inbox", icon: MessageSquareText },
  { href: "/dashboard/briefs", label: "Daily Briefs", icon: Sunrise },
  { href: "/dashboard/accounts", label: "Inboxes", icon: Inbox },
];

export function Sidebar({ user }: { user: InboxUser }) {
  const pathname = usePathname();
  const { signOut } = useAuth();

  return (
    <aside className="hidden w-60 flex-col border-r border-ink-line/70 bg-ink-raised/40 md:flex">
      <div className="flex h-16 items-center gap-2 border-b border-ink-line/70 px-5 font-display text-lg font-semibold">
        <Radar className="h-5 w-5 text-signal" />
        InboxOS
      </div>

      <nav className="flex-1 space-y-1 p-3">
        {NAV.map((item) => {
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
                active ? "bg-ink text-signal" : "text-paper/60 hover:bg-ink hover:text-paper"
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-ink-line/70 p-3">
        <div className="flex items-center justify-between rounded-md px-3 py-2">
          <div className="flex min-w-0 items-center gap-2.5">
            <Avatar className="h-8 w-8">
              {user.photoURL && <AvatarImage src={user.photoURL} alt={user.name} referrerPolicy="no-referrer" />}
              <AvatarFallback>{initials(user.name)}</AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <p className="truncate text-sm font-medium">{user.name}</p>
              <p className="truncate text-xs text-paper/40">{user.email}</p>
            </div>
          </div>
          <button onClick={signOut} title="Sign out" className="text-paper/40 hover:text-alert">
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}
