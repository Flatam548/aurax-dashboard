import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Image from "next/image";

const links = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/analytics", label: "Análises" },
];

const Sidebar = () => {
  const pathname = usePathname();
  return (
    <aside className="fixed left-0 top-0 h-full w-64 bg-[#18181b] border-r border-[#23272a] flex flex-col justify-between z-20">
      <div className="p-6">
        <Image src="/logo.png" alt="Logo" width={80} height={80} className="mx-auto mb-6 object-contain" />
        <nav className="flex flex-col gap-2">
          {links.map(link => (
            <Link
              key={link.href}
              href={link.href}
              className={`px-4 py-2 rounded-lg font-bold font-inter transition-all duration-200 flex items-center gap-2 text-base
                ${pathname.startsWith(link.href)
                  ? "bg-[#ccff00] text-[#23272a] shadow"
                  : "text-white hover:bg-[#23272a] hover:text-[#ccff00]"}
              `}
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </div>
      <div className="p-6 border-t border-[#23272a]">
        <button className="w-full border-2 border-[#ccff00] text-[#ccff00] py-2 rounded-lg font-bold font-inter transition hover:bg-[#ccff00] hover:text-[#23272a]">Logout</button>
      </div>
    </aside>
  );
};

export default Sidebar; 