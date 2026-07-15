"use client";

import { useEffect } from "react";
import { PageContainer } from "@/components/layout/page-container";
import { ErrorState } from "@/components/shared/error-state";

export default function DashboardError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error("Dashboard rendering failed", { digest: error.digest });
  }, [error.digest]);

  return <PageContainer><ErrorState onRetry={reset} /></PageContainer>;
}
