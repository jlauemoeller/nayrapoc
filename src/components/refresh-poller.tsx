"use client";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

type RefreshPollerProps = {
  active: boolean;
  intervalMs?: number;
};

export function RefreshPoller({ active, intervalMs = 2000 }: RefreshPollerProps) {
  const router = useRouter();

  useEffect(() => {
    if (!active) return;

    const id = setInterval(() => router.refresh(), intervalMs);
    return () => clearInterval(id);
  }, [active, intervalMs, router]);

  return null;
}
