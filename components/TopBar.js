"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";

function initials(name) {
  if (!name || typeof name !== "string") {
    return "";
  }

  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || "")
    .join("");
}

export default function TopBar({ title, user, menuOpen, onMenu, onLogout }) {
  const pathname = usePathname();
  const menuRef = useRef(null);
  const [profileOpen, setProfileOpen] = useState(false);
  const name = user?.name || "Signed in";
  const email = user?.email || "";
  const letters = initials(user?.name);

  useEffect(() => {
    setProfileOpen(false);
  }, [pathname]);

  useEffect(() => {
    function handlePointerDown(event) {
      if (!menuRef.current?.contains(event.target)) {
        setProfileOpen(false);
      }
    }

    function handleKeyDown(event) {
      if (event.key === "Escape") {
        setProfileOpen(false);
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  return (
    <header className="sticky top-0 z-20 flex items-center gap-3 border-b border-vendora/10 bg-white/95 px-4 py-3 backdrop-blur sm:px-6">
      <button
        type="button"
        className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-vendora/15 text-vendora md:hidden"
        aria-label={menuOpen ? "Close menu" : "Open menu"}
        aria-expanded={menuOpen}
        onClick={onMenu}
      >
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
          {menuOpen ? (
            <path d="M6 6l12 12M18 6 6 18" />
          ) : (
            <path d="M4 7h16M4 12h16M4 17h16" />
          )}
        </svg>
      </button>

      <h1 className="min-w-0 flex-1 truncate text-lg font-semibold text-vendora-text sm:text-xl">
        {title}
      </h1>

      <div className="relative" ref={menuRef}>
        <button
          type="button"
          className="flex h-10 w-10 items-center justify-center rounded-full bg-vendora text-sm font-semibold text-white ring-vendora-accent transition hover:bg-vendora-dark focus:outline-none focus:ring-2 focus:ring-offset-2"
          aria-label="Open profile"
          aria-haspopup="menu"
          aria-expanded={profileOpen}
          onClick={() => setProfileOpen((open) => !open)}
        >
          {letters || (
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
              <circle cx="12" cy="8" r="3" />
              <path d="M5 19c1.2-3 3.6-4.5 7-4.5S17.8 16 19 19" />
            </svg>
          )}
        </button>

        {profileOpen ? (
          <div
            role="menu"
            className="absolute right-0 z-30 mt-2 w-60 rounded-2xl border border-vendora/10 bg-white p-3 shadow-lg"
          >
            <div className="flex items-center gap-3 px-1">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-vendora-bg text-sm font-semibold text-vendora">
                {letters || "?"}
              </span>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-vendora-text">{name}</p>
                {email ? <p className="truncate text-xs text-vendora-text/70">{email}</p> : null}
              </div>
            </div>
            <button
              type="button"
              role="menuitem"
              onClick={onLogout}
              className="mt-3 w-full rounded-xl bg-vendora px-3 py-2 text-sm font-medium text-white transition hover:bg-vendora-dark"
            >
              Logout
            </button>
          </div>
        ) : null}
      </div>
    </header>
  );
}
