"use client";
import React from "react";

export default function SidebarLayout({
  sidebar,
  children,
}: {
  sidebar: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="mx-auto max-w-6xl px-4 py-6">
      <div className="grid grid-cols-1 gap-6 md:grid-cols-[260px_1fr]">
        <aside className="rounded-2xl border bg-white p-4 shadow-sm">{sidebar}</aside>
        <main className="rounded-2xl border bg-white p-5 shadow-sm">{children}</main>
      </div>
    </div>
  );
}