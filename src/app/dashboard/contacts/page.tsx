import { getCurrentUser } from "@/lib/session";
import { getAllContacts } from "@/lib/contacts/intelligence";
import { ContactCard } from "@/components/dashboard/ContactCard";
import { ActionButton } from "@/components/dashboard/ActionButton";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { Users, RefreshCw } from "lucide-react";

export default async function ContactsPage() {
  const user = await getCurrentUser();
  if (!user) return null;

  const contacts = await getAllContacts(user.uid);

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Users className="h-5 w-5 text-scope" />
          <h1 className="font-display text-2xl font-semibold tracking-tight">Contacts</h1>
        </div>
        <ActionButton
          endpoint="/api/contacts/refresh"
          label="Refresh contacts"
          loadingLabel="Analyzing relationships…"
          successMessage="Updated {contactsUpdated} contacts."
          icon={<RefreshCw className="h-4 w-4" />}
          variant="secondary"
          size="sm"
        />
      </div>

      {contacts.length === 0 ? (
        <Card>
          <CardContent className="p-10">
            <EmptyState
              icon={Users}
              title="No contact profiles yet"
              body="Sync an inbox, then refresh contacts to build relationship profiles from your email history."
            />
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {contacts.map((c) => (
            <ContactCard key={c.contactId} contact={c} />
          ))}
        </div>
      )}
    </div>
  );
}
