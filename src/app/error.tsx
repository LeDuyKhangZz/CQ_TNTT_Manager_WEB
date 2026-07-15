"use client";

import { useEffect } from "react";
import { ErrorState } from "@/components/shared/error-state";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Application rendering failed", { digest: error.digest });
  }, [error.digest]);

  return (
    <main className="flex min-h-screen items-center justify-center px-6">
      <ErrorState onRetry={reset} backHref="/login" />
    </main>
  );
}
