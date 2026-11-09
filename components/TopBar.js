"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";

import ThemeToggle from "./ThemeToggle";
import { SearchIcon } from "./Icons";

function initials(name) {
  if (!name || typeof name !== "string") return "";
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || "")
    .join("");
}

function BellIcon({ className = "h-5 w-5" }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <path d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V4a2 2 0 10-4 0v1.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
    </svg>
  );
}

export default function TopBar({ title, user, menuOpen, onMenu, onLogout }) {
  const pathname = usePathname();
  const menuRef = useRef(null);
  const [profileOpen, setProfileOpen] = useState(false);
  const [searchValue, setSearchValue] = useState("");
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
      if (event.key === "Escape") setProfileOpen(false);
    }
    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  return (
    <header className="sticky top-0 z-20 flex items-center gap-3 border-b border-vendora/10 bg-surface/95 px-4 py-2.5 backdrop-blur sm:px-6">
      {/* Mobile menu toggle */}
      <button
        type="button"
        className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-vendora/15 text-vendora md:hidden"
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

      {/* Search bar */}
      <div className="relative flex-1 max-w-sm">
        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-vendora-text/40">
          <SearchIcon className="h-4 w-4" />
        </div>
        <input
          type="search"
          value={searchValue}
          onChange={(e) => setSearchValue(e.target.value)}
          placeholder="Search products..."
          className="w-full rounded-xl border border-vendora/15 bg-vendora-bg/60 py-2 pl-9 pr-3 text-sm text-vendora-text outline-none transition placeholder:text-vendora-text/40 focus:border-vendora focus:bg-surface focus:ring-2 focus:ring-vendora-accent/20"
        />
      </div>

      {/* Right side controls */}
      <div className="ml-auto flex items-center gap-2">
        <ThemeToggle />

        {/* Bell / notification icon */}
        <button
          type="button"
          className="relative inline-flex h-9 w-9 items-center justify-center rounded-xl border border-vendora/15 text-vendora-text/70 transition hover:bg-vendora-bg hover:text-vendora"
          aria-label="Notifications"
        >
          <BellIcon className="h-5 w-5" />
        </button>

        {/* Avatar + dropdown */}
        <div className="relative" ref={menuRef}>
          <button
            type="button"
            className="flex h-9 w-9 items-center justify-center rounded-full bg-vendora text-sm font-semibold text-white ring-vendora-accent transition hover:bg-vendora-dark focus:outline-none focus:ring-2 focus:ring-offset-2"
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
              className="absolute right-0 z-30 mt-2 w-60 rounded-2xl border border-vendora/10 bg-surface p-3 shadow-lg"
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
      </div>
    </header>
  );
}
