import React from "react";

const Topbar = () => (
  <header className="sticky top-0 z-10 bg-[#232046] border-b-2 border-[#A3FFD6] shadow-[0_0_16px_#00FFD0] flex items-center justify-between px-8 py-4 ml-64">
    <input
      type="text"
      placeholder="Buscar ofertas..."
      className="bg-[#18122B] text-[#F3F3F3] px-4 py-2 rounded-lg w-72 font-orbitron focus:outline-none focus:ring-2 focus:ring-[#00FFD0] focus:border-[#7C3AED] transition-all duration-200"
    />
    <div className="flex gap-6">
      <div className="text-[#F3F3F3]">Ofertas: <span className="font-bold text-[#F9F871]">12</span></div>
      <div className="text-[#F3F3F3]">Selecionadas: <span className="font-bold text-[#00FFD0]">3</span></div>
      <div className="text-[#F3F3F3]">Limite: <span className="font-bold text-[#7C3AED]">5/5 usos</span></div>
      <div className="text-[#F3F3F3]">Reset em <span className="font-bold text-[#FF6AC2]">7h 4m</span></div>
    </div>
  </header>
);

export default Topbar; 