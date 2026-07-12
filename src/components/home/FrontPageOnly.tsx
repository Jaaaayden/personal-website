"use client";

import { useSearchParams } from "next/navigation";

/**
 * Renders children only on the "front page" — the default work tab. Must be
 * used inside a <Suspense> boundary (useSearchParams requirement).
 */
export default function FrontPageOnly({
  children,
}: {
  children: React.ReactNode;
}) {
  const tab = useSearchParams().get("tab");
  return tab === null || tab === "work" ? <>{children}</> : null;
}
