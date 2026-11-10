"use client";

import Link from "next/link";
import Logo from "./Logo";
import { NAV_ITEMS } from "../lib/navigation";

const ICONS = {
  "/dashboard": (
    <path d="M4 10.5 12 4l8 6.5V20a1 1 0 0 1-1 1h-5v-6H10v6H5a1 1 0 0 1-1-1v-9.5Z" />
  ),
  "/products": (
    <path d="M4 7.5 12 4l8 3.5v9L12 20l-8-3.5v-9Zm8 4.2 7.2-3.2M12 11.7V19.2M12 11.7 4.8 8.5" />
  ),
  "/suppliers": (
    <path d="M8 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6Zm8 1a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5ZM3.5 19c.4-2.4 2.3-4 4.5-4s4.1 1.6 4.5 4M13 15.2c.7-.4 1.6-.7 2.6-.7 1.8 0 3.3 1.2 3.8 3" />
  ),
  "/customers": (
    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm13 10v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
  ),
  "/purchases": (
    <path d="M6 7h12l-1 12H7L6 7Zm3 0V5.5A2.5 2.5 0 0 1 11.5 3h1A2.5 2.5 0 0 1 15 5.5V7" />
  ),
  "/sales": (
    <path d="M4 16.5 9 11l3.5 3.5L20 7M14 7h6v6" />
  ),
  "/expenses": (
    <path d="M5 7.5h14v10.5a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V7.5Zm0 3.5h14M8 5.5h8" />
  ),
  "/reports": (
    <path d="M3 3v18h18M7 16l4-4 4 4 4-4" />
  ),
  "/inventory-alerts": (
    <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3ZM12 9v4M12 17h.01" />
  ),
};

function NavIcon({ href }) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className="h-5 w-5 shrink-0"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {ICONS[href]}
    </svg>
  );
}

function initials(name) {
  if (!name || typeof name !== "string") return "A";
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || "")
    .join("");
}

export default function Sidebar({ open, pathname, onNavigate, user, onLogout }) {
  const name = user?.name || "Admin";
  const email = user?.email || "admin@example.com";
  const userInitials = initials(user?.name);

  return (
    <aside
      className={`fixed inset-y-0 left-0 z-40 flex w-64 flex-col bg-slate-900 border-r border-slate-800 text-white transition-transform duration-200 md:static md:translate-x-0 ${
        open ? "translate-x-0" : "-translate-x-full"
      }`}
    >
      {/* Brand Header */}
      <div className="flex items-center gap-3.5 border-b border-slate-800/80 px-5 py-5">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-800/80 p-1 shadow-inner">
          <Logo className="h-8 w-8" decorative />
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="font-bold tracking-tight text-white text-base">VENDORA</span>
            <span className="rounded-md bg-blue-500/10 px-1.5 py-0.5 text-[9px] font-bold text-blue-400">PRO</span>
          </div>
          <p className="truncate text-xs font-medium text-slate-400">
            Wholesale Distributor
          </p>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 space-y-1 overflow-y-auto px-3.5 py-4" aria-label="Main">
        <p className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
          Main Menu
        </p>
        {NAV_ITEMS.map((item) => {
          const active = pathname === item.href;

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              aria-current={active ? "page" : undefined}
              className={`group flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium transition-all duration-150 ${
                active
                  ? "bg-blue-600 font-semibold text-white shadow-md shadow-blue-600/30"
                  : "text-slate-300 hover:bg-slate-800/60 hover:text-white"
              }`}
            >
              <span
                className={`transition-transform duration-150 group-hover:scale-105 ${
                  active ? "text-white" : "text-slate-400 group-hover:text-white"
                }`}
              >
                <NavIcon href={item.href} />
              </span>
              <span className="truncate">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* User Footer Profile & Logout */}
      <div className="border-t border-slate-800/90 p-3.5">
        <div className="flex items-center justify-between rounded-xl bg-slate-800/40 p-2.5 hover:bg-slate-800/70 transition">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-600 text-xs font-bold text-white shadow-sm">
              {userInitials}
            </div>
            <div className="min-w-0">
              <p className="truncate text-xs font-semibold text-white">{name}</p>
              <p className="truncate text-[10px] text-slate-400">{email}</p>
            </div>
          </div>
          {onLogout ? (
            <button
              type="button"
              onClick={onLogout}
              title="Logout"
              className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-700/60 hover:text-red-400 transition"
              aria-label="Logout"
            >
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" />
              </svg>
            </button>
          ) : null}
        </div>
      </div>
    </aside>
  );
}
