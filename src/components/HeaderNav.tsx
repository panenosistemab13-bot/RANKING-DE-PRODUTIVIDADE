import React, { useState, useEffect } from 'react';
import { Calendar, MapPin, SlidersHorizontal, Monitor, Trophy, TableProperties, Maximize, Minimize, LogOut, User, Mail } from 'lucide-react';
import { PeriodPreset } from '../types';

interface HeaderNavProps {
  periodPreset: PeriodPreset;
  onSelectPeriodPreset: (preset: PeriodPreset) => void;
  periodLabel: string;
  siteLabel: string;
  totalOperatorsCount?: number;
  activeView?: 'showcase' | 'list';
  onToggleView?: (view: 'showcase' | 'list') => void;
  userEmail?: string | null;
  onLogout?: () => void;
  onOpenGoogleSheetsModal?: () => void;
  onOpenGmailModal?: () => void;
}

export const HeaderNav: React.FC<HeaderNavProps> = ({
  periodPreset,
  onSelectPeriodPreset,
  periodLabel,
  siteLabel,
  totalOperatorsCount = 0,
  activeView = 'showcase',
  onToggleView,
  userEmail,
  onLogout,
  onOpenGoogleSheetsModal,
  onOpenGmailModal
}) => {
  const [showPeriodDropdown, setShowPeriodDropdown] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const toggleFullscreen = () => {
    try {
      if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch(() => {});
      } else {
        if (document.exitFullscreen) {
          document.exitFullscreen().catch(() => {});
        }
      }
    } catch {
      // safe fallback if iframe blocks
    }
  };

  return (
    <header className="w-full flex items-center justify-between px-6 py-2.5 bg-white/85 backdrop-blur-xl border border-white/80 rounded-3xl shadow-xl z-20 shrink-0 mb-2.5">
      {/* Esquerda: Logo 3 Corações + Título do Dashboard */}
      <div className="flex items-center gap-4">
        {/* Logo Oficial 3 Corações 4K 3D */}
        <div className="flex items-center gap-3 pr-5 border-r border-slate-200/80">
          <img
            src="/src/assets/images/tres_coracoes_badge_1790081482199.jpg"
            alt="Ícone 3D 3 Corações"
            referrerPolicy="no-referrer"
            className="w-12 h-12 object-cover rounded-2xl shadow-md shadow-orange-600/20 border-2 border-amber-400/80 hover:scale-105 transition-all shrink-0"
          />
          <div className="flex flex-col justify-center">
            <span className="text-[20px] font-black text-[#0f2444] leading-none tracking-tight font-heading uppercase">
              3 CORAÇÕES
            </span>
            <span className="text-[10px] font-black text-amber-700 tracking-wider uppercase mt-1 leading-none">
              MAIS QUE CAFÉ, RELAÇÕES
            </span>
          </div>
        </div>

        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-[24px] font-black tracking-tight text-[#0f2444] uppercase leading-none font-heading flex items-center gap-2.5">
              RANKING DE PRODUTIVIDADE
            </h1>
            <span className="px-3 py-1 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 text-white font-black text-[10px] uppercase tracking-wider shadow-md flex items-center gap-1">
              SAGA WMS
            </span>
          </div>
          <p className="text-[12px] font-semibold text-slate-500 mt-1 tracking-normal">
            {totalOperatorsCount > 0
              ? `${totalOperatorsCount} Colaboradores • Pódio 3D 4K • Navegação por Teclado (Setas ◀ ➔)`
              : 'Aguardando Importação SAGA • Pódio 3D 4K • Firebase Realtime'}
          </p>
        </div>
      </div>

      {/* Right Badges & Controls */}
      <div className="flex items-center gap-3">
        {/* Site Pill */}
        <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/95 border border-slate-200/80 shadow-xs backdrop-blur-md text-slate-800">
          <MapPin className="w-3.5 h-3.5 text-amber-600" />
          <div className="text-left leading-tight flex items-center gap-1.5">
            <span className="text-[10px] font-bold text-slate-400 uppercase">
              Site:
            </span>
            <span className="text-[12px] font-black text-slate-800 tracking-tight">
              {siteLabel}
            </span>
          </div>
        </div>

        {/* Indicador e Botão de Status: Planilha Oficial Vinculada em Tempo Real */}
        <button
          onClick={onOpenGoogleSheetsModal}
          title="Clique para abrir o Script e sincronizar qualquer Planilha do Google Sheets"
          className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-300/80 shadow-xs text-emerald-950 backdrop-blur-md transition-all duration-200 cursor-pointer group select-none"
        >
          <div className="w-5 h-5 rounded-full bg-emerald-600 flex items-center justify-center text-white shadow-2xs">
            <svg viewBox="0 0 24 24" className="w-3 h-3 fill-white">
              <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-2 10h-4v4h-2v-4H7v-2h4V7h2v4h4v2z"/>
            </svg>
          </div>
          <div className="text-left leading-tight flex items-center gap-1.5">
            <span className="text-[11px] font-black text-emerald-900 tracking-tight uppercase font-heading">
              Planilha Vinculada
            </span>
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
          </div>
        </button>

        {/* Botão de Enviar por E-mail (Gmail API) */}
        {onOpenGmailModal && (
          <button
            onClick={onOpenGmailModal}
            title="Enviar Relatório de Produtividade SAGA por E-mail (Gmail API)"
            className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-500/10 hover:bg-amber-500/20 border border-amber-300/80 shadow-xs text-amber-950 backdrop-blur-md transition-all duration-200 cursor-pointer group select-none shrink-0"
          >
            <div className="w-5 h-5 rounded-full bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-white shadow-2xs">
              <Mail className="w-3 h-3 text-white" />
            </div>
            <div className="text-left leading-tight">
              <span className="text-[11px] font-black text-amber-900 tracking-tight uppercase font-heading">
                Enviar E-mail (Gmail)
              </span>
            </div>
          </button>
        )}

        {/* Slogan with Heart Logo */}
        <div className="flex items-center gap-2 pl-1 select-none">
          <span className="text-[12.5px] font-serif italic font-bold text-slate-700 tracking-tight leading-snug text-right max-w-[130px]">
            Juntos por um futuro mais produtivo.
          </span>
          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-red-600 to-amber-600 flex items-center justify-center shadow-md shadow-red-700/20">
            <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 fill-white">
              <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
            </svg>
          </div>
        </div>

        {/* Botão e Indicador de Modo Tela Cheia — Design Executivo e Elegante */}
        <button
          onClick={toggleFullscreen}
          title={isFullscreen ? "Sair da Tela Cheia (Esc)" : "Entrar em Tela Cheia (F11 / Apresentação)"}
          className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-white font-black text-[11px] uppercase tracking-wider shadow-md hover:shadow-lg transition-all cursor-pointer group"
        >
          <Monitor className="w-3.5 h-3.5 text-white" />
          <span>{isFullscreen ? 'Sair da Tela Cheia' : 'Modo Tela Cheia'}</span>
        </button>

        {/* User Account & Logout Button */}
        {userEmail && onLogout && (
          <div className="flex items-center gap-2 pl-2 border-l border-slate-200/80">
            <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-white/95 border border-slate-200/90 shadow-xs">
              <div className="w-6 h-6 rounded-full bg-gradient-to-br from-slate-800 to-slate-900 flex items-center justify-center text-amber-400 font-black text-xs">
                {userEmail.charAt(0).toUpperCase()}
              </div>
              <div className="text-left leading-tight max-w-[120px] truncate hidden sm:block">
                <span className="text-[11px] font-black text-slate-800 tracking-tight truncate block" title={userEmail}>
                  {userEmail}
                </span>
              </div>
              <button
                onClick={onLogout}
                title="Deslogar e Voltar para Tela de Login"
                className="ml-1 px-2 py-0.5 rounded-full bg-rose-50 hover:bg-rose-500 text-rose-600 hover:text-white transition-all duration-200 cursor-pointer border border-rose-200/80 hover:border-rose-600 flex items-center gap-1 group"
              >
                <LogOut className="w-3 h-3 group-hover:-translate-x-0.5 transition-transform" />
                <span className="text-[10px] font-black uppercase font-heading">Sair</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </header>
  );
};

