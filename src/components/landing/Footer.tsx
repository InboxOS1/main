import { Radar } from "lucide-react";

export function Footer() {
  return (
    <footer className="py-10">
      <div className="container flex flex-col items-center justify-between gap-4 text-sm text-paper/40 sm:flex-row">
        <div className="flex items-center gap-2 font-display text-paper/70">
          <Radar className="h-4 w-4 text-signal" />
          InboxOS
        </div>
        <p>Built for founders running more inboxes than they can read.</p>
      </div>
    </footer>
  );
}
