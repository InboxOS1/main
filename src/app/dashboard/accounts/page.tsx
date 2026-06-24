import { getCurrentUser } from "@/lib/session";
import { getConnectedAccounts } from "@/lib/dashboard";
import { AccountConnector } from "@/components/dashboard/AccountConnector";
import { ActionButton } from "@/components/dashboard/ActionButton";
import { Inbox, RefreshCw } from "lucide-react";

export default async function AccountsPage() {
  const user = await getCurrentUser();
  if (!user) return null;

  const accounts = await getConnectedAccounts(user.uid);

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Inbox className="h-5 w-5 text-signal" />
          <h1 className="font-display text-2xl font-semibold tracking-tight">Inboxes</h1>
        </div>
        {accounts.length > 0 && (
          <ActionButton
            endpoint="/api/sync"
            body={{ all: true }}
            label="Sync all"
            loadingLabel="Syncing all inboxes…"
            successMessage="Synced {totalNewEmails} new emails across {accountsSynced} inboxes."
            icon={<RefreshCw className="h-4 w-4" />}
            variant="secondary"
            size="sm"
          />
        )}
      </div>

      <div className="max-w-2xl">
        <AccountConnector accounts={accounts} />
      </div>
    </div>
  );
}
