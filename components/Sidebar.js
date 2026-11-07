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

export default function Sidebar({ open, pathname, onNavigate }) {
  return (
    <aside
      className={`fixed inset-y-0 left-0 z-40 flex w-64 flex-col bg-vendora-dark text-white transition-transform md:static md:translate-x-0 ${
        open ? "translate-x-0" : "-translate-x-full"
      }`}
    >
      <div className="flex items-center gap-3 border-b border-white/10 px-5 py-5">
        <Logo className="h-10 w-10 shrink-0" decorative />
        <div>
          <p className="text-sm font-semibold tracking-[0.16em]">VENDORA</p>
          <p className="mt-1 text-xs leading-4 text-vendora-accent">
            Smarter Stock. Better Business.
          </p>
        </div>
      </div>

      <nav className="flex-1 space-y-1 px-3 py-4" aria-label="Main">
        {NAV_ITEMS.map((item) => {
          const active = pathname === item.href;

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              aria-current={active ? "page" : undefined}
              className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition ${
                active
                  ? "bg-white/10 font-medium text-white"
                  : "text-white/75 hover:bg-white/10 hover:text-white"
              }`}
            >
              <NavIcon href={item.href} />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
