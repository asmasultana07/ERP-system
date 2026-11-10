"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";

import { clearSession, getStoredUser, getToken } from "../lib/auth";
import { getPageTitle } from "../lib/navigation";
import Sidebar from "./Sidebar";
import TopBar from "./TopBar";

export default function AppShell({ children }) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState(null);
  const [ready, setReady] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    if (!getToken()) {
      router.replace("/");
      return;
    }

    setUser(getStoredUser());
    setReady(true);
  }, [router]);

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  function handleLogout() {
    clearSession();
    router.replace("/");
  }

  return (
    <div className="min-h-full bg-vendora-bg text-vendora-text md:flex">
      {!ready ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-vendora-bg text-vendora-text">
          Loading...
        </div>
      ) : null}
      {menuOpen ? (
        <button
          type="button"
          className="fixed inset-0 z-30 bg-vendora-dark/50 md:hidden"
          aria-label="Close menu"
          onClick={() => setMenuOpen(false)}
        />
      ) : null}

      <Sidebar
        open={menuOpen}
        pathname={pathname}
        onNavigate={() => setMenuOpen(false)}
        user={user}
        onLogout={handleLogout}
      />

      <div className="flex min-h-screen min-w-0 flex-1 flex-col">
        <TopBar
          title={getPageTitle(pathname)}
          user={user}
          menuOpen={menuOpen}
          onMenu={() => setMenuOpen((open) => !open)}
          onLogout={handleLogout}
        />
        <div className="flex-1 px-4 py-6 sm:px-6 lg:px-8">{children}</div>
      </div>
    </div>
  );
}
