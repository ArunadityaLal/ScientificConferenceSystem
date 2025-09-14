// src/app/(dashboard)/layout.tsx
import { Metadata } from "next";

export const metadata: Metadata = {
  title: {
    template: "%s | Dashboard | Conference Management",
    default: "Dashboard | Conference Management",
  },
  description: "Conference Management Dashboard",
};

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  return <>{children}</>;
}
