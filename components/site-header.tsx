"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

const navLinks = [
  { href: "/", label: "Beranda" },
  { href: "/kiosk", label: "Kiosk" },
  { href: "/operator", label: "Operator" },
  { href: "/dashboard", label: "Dashboard" },
];

export function SiteHeader() {
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    function onChange() {
      setIsFullscreen(Boolean(document.fullscreenElement));
    }
    document.addEventListener("fullscreenchange", onChange);
    onChange();
    return () => document.removeEventListener("fullscreenchange", onChange);
  }, []);

  if (isFullscreen) return null;

  return (
    <header className="border-b border-slate-200 bg-white">
      <nav className="mx-auto flex max-w-6xl items-center gap-1 px-4 py-3">
        <Link
          href="/"
          className="mr-4 text-sm font-semibold tracking-tight text-slate-900"
        >
          Antrian Tiket
        </Link>
        {navLinks.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="rounded-md px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-100 hover:text-slate-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-500"
          >
            {link.label}
          </Link>
        ))}
      </nav>
    </header>
  );
}
