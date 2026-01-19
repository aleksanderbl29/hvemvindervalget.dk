import { ReactNode } from "react";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { Sidebar } from "@/components/layout/Sidebar";
import { TopBar } from "@/components/layout/TopBar";

export default function DashboardLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <DashboardShell sidebar={<Sidebar />}>
      <TopBar />
      {children}
    </DashboardShell>
  );
}

