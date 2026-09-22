import React, { useState, useEffect } from 'react';
import { Calendar, MapPin, SlidersHorizontal, Monitor, Trophy, TableProperties, Maximize, Minimize } from 'lucide-react';
import { PeriodPreset } from '../types';

interface HeaderNavProps {
  periodPreset: PeriodPreset;
  onSelectPeriodPreset: (preset: PeriodPreset) => void;
  periodLabel: string;
  siteLabel: string;
  totalOperatorsCount?: number;
  onOpenDataModal: () => void;
  activeView?: 'showcase' | 'list';
  onToggleView?: (view: 'showcase' | 'list') => void;
}

export const HeaderNav: React.FC<HeaderNavProps> = ({
  periodPreset,
  onSelectPeriodPreset,
  periodLabel,
  siteLabel,
  totalOperatorsCount = 0,
  onOpenDataModal,
  activeView = 'showcase',
  onToggleView
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
    <header className="w-full flex items-center justify-between px-8 pt-5 pb-2 z-20 shrink-0">
      {/* Esquerda: Logo 3 Corações + Título do Dashboard */}
      <div className="flex items-center gap-5">
        {/* Logo Oficial 3 Corações */}
        <div className="flex items-center gap-3 pr-5 border-r border-slate-300/70">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-500 via-orange-600 to-red-600 flex items-center justify-center text-white shadow-xl shadow-orange-600/30 border border-white/70 relative">
            <svg viewBox="0 0 24 24" className="w-7 h-7 fill-white drop-shadow-sm">
              <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
            </svg>
            <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-amber-400 border-2 border-white flex items-center justify-center text-[10px] font-black text-slate-900 shadow-xs">
              3
            </div>
          </div>
          <div>
            <span className="block text-[16px] font-black text-slate-900 leading-tight tracking-tight font-heading">
              3 CORAÇÕES
            </span>
            <span className="text-[10px] font-bold text-amber-700 tracking-wider uppercase">
              Mais que café, relações
            </span>
          </div>
        </div>

        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-[30px] font-black tracking-tight text-[#0f2444] uppercase leading-none font-heading flex items-center gap-3">
              RANKING DE PRODUTIVIDADE
            </h1>
            <span className="px-2.5 py-0.5 rounded-full bg-gradient-to-r from-amber-500 to-orange-600 text-white font-black text-[10px] uppercase tracking-widest shadow-md">
              SAGA WMS
            </span>
          </div>
          <p className="text-[13px] font-semibold text-slate-500 mt-1 tracking-normal">
            {totalOperatorsCount > 0
              ? `${totalOperatorsCount} Colaboradores • Pódio 3D 4K • Navegação por Teclado (Setas ◀ ➔)`
              : 'Aguardando Importação SAGA • Pódio 3D 4K • Firebase Realtime'}
          </p>
        </div>
      </div>

      {/* Right Badges & Controls */}
      <div className="flex items-center gap-3.5">
        {/* Período Pill Selector Removed */}

        {/* Site Pill */}
        <div className="flex items-center gap-3 px-4 py-2 rounded-2xl bg-white/90 border border-slate-200/80 shadow-sm backdrop-blur-md text-slate-800">
          <div className="w-7 h-7 rounded-xl bg-slate-100 flex items-center justify-center text-slate-700">
            <MapPin className="w-3.5 h-3.5" />
          </div>
          <div className="text-left leading-tight">
            <span className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
              Site
            </span>
            <span className="text-[12.5px] font-bold text-slate-800 tracking-tight">
              {siteLabel}
            </span>
          </div>
        </div>

        {/* Botão de Banco de Dados / Firebase */}
        <button
          onClick={onOpenDataModal}
          title="Banco de Dados Firebase Realtime • Importar PDF"
          className="flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-900 border border-amber-300/80 shadow-xs hover:shadow-md transition-all duration-200 cursor-pointer group"
        >
          <div className="w-7 h-7 rounded-xl bg-amber-500 flex items-center justify-center text-white shadow-xs group-hover:scale-105 transition-transform">
            <SlidersHorizontal className="w-3.5 h-3.5" />
          </div>
          <div className="text-left leading-tight hidden lg:block">
            <div className="flex items-center gap-1.5">
              <span className="text-[11.5px] font-black text-amber-900 tracking-tight uppercase font-heading">
                Firebase Realtime
              </span>
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            </div>
            <span className="block text-[9.5px] font-bold text-amber-700 uppercase tracking-wider">
              Importar / Sincronizar
            </span>
          </div>
        </button>

        {/* Slogan with Heart Logo */}
        <div className="flex items-center gap-2.5 pl-2 select-none">
          <span className="text-[13.5px] font-serif italic font-bold text-slate-800 tracking-tight leading-snug text-right max-w-[135px]">
            Juntos por um futuro mais produtivo.
          </span>
          <div className="w-8.5 h-8.5 rounded-xl bg-gradient-to-br from-red-600 to-amber-600 flex items-center justify-center shadow-md shadow-red-700/20">
            <svg viewBox="0 0 24 24" className="w-4.5 h-4.5 fill-white">
              <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
            </svg>
          </div>
        </div>

        {/* Botão e Indicador de Modo Tela Cheia — Design Executivo e Elegante */}
        <div className="flex items-center gap-2 pl-2 border-l border-slate-200/80">
          <button
            onClick={toggleFullscreen}
            title={isFullscreen ? "Sair da Tela Cheia (Esc)" : "Entrar em Tela Cheia (F11 / Apresentação)"}
            className="flex items-center gap-3 px-3.5 py-1.5 rounded-2xl bg-white/95 hover:bg-white border border-slate-200/90 hover:border-amber-400/80 shadow-xs hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 cursor-pointer group text-slate-800"
          >
            <div className="w-7 h-7 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center text-white shadow-xs group-hover:scale-105 transition-transform">
              <Monitor className="w-3.5 h-3.5 text-white" />
            </div>
            <div className="text-left leading-tight pr-1">
              <div className="flex items-center gap-1.5">
                <span className="text-[12px] font-black text-slate-800 tracking-tight uppercase font-heading">
                  {isFullscreen ? 'Sair da Tela Cheia' : 'Modo Tela Cheia'}
                </span>
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
              </div>
              <span className="block text-[10px] font-bold text-amber-700/90 uppercase tracking-wider">
                {isFullscreen ? 'Pressione Esc' : 'Apresentação TV'}
              </span>
            </div>
            <div className="w-6 h-6 rounded-lg bg-slate-100/80 group-hover:bg-amber-100 group-hover:text-amber-800 flex items-center justify-center text-slate-500 transition-colors ml-0.5">
              {isFullscreen ? (
                <Minimize className="w-3.5 h-3.5" />
              ) : (
                <Maximize className="w-3.5 h-3.5" />
              )}
            </div>
          </button>
        </div>
      </div>
    </header>
  );
};

