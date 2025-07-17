import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/profile", label: "Perfil" },
  { href: "/tools", label: "Ferramentas" },
  { href: "/analytics", label: "Análises" },
  { href: "/account", label: "Conta" },
  { href: "/admin/overview", label: "Admin" },
];

const Sidebar = () => {
  const pathname = usePathname();
  return (
    <aside className="fixed left-0 top-0 h-full w-64 bg-[#1a1a2e] flex flex-col justify-between shadow-lg z-20">
      <div className="p-6">
        <div className="text-2xl font-bold text-[#a259ff] mb-8">Aurax</div>
        <nav className="flex flex-col gap-2">
          {links.map(link => (
            <Link
              key={link.href}
              href={link.href}
              className={`px-4 py-2 rounded-lg font-medium transition flex items-center gap-2 text-white hover:bg-[#23234a] ${pathname.startsWith(link.href) ? "bg-gradient-to-r from-[#a259ff] to-[#6a0dad] text-white" : ""}`}
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </div>
      <div className="p-6 border-t border-[#23234a]">
        {/* FooterUser placeholder */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-[#6a0dad]" />
          <div>
            <div className="text-white font-medium">Usuário</div>
            <button className="text-xs text-[#a259ff] hover:underline">Admin</button>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar; 