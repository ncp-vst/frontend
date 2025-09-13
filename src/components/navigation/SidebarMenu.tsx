// src/components/navigation/SidebarMenu.tsx
"use client";
import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export type SidebarItem = {
  href: string;
  label: string;
  exact?: boolean;
  icon?: React.ReactNode;
};

export default function SidebarMenu({
  title,
  items,
  className = "",
}: {
  title?: string;
  items: SidebarItem[];
  className?: string;
}) {
  const pathname = usePathname();
  const normalize = (p: string) => (p !== "/" && p.endsWith("/")) ? p.replace(/\/+$/, "") : p;
  const current = normalize(pathname);

  return (
    <nav className={className} aria-label={title || "사이드 내비게이션"}>
      {title && <h2 className="mb-4 text-base font-semibold">{title}</h2>}
      <div className="space-y-2">
        {items.map(({ href, label, exact, icon }) => {
          const target = normalize(href);
          const active = exact ? current === target : (current === target || current.startsWith(target + "/"));

          const base =
            "block w-full rounded-xl px-3 py-2 text-center text-sm md:text-base transition";
          const inactive =
            "border text-gray-700 hover:bg-orange-50 hover:text-orange-600 hover:border-orange-300";
          const activeCls =
            "bg-orange-500 text-white border border-orange-500 hover:bg-orange-500 hover:text-white hover:border-orange-600";

          return (
            <Link
              key={href}
              href={href}
              aria-current={active ? "page" : undefined}
              className={[base, active ? activeCls : inactive].join(" ")}
            >
              <span className="inline-flex items-center justify-center gap-2">
                {icon}
                {label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
