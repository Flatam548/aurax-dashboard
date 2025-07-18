import React from "react";

const Topbar = () => (
  <header className="sticky top-0 z-10 bg-white border-b border-[#e5e7eb] flex items-center justify-between px-8 py-4 ml-64">
    <input
      type="text"
      placeholder="Buscar ofertas..."
      className="bg-[#f3f4f6] text-[#18181b] px-4 py-2 rounded-lg w-72 font-inter focus:outline-none focus:ring-2 focus:ring-[#2563eb] focus:border-[#2563eb] transition-all duration-200"
    />
    <div className="flex gap-6 items-center">
      <span className="font-bold text-[#2563eb] font-inter">Usuário</span>
      <img src="/avatar.png" className="w-8 h-8 rounded-full border-2 border-[#2563eb]" alt="Avatar" />
    </div>
  </header>
);

export default Topbar; 