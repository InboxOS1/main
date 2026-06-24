import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { daysAgo, initials } from "@/lib/utils";
import type { Contact } from "@/lib/types";

export function ContactCard({ contact }: { contact: Contact }) {
  return (
    <Card>
      <CardContent className="flex gap-4 p-5">
        <Avatar className="h-11 w-11">
          <AvatarFallback>{initials(contact.name)}</AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <p className="truncate font-medium">{contact.name}</p>
            <span className="shrink-0 font-mono text-xs text-paper/40">{daysAgo(contact.lastContact)}</span>
          </div>
          <p className="truncate text-xs text-paper/40">{contact.company ?? contact.email}</p>
          <p className="mt-2 text-sm text-paper/70">{contact.notes}</p>
          <p className="mt-1 text-xs text-scope">→ {contact.suggestedAction}</p>
          <div className="mt-3 flex items-center gap-2">
            <Progress value={contact.relationshipScore} className="h-1" />
            <span className="font-mono text-[10px] text-paper/30">{contact.relationshipScore}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
