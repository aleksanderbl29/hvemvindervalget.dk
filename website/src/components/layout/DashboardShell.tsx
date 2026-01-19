"use client";

import { ReactNode, useEffect } from "react";
import { logClientEvent } from "@/lib/telemetry";

type DashboardShellProps = {
  children: ReactNode;
  sidebar?: ReactNode;
};

export function DashboardShell({ children, sidebar }: DashboardShellProps) {
  useEffect(() => {
    logClientEvent(
      "dashboard:mount",
      { pathname: window.location.pathname },
    );
  }, []);

  return (
    <div className="flex min-h-screen bg-slate-50 text-slate-900">
      {sidebar}
      <main className="flex-1 px-6 py-8 lg:px-10">{children}</main>
    </div>
  );
}

