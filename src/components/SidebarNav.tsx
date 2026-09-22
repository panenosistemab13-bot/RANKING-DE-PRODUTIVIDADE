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
        <div className="relative w-12 h-12 rounded-2xl bg-gradient-to-br from-red-600 to-amber-600 flex items-center justify-center shadow-lg shadow-red-900/20 group-hover:scale-105 transition-transform duration-200">
          {/* Heart logo silhouette */}
          <div className="flex items-center justify-center text-white">
            <svg viewBox="0 0 24 24" className="w-7 h-7 fill-white drop-shadow">
              <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
            </svg>
          </div>
          <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-amber-400 border-2 border-white flex items-center justify-center">
            <span className="text-[9px] font-black text-slate-900">3</span>
          </div>
        </div>
        <span className="text-[10px] font-extrabold tracking-tight text-slate-800 mt-1.5 leading-none">
          3 Corações
        </span>
        <span className="text-[7.5px] font-medium text-slate-500 tracking-tighter scale-90">
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
