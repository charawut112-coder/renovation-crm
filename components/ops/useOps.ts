"use client";

import { useCallback, useEffect, useState } from "react";
import type { OpsView } from "@/lib/ops";
import { loadOpsView } from "@/lib/opsStore";

export function useOps() {
  const [view, setView] = useState<OpsView | null>(null);
  const reload = useCallback(() => {
    setView(loadOpsView());
  }, []);
  useEffect(() => {
    reload();
  }, [reload]);
  return { view, reload };
}
