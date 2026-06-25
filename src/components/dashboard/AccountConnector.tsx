"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { daysAgo, initials } from "@/lib/utils";
import { Plus, RefreshCw, Unplug, Inbox } from "lucide-react";
import type { ConnectedAccount } from "@/lib/types";
import { toast } from "sonner";

const STATUS_VARIANT: Record<ConnectedAccount["status"], "default" | "scope" | "alert" | "muted"> = {
  connected: "scope",
  syncing: "default",
  needs_reauth: "alert",
  error: "alert",
};

export function AccountConnector({ accounts }: { accounts: ConnectedAccount[] }) {
  const router = useRouter();
  const [pending, setPending] = React.useState<Record<string, "sync" | "disconnect" | undefined>>({});

  async function handleSync(accountId: string) {
    setPending((p) => ({ ...p, [accountId]: "sync" }));
    try {
      const res = await fetch("/api/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accountId }),
      });
      if (!res.ok) throw new Error((await res.json().catch(() => null))?.error ?? "Sync failed.");
      const data = await res.json();
      const message = data.quotaExhausted
        ? `Synced ${data.newEmails ?? 0} new emails, analyzed ${data.analyzed ?? 0} before hitting your Gemini API quota. Sync again later to continue.`
        : `Synced ${data.newEmails ?? 0} new emails, analyzed ${data.analyzed ?? 0}.`;
      toast.success(message);
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Sync failed.");
    } finally {
      setPending((p) => ({ ...p, [accountId]: undefined }));
    }
  }

  async function handleDisconnect(accountId: string) {
    setPending((p) => ({ ...p, [accountId]: "disconnect" }));
    try {
      const res = await fetch("/api/gmail/disconnect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accountId }),
      });
      if (!res.ok) throw new Error("Could not disconnect this inbox.");
      toast.success("Inbox disconnected.");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Disconnect failed.");
    } finally {
      setPending((p) => ({ ...p, [accountId]: undefined }));
    }
  }

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <div>
          <CardTitle className="flex items-center gap-2">
            <Inbox className="h-4 w-4 text-signal" />
            Connected inboxes
          </CardTitle>
          <CardDescription>Unlimited Gmail accounts, one Google sign-in per inbox</CardDescription>
        </div>
        <Button asChild size="sm" variant="secondary">
          <a href="/api/gmail/connect">
            <Plus className="h-4 w-4" />
            Add Gmail account
          </a>
        </Button>
      </CardHeader>
      <CardContent>
        {accounts.length === 0 ? (
          <EmptyState title="Connect your first inbox" body="Add a Gmail account to start scanning for opportunities." />
        ) : (
          <ul className="space-y-2">
            {accounts.map((acc) => (
              <li
                key={acc.accountId}
                className="flex items-center gap-3 rounded-md border border-ink-line/60 bg-ink px-4 py-3"
              >
                <Avatar className="h-9 w-9">
                  {acc.photoURL && <AvatarImage src={acc.photoURL} alt={acc.email} referrerPolicy="no-referrer" />}
                  <AvatarFallback>{initials(acc.displayName || acc.email)}</AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{acc.email}</p>
                  <p className="truncate text-xs text-paper/40">
                    {acc.lastSync ? `Last synced ${daysAgo(acc.lastSync)}` : "Never synced"}
                    {acc.lastError ? ` · ${acc.lastError}` : ""}
                  </p>
                </div>
                <Badge variant={STATUS_VARIANT[acc.status]} className="hidden sm:inline-flex">
                  {acc.status.replace("_", " ")}
                </Badge>
                <Button
                  size="icon"
                  variant="ghost"
                  disabled={Boolean(pending[acc.accountId])}
                  onClick={() => handleSync(acc.accountId)}
                  title="Sync now"
                >
                  <RefreshCw className={`h-4 w-4 ${pending[acc.accountId] === "sync" ? "animate-spin" : ""}`} />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  disabled={Boolean(pending[acc.accountId])}
                  onClick={() => handleDisconnect(acc.accountId)}
                  title="Disconnect"
                  className="hover:text-alert"
                >
                  <Unplug className="h-4 w-4" />
                </Button>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
