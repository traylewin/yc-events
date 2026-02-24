"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import db from "@/lib/instant";

const navItems = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/events", label: "Events" },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const { user, isLoading: authLoading } = db.useAuth();
  const email = user?.email ?? "";
  const { data, isLoading: queryLoading } = db.useQuery(
    email ? { users: { $: { where: { email } } } } : null
  );
  const profile = data?.users?.[0] ?? null;
  const isLoading = authLoading || queryLoading;

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-300 border-t-yc-orange" />
      </div>
    );
  }

  if (!user || profile?.isAdmin !== true) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <p className="text-lg font-medium text-gray-700">Access Denied</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen">
      <aside className="flex w-60 flex-col bg-gray-900">
        <div className="flex h-16 items-center px-4">
          <span className="rounded bg-yc-orange px-2 py-1 text-sm font-bold text-white">
            YC
          </span>
        </div>
        <nav className="flex-1 space-y-1 px-3 py-4">
          {navItems.map((item) => {
            const isActive =
              item.href === "/admin"
                ? pathname === "/admin"
                : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`block rounded-md px-3 py-2 text-sm font-medium ${
                  isActive
                    ? "bg-gray-800 text-white"
                    : "text-gray-300 hover:bg-gray-800 hover:text-white"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="border-t border-gray-700 p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-700 text-sm font-medium text-gray-300">
              {profile?.firstName?.[0] ?? email[0] ?? "?"}
            </div>
            <span className="truncate text-sm text-gray-400">
              {email}
            </span>
          </div>
        </div>
      </aside>
      <main className="flex-1 bg-gray-50">{children}</main>
    </div>
  );
}
