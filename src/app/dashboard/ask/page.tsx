import { MessageSquareText } from "lucide-react";
import { AskInboxPanel } from "@/components/dashboard/AskInboxPanel";

export default function AskInboxPage() {
  return (
    <div>
      <div className="mb-8 flex items-center gap-2">
        <MessageSquareText className="h-5 w-5 text-scope" />
        <h1 className="font-display text-2xl font-semibold tracking-tight">Ask Inbox</h1>
      </div>
      <div className="max-w-2xl">
        <AskInboxPanel />
      </div>
    </div>
  );
}
