"use client";

import { useState } from "react";
import db from "@/lib/instant";
import LoginModal from "./LoginModal";
import Link from "next/link";

export default function Navbar({
  transparent = false,
}: {
  transparent?: boolean;
}) {
  const { isLoading, user } = db.useAuth();
  const [showLogin, setShowLogin] = useState(false);

  const email = user?.email ?? "";

  const { data: profileData } = db.useQuery(
    email ? { users: { $: { where: { email } } } } : null
  );
  const profile = profileData?.users?.[0];

  return (
    <>
      <nav
        className={`${
          transparent ? "absolute top-0 left-0 right-0 z-20" : "border-b border-gray-200 bg-white"
        } flex items-center justify-between px-6 py-4`}
      >
        <Link href="/" className="flex items-center gap-3">
          <div className="w-10 h-10 bg-yc-orange rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-xl">Y</span>
          </div>
          {!transparent && (
            <span className="font-semibold text-gray-900">YC Events</span>
          )}
        </Link>
        <div
          className={`flex items-center gap-3 text-sm ${
            transparent ? "text-white" : "text-gray-700"
          }`}
        >
          {isLoading ? null : user ? (
            <>
              <span>
                Welcome, {profile?.firstName || email.split("@")[0]}!
              </span>
              {profile?.isAdmin && (
                <Link
                  href="/admin"
                  className={`${
                    transparent
                      ? "text-white/80 hover:text-white"
                      : "text-yc-orange hover:text-orange-700"
                  } font-medium transition-colors`}
                >
                  Admin
                </Link>
              )}
              <span className={transparent ? "text-white/40" : "text-gray-300"}>
                ·
              </span>
              <button
                onClick={() => db.auth.signOut()}
                className={`${
                  transparent
                    ? "text-white/80 hover:text-white"
                    : "text-gray-500 hover:text-gray-700"
                } transition-colors`}
              >
                Sign out
              </button>
            </>
          ) : (
            <button
              onClick={() => setShowLogin(true)}
              className={`${
                transparent
                  ? "text-white/90 hover:text-white"
                  : "text-gray-700 hover:text-gray-900"
              } font-medium transition-colors`}
            >
              Sign in
            </button>
          )}
        </div>
      </nav>
      {showLogin && <LoginModal onClose={() => setShowLogin(false)} />}
    </>
  );
}
