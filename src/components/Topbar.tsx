import React from "react";

const Topbar = () => (
  <header className="sticky top-0 z-10 bg-[#23234a] flex items-center justify-between px-8 py-4 shadow-sm ml-64">
    <input
      type="text"
      placeholder="Buscar ofertas..."
      className="bg-[#1a1a2e] text-white px-4 py-2 rounded-lg w-72 focus:outline-none focus:ring-2 focus:ring-[#a259ff]"
    />
    <div className="flex gap-6">
      <div className="text-white">Ofertas: <span className="font-bold">12</span></div>
      <div className="text-white">Selecionadas: <span className="font-bold">3</span></div>
      <div className="text-white">Limite: <span className="font-bold">5/5 usos</span></div>
      <div className="text-white">Reset em <span className="font-bold">7h 4m</span></div>
    </div>
  </header>
);

export default Topbar; 