import { Metadata } from "next";

export const metadata: Metadata = {
  title: {
    template: "%s | Conference Management",
    default: "Authentication | Conference Management",
  },
  description: "Sign in to your Conference Management account",
};

interface AuthLayoutProps {
  children: React.ReactNode;
}

export default function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {children}
    </div>
  );
}
