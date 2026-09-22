import React from 'react';
import { Home, Trophy, Users, FileText, FileSpreadsheet, BarChart3, Settings } from 'lucide-react';

interface SidebarNavProps {
  activeTab: string;
  onSelectTab: (tab: string) => void;
  onOpenDataModal: () => void;
  onOpenGoogleSheetsModal?: () => void;
}

export const SidebarNav: React.FC<SidebarNavProps> = ({
  activeTab,
  onSelectTab,
  onOpenDataModal,
  onOpenGoogleSheetsModal
}) => {
  return (
    <aside className="w-[84px] h-full flex flex-col items-center py-6 border-r border-white/40 bg-white/40 backdrop-blur-xl z-20 shrink-0 select-none">
      {/* 3 Corações Brand Logo */}
      <div className="flex flex-col items-center mb-8 group cursor-pointer" onClick={() => onSelectTab('ranking')}>
        <img
          src="/src/assets/images/tres_coracoes_badge_1790081482199.jpg"
          alt="3 Corações Badge 3D"
          referrerPolicy="no-referrer"
          className="w-14 h-14 object-cover rounded-2xl shadow-lg border-2 border-amber-400/80 group-hover:scale-110 transition-transform duration-200"
        />
        <span className="text-[11px] font-black tracking-tight text-slate-900 mt-2 leading-none uppercase">
          3 Corações
        </span>
        <span className="text-[8px] font-black text-amber-700 tracking-tight mt-1 uppercase">
          Mais que café
        </span>
      </div>

      {/* Navigation Icons Menu */}
      <nav className="flex-1 flex flex-col items-center gap-3">
        <button
          onClick={() => onSelectTab('home')}
          title="Início"
          className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-200 ${
            activeTab === 'home'
              ? 'bg-amber-500 text-white shadow-md shadow-amber-500/30 font-semibold'
              : 'text-slate-500 hover:text-slate-900 hover:bg-white/60'
          }`}
        >
          <Home className="w-5 h-5" />
        </button>

        <button
          onClick={() => onSelectTab('ranking')}
          title="Ranking de Produtividade"
          className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-200 ${
            activeTab === 'ranking'
              ? 'bg-gradient-to-br from-amber-500 to-amber-600 text-white shadow-lg shadow-amber-500/35 ring-2 ring-amber-400/50'
              : 'text-slate-500 hover:text-slate-900 hover:bg-white/60'
          }`}
        >
          <Trophy className="w-5 h-5" />
        </button>

        <button
          onClick={() => onSelectTab('operators')}
          title="Colaboradores"
          className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-200 ${
            activeTab === 'operators'
              ? 'bg-amber-500 text-white shadow-md shadow-amber-500/30'
              : 'text-slate-500 hover:text-slate-900 hover:bg-white/60'
          }`}
        >
          <Users className="w-5 h-5" />
        </button>

        <button
          onClick={onOpenDataModal}
          title="Relatório PDF (SAGA)"
          className="w-12 h-12 rounded-2xl flex items-center justify-center text-slate-500 hover:text-slate-900 hover:bg-white/60 transition-all duration-200 relative group"
        >
          <FileText className="w-5 h-5" />
          <span className="absolute left-14 bg-slate-900 text-white text-xs px-2.5 py-1 rounded-lg font-medium opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity shadow-lg whitespace-nowrap z-50">
            Relatório SAGA PDF
          </span>
        </button>

        <button
          onClick={onOpenGoogleSheetsModal || onOpenDataModal}
          title="Google Sheets Sincronização & Script"
          className="w-12 h-12 rounded-2xl flex items-center justify-center text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 transition-all duration-200 relative group"
        >
          <FileSpreadsheet className="w-5 h-5" />
          <span className="absolute left-14 bg-slate-900 text-white text-xs px-2.5 py-1 rounded-lg font-medium opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity shadow-lg whitespace-nowrap z-50">
            Google Sheets & Script
          </span>
        </button>

        <button
          onClick={() => onSelectTab('analytics')}
          title="Desempenho Geral"
          className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-200 ${
            activeTab === 'analytics'
              ? 'bg-amber-500 text-white shadow-md shadow-amber-500/30'
              : 'text-slate-500 hover:text-slate-900 hover:bg-white/60'
          }`}
        >
          <BarChart3 className="w-5 h-5" />
        </button>
      </nav>

      {/* Bottom Settings */}
      <div className="pt-4 border-t border-slate-200/40 w-full flex justify-center">
        <button
          onClick={onOpenDataModal}
          title="Configurações e Fonte de Dados"
          className="w-12 h-12 rounded-2xl flex items-center justify-center text-slate-500 hover:text-slate-900 hover:bg-white/60 transition-all duration-200"
        >
          <Settings className="w-5 h-5" />
        </button>
      </div>
    </aside>
  );
};
