"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Upload, Table, History, TreePine } from "lucide-react";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/subir", label: "Subir SIGFE", icon: Upload },
  { href: "/balance", label: "Balance Mensual", icon: Table },
  { href: "/historico", label: "Histórico", icon: History },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 bg-emerald-900 text-white flex flex-col shrink-0">
      <div className="p-6 border-b border-emerald-800">
        <div className="flex items-center gap-3">
          <TreePine className="w-8 h-8 text-emerald-300" />
          <div>
            <h1 className="font-bold text-lg leading-tight">Balance CONAF</h1>
            <p className="text-emerald-300 text-xs">Región de Los Ríos</p>
          </div>
        </div>
      </div>
      <nav className="flex-1 p-4 space-y-1">
        {NAV.map(({ href, label, icon: Icon }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors",
                active
                  ? "bg-emerald-700 text-white"
                  : "text-emerald-200 hover:bg-emerald-800 hover:text-white"
              )}
            >
              <Icon className="w-5 h-5" />
              {label}
            </Link>
          );
        })}
      </nav>
      <div className="p-4 border-t border-emerald-800 text-emerald-400 text-xs">
        DEFA — Depto. Finanzas y Admin.
      </div>
    </aside>
  );
}
