import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { daysAgo, initials } from "@/lib/utils";
import { Users } from "lucide-react";
import type { Contact } from "@/lib/types";

export function RelationshipAlerts({ contacts }: { contacts: Contact[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-4 w-4 text-scope" />
          Relationship Alerts
        </CardTitle>
        <CardDescription>You haven&apos;t replied to</CardDescription>
      </CardHeader>
      <CardContent>
        {contacts.length === 0 ? (
          <EmptyState
            icon={Users}
            title="You're all caught up"
            body="No important contact has gone quiet for more than 10 days."
          />
        ) : (
          <ul className="space-y-3">
            {contacts.slice(0, 5).map((c) => (
              <li key={c.contactId} className="flex items-center gap-3">
                <Avatar className="h-8 w-8">
                  <AvatarFallback>{initials(c.name)}</AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{c.name}</p>
                  <p className="truncate text-xs text-paper/40">{c.company ?? c.email}</p>
                </div>
                <span className="shrink-0 font-mono text-xs text-alert">{daysAgo(c.lastContact)}</span>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
