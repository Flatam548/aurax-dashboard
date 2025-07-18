import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/analytics", label: "Análises" },
];

const Sidebar = () => {
  const pathname = usePathname();
  return (
    <aside className="fixed left-0 top-0 h-full w-64 bg-[#232046] border-r-2 border-[#A3FFD6] shadow-[0_0_24px_#00FFD0] flex flex-col justify-between z-20">
      <div className="p-6">
        <img src="/logo.png" alt="Logo" className="h-12 mb-6" />
        <nav className="flex flex-col gap-2">
          {links.map(link => (
            <Link
              key={link.href}
              href={link.href}
              className={`px-4 py-2 rounded-lg font-medium font-orbitron transition-all duration-200 flex items-center gap-2 text-[#F3F3F3] hover:bg-gradient-to-r hover:from-[#7C3AED] hover:to-[#00FFD0] hover:text-[#18122B] ${pathname.startsWith(link.href) ? "bg-gradient-to-r from-[#7C3AED] to-[#00FFD0] text-[#18122B] scale-105" : ""}`}
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </div>
      <div className="p-6 border-t-2 border-[#A3FFD6]">
        {/* FooterUser placeholder */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-r from-[#7C3AED] to-[#00FFD0]" />
          <div>
            <div className="font-orbitron text-[#F3F3F3]">Usuário</div>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar; 