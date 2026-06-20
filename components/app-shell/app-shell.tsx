"use client";

import { usePathname } from "next/navigation";
import { Sidebar } from "./sidebar";
import { TopBar } from "./top-bar";

/** Renders the sidebar + top bar around the app pages; the landing ("/") is bare. */
export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  if (pathname === "/") return <>{children}</>;

  return (
    <div className="min-h-screen">
      <Sidebar />
      <div className="flex min-h-screen flex-col pl-[248px]">
        <TopBar />
        <main className="flex flex-1 flex-col">{children}</main>
      </div>
    </div>
  );
}
