import React from "react";
import Image from "next/image";
import { FaSearch } from "react-icons/fa";

const Topbar = () => (
  <header className="w-full bg-white rounded-xl shadow flex items-center justify-between px-8 py-4 mb-8 max-w-7xl mx-auto">
    <div className="flex-1 flex justify-center">
      <div className="relative w-full max-w-xl">
        <input
          type="text"
          placeholder="Buscar ofertas..."
          className="w-full pl-10 pr-4 py-2 rounded-lg bg-[#f3f4f6] text-[#18181b] font-inter focus:outline-none focus:ring-2 focus:ring-[#2563eb]"
        />
        <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-[#2563eb] text-sm" />
      </div>
    </div>
    <div className="flex gap-4 items-center ml-8">
      <span className="font-bold text-[#2563eb] font-inter">Usuário</span>
      <div className="w-9 h-9 rounded-full border-2 border-[#2563eb] flex items-center justify-center overflow-hidden bg-white">
        <Image
          src="/avatar.png"
          alt="Avatar"
          width={36}
          height={36}
          className="object-cover w-9 h-9"
        />
      </div>
    </div>
  </header>
);

export default Topbar; 