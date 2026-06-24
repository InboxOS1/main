"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Button, type ButtonProps } from "@/components/ui/button";
import { toast } from "sonner";

/** Fills {key} placeholders in a template string using fields from the API response. */
function formatMessage(template: string, data: Record<string, unknown>): string {
  return template.replace(/\{(\w+)\}/g, (_, key) => String(data?.[key] ?? 0));
}

export function ActionButton({
  endpoint,
  body,
  label,
  loadingLabel,
  successMessage = "Done.",
  icon,
  ...buttonProps
}: {
  endpoint: string;
  body?: Record<string, unknown>;
  label: string;
  loadingLabel?: string;
  /** Plain string, optionally with {fieldName} placeholders filled from the JSON response. */
  successMessage?: string;
  icon?: React.ReactNode;
} & Omit<ButtonProps, "onClick" | "children">) {
  const router = useRouter();
  const [loading, setLoading] = React.useState(false);

  async function run() {
    setLoading(true);
    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body ?? {}),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error ?? "Request failed.");
      toast.success(formatMessage(successMessage, data));
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button onClick={run} disabled={loading} {...buttonProps}>
      {icon}
      {loading ? (loadingLabel ?? "Working…") : label}
    </Button>
  );
}
