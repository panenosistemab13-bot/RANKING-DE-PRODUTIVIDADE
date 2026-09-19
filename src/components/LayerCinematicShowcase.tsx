import React, { useState, useEffect, useRef } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Play,
  Pause,
  Trophy,
  Users,
  Activity,
  Layers,
  ArrowRight,
  TableProperties
} from 'lucide-react';
import { OperatorSummary, DashboardKPIs } from '../types';
import { CollaboratorCard3D } from './CollaboratorCard3D';

interface LayerCinematicShowcaseProps {
  operators: OperatorSummary[];
  kpis: DashboardKPIs;
  onSwitchToListMode: () => void;
  onSelectOperator?: (name: string) => void;
  initialOperatorName?: string | null;
}

export const LayerCinematicShowcase: React.FC<LayerCinematicShowcaseProps> = ({
  operators,
  kpis,
  onSwitchToListMode,
  onSelectOperator,
  initialOperatorName
}) => {
  // Current index in operators array (0 to operators.length - 1)
  const [currentIndex, setCurrentIndex] = useState(() => {
    if (initialOperatorName) {
      const found = operators.findIndex((o) => o.name === initialOperatorName);
      if (found !== -1) return found;
    }
    return 0; // Starts at 1º place by default
  });

  // Showcase view type: 'podium' (exact 3 cards isolated together like the image) OR 'single' (1 by 1 carousel)
  const [showcaseMode, setShowcaseMode] = useState<'podium' | 'single'>('podium');
  const [isPlaying, setIsPlaying] = useState(false);
  const autoPlayTimerRef = useRef<NodeJS.Timeout | null>(null);

  const totalOperators = operators.length;
  const currentOperator = operators[currentIndex] || operators[0];
  const currentRank = currentIndex + 1;

  // Next collaborator function
  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % totalOperators);
  };

  // Previous collaborator function
  const handlePrev = () => {
    setCurrentIndex((prev) => (prev - 1 + totalOperators) % totalOperators);
  };

  // Keyboard navigation: ArrowRight / ArrowLeft / Space
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === 'PageDown') {
        e.preventDefault();
        if (showcaseMode === 'podium') {
          // If on podium mode, pressing ArrowRight seamlessly moves to 1-by-1 starting at rank 1 or 2
          setShowcaseMode('single');
        } else {
          handleNext();
        }
      } else if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
        e.preventDefault();
        if (showcaseMode === 'single') {
          handlePrev();
        }
      } else if (e.key === ' ' || e.code === 'Space') {
        e.preventDefault();
        setIsPlaying((prev) => !prev);
      } else if (e.key.toLowerCase() === 'p') {
        setShowcaseMode((prev) => (prev === 'podium' ? 'single' : 'podium'));
      } else if (e.key.toLowerCase() === 'l') {
        onSwitchToListMode();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showcaseMode, totalOperators]);

  // Auto-play slideshow logic
  useEffect(() => {
    if (isPlaying) {
      autoPlayTimerRef.current = setInterval(() => {
        handleNext();
      }, 4000);
    } else {
      if (autoPlayTimerRef.current) {
        clearInterval(autoPlayTimerRef.current);
      }
    }
    return () => {
      if (autoPlayTimerRef.current) clearInterval(autoPlayTimerRef.current);
    };
  }, [isPlaying]);

  // Sync selected operator up to parent
  useEffect(() => {
    if (currentOperator) {
      onSelectOperator?.(currentOperator.name);
    }
  }, [currentIndex, currentOperator]);

  const formatNumber = (val?: number) => {
    if (val === undefined || val === null) return '0';
    return val.toLocaleString('pt-BR');
  };

  // Top 3 operators for the isolated podium mode
  const top1 = operators[0];
  const top2 = operators[1];
  const top3 = operators[2];

  // Previous and next operators for 3D depth peek
  const prevOperator = operators[(currentIndex - 1 + totalOperators) % totalOperators];
  const nextOperator = operators[(currentIndex + 1) % totalOperators];

  // Activities breakdown for the 3D cylindrical chart
  const activities = currentOperator?.activitiesCount
    ? Object.entries(currentOperator.activitiesCount)
        .filter(([_, count]) => count > 0)
        .sort((a, b) => b[1] - a[1])
    : [];

  const maxActivityVal = activities.length > 0 ? Math.max(...activities.map((a) => a[1])) : 1;

  // Calculate efficiency / percentile
  const percentile = Math.max(1, Math.round(((totalOperators - currentIndex) / totalOperators) * 100));

  return (
    <div className="relative w-full h-[760px] flex flex-col items-center justify-between select-none">
      {/* =========================================================================
          ILUMINAÇÃO DE CINEMA 4K: SPOTLIGHT, FEIXES DE LUZ E PEDESTAL
         ========================================================================= */}
      {/* Dramatic central volumetric cone light */}
      <div className="absolute -top-16 left-1/2 -translate-x-1/2 w-[820px] h-[550px] bg-gradient-to-b from-amber-400/20 via-amber-200/5 to-transparent rounded-full blur-3xl pointer-events-none" />

      {/* Floating subtle ambient luxury particles */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/4 left-1/5 w-2 h-2 rounded-full bg-amber-300/40 blur-xs animate-ping" style={{ animationDuration: '3s' }} />
        <div className="absolute top-1/3 right-1/4 w-3 h-3 rounded-full bg-amber-200/50 blur-xs animate-pulse" style={{ animationDuration: '4s' }} />
        <div className="absolute bottom-1/3 left-1/3 w-2.5 h-2.5 rounded-full bg-white/60 blur-xs animate-ping" style={{ animationDuration: '5s' }} />
      </div>

      {/* =========================================================================
          TOP CINEMA TOOLBAR: MODOS DE VISUALIZAÇÃO
         ========================================================================= */}
      <div className="w-full flex items-center justify-center px-6 pt-2 z-20">
        {/* Seletor de Modo Cinematográfico Centralizado */}
        <div className="flex items-center gap-2 p-1.5 rounded-2xl bg-slate-900/60 backdrop-blur-xl border border-white/20 shadow-xl">
          <button
            onClick={() => setShowcaseMode('podium')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
              showcaseMode === 'podium'
                ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-white shadow-lg shadow-amber-500/30 border border-amber-300/40 scale-[1.02]'
                : 'text-slate-300 hover:text-white hover:bg-white/10'
            }`}
          >
            <Trophy className="w-4 h-4" />
            <span>PÓDIO TOP 3 ISOLADO</span>
          </button>

          <button
            onClick={() => setShowcaseMode('single')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
              showcaseMode === 'single'
                ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-white shadow-lg shadow-amber-500/30 border border-amber-300/40 scale-[1.02]'
                : 'text-slate-300 hover:text-white hover:bg-white/10'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>CARROSSEL 1 A 1 (TODOS OS 69)</span>
          </button>
        </div>
      </div>

      {/* =========================================================================
          ÁREA CENTRAL: ISOLADA NA TELA (CINEMATOGRÁFICA 4K)
         ========================================================================= */}
      <div className="relative w-full flex-1 flex items-center justify-center z-10 px-8 py-2">
        {/* Seta Flutuante Anterior (Esquerda) */}
        <button
          onClick={() => {
            if (showcaseMode === 'podium') setShowcaseMode('single');
            handlePrev();
          }}
          title="Colaborador Anterior (Seta Esquerda)"
          className="absolute left-6 top-1/2 -translate-y-1/2 w-16 h-16 rounded-3xl bg-slate-900/70 hover:bg-amber-500 text-white hover:text-slate-950 border-2 border-white/30 hover:border-amber-300 shadow-2xl backdrop-blur-xl flex items-center justify-center transition-all duration-200 cursor-pointer z-30 hover:scale-110 group"
        >
          <ChevronLeft className="w-9 h-9 group-hover:-translate-x-0.5 transition-transform stroke-[2.5]" />
        </button>

        {/* Seta Flutuante Próximo (Direita) */}
        <button
          onClick={() => {
            if (showcaseMode === 'podium') setShowcaseMode('single');
            handleNext();
          }}
          title="Próximo Colaborador (Seta Direita)"
          className="absolute right-6 top-1/2 -translate-y-1/2 w-16 h-16 rounded-3xl bg-slate-900/70 hover:bg-amber-500 text-white hover:text-slate-950 border-2 border-white/30 hover:border-amber-300 shadow-2xl backdrop-blur-xl flex items-center justify-center transition-all duration-200 cursor-pointer z-30 hover:scale-110 group"
        >
          <ChevronRight className="w-9 h-9 group-hover:translate-x-0.5 transition-transform stroke-[2.5]" />
        </button>

        {/* ---------------------------------------------------------------------
            SUB-MODO 1: PÓDIO DOS 3 CAMPEÕES ISOLADO (EXATO COMO A IMAGEM EM ANEXO)
           --------------------------------------------------------------------- */}
        {showcaseMode === 'podium' && (
          <div className="relative flex flex-col items-center justify-center">
            {/* Stage Pedestal Glow under the 3 cards */}
            <div className="absolute -bottom-6 w-[880px] h-[40px] bg-gradient-to-r from-transparent via-amber-400/40 to-transparent rounded-full blur-xl pointer-events-none" />
            <div className="absolute -bottom-2 w-[780px] h-[35px] bg-slate-950/40 rounded-full blur-2xl pointer-events-none" />

            {/* Os 3 Cards do Pódio exatamente como na imagem do usuário */}
            <div className="flex items-end justify-center gap-6">
              {/* 2º Lugar — Prata */}
              {top2 && (
                <div
                  onClick={() => {
                    setCurrentIndex(1);
                    setShowcaseMode('single');
                  }}
                  className="transition-transform duration-300 hover:scale-[1.03]"
                >
                  <CollaboratorCard3D
                    operator={top2}
                    rank={2}
                    size="normal"
                    isHighlighted={false}
                  />
                </div>
              )}

              {/* 1º Lugar — Ouro (Elevado e em destaque máximo no meio) */}
              {top1 && (
                <div
                  onClick={() => {
                    setCurrentIndex(0);
                    setShowcaseMode('single');
                  }}
                  className="-translate-y-4 transition-transform duration-300 hover:scale-[1.03]"
                >
                  <CollaboratorCard3D
                    operator={top1}
                    rank={1}
                    size="large"
                    isHighlighted={true}
                  />
                </div>
              )}

              {/* 3º Lugar — Bronze */}
              {top3 && (
                <div
                  onClick={() => {
                    setCurrentIndex(2);
                    setShowcaseMode('single');
                  }}
                  className="transition-transform duration-300 hover:scale-[1.03]"
                >
                  <CollaboratorCard3D
                    operator={top3}
                    rank={3}
                    size="normal"
                    isHighlighted={false}
                  />
                </div>
              )}
            </div>
          </div>
        )}

        {/* ---------------------------------------------------------------------
            SUB-MODO 2: APRESENTAÇÃO 1 POR 1 COM GRÁFICOS 3D 4K CINEMATOGRÁFICOS
           --------------------------------------------------------------------- */}
        {showcaseMode === 'single' && (
          <div className="w-full max-w-[1720px] flex items-center justify-between gap-8">
            {/* ===============================================================
                LADO ESQUERDO: GRÁFICO 3D 4K DE ATIVIDADES (CILINDROS METÁLICOS)
               =============================================================== */}
            <div className="w-[430px] shrink-0 glass-panel p-6 rounded-3xl border border-white/20 shadow-2xl flex flex-col justify-between h-[520px]">
              <div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-2xl bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center text-white shadow-md shadow-amber-500/25">
                      <Layers className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-lg font-black text-white tracking-tight uppercase font-heading">
                        ATIVIDADES 3D SAGA
                      </h3>
                      <span className="text-[11px] font-semibold text-slate-400">
                        Distribuição Volumétrica 4K
                      </span>
                    </div>
                  </div>
                  <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/30">
                    REALISTA
                  </span>
                </div>

                {/* 3D Metallic Cylinders List */}
                <div className="flex flex-col gap-3.5 mt-5">
                  {activities.slice(0, 5).map(([actName, actCount], i) => {
                    const pct = Math.round((actCount / maxActivityVal) * 100);
                    const isTop = i === 0;

                    return (
                      <div key={actName} className="flex flex-col gap-1.5">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-extrabold text-white truncate max-w-[240px]">
                            {actName}
                          </span>
                          <span className="font-black text-amber-300 font-heading">
                            {formatNumber(actCount)}
                          </span>
                        </div>

                        {/* 3D Realistic Metallic Cylinder Bar */}
                        <div className="relative w-full h-5 rounded-full bg-slate-950/80 p-0.5 border border-white/20 shadow-inner overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all duration-500 relative"
                            style={{
                              width: `${pct}%`,
                              background: isTop
                                ? 'linear-gradient(90deg, #f59e0b 0%, #fbbf24 50%, #fef3c7 100%)'
                                : 'linear-gradient(90deg, #3b82f6 0%, #60a5fa 50%, #e0f2fe 100%)',
                              boxShadow: isTop
                                ? '0 0 15px rgba(245, 158, 11, 0.6), inset 0 2px 2px rgba(255, 255, 255, 0.8)'
                                : '0 0 12px rgba(59, 130, 246, 0.5), inset 0 2px 2px rgba(255, 255, 255, 0.8)'
                            }}
                          >
                            {/* Cylinder reflection highlight */}
                            <div className="absolute top-0 left-0 right-0 h-1/2 bg-white/40 rounded-full" />
                          </div>
                        </div>
                      </div>
                    );
                  })}

                  {activities.length === 0 && (
                    <div className="py-8 text-center text-xs text-slate-400">
                      Nenhuma atividade específica registrada
                    </div>
                  )}
                </div>
              </div>

              {/* Status do Colaborador Box */}
              <div className="p-3.5 rounded-2xl bg-white/10 border border-white/15 backdrop-blur-md flex items-center justify-between">
                <div>
                  <span className="block text-[10px] font-bold text-slate-400 uppercase">
                    Status Operacional
                  </span>
                  <span className="text-sm font-black text-emerald-400 flex items-center gap-1.5 mt-0.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    100% ATIVO & AUDITADO
                  </span>
                </div>
                <div className="text-right">
                  <span className="block text-[10px] font-bold text-slate-400 uppercase">
                    SAGA WMS
                  </span>
                  <span className="text-xs font-extrabold text-white">3 COR - BH</span>
                </div>
              </div>
            </div>

            {/* ===============================================================
                CENTRO: CARD 3D ISOLADO EM DESTAQUE CINEMATOGRÁFICO
               =============================================================== */}
            <div className="relative flex items-center justify-center">
              {/* Previous card preview peek (3D perspective) */}
              {prevOperator && (
                <div
                  onClick={handlePrev}
                  className="absolute -left-48 opacity-40 hover:opacity-75 transition-all duration-300 scale-75 cursor-pointer -rotate-y-12 z-0 filter blur-[1px] hover:blur-none"
                >
                  <CollaboratorCard3D
                    operator={prevOperator}
                    rank={((currentIndex - 1 + totalOperators) % totalOperators) + 1}
                    size="compact"
                    showConfettiOnClick={false}
                  />
                </div>
              )}

              {/* CENTER HERO CARD 3D (Colaborador Atual em Foco) */}
              <div className="relative z-10 flex flex-col items-center">
                {/* Spotlight Ground Reflection */}
                <div className="absolute -bottom-8 w-[420px] h-[36px] bg-gradient-to-r from-transparent via-amber-400/45 to-transparent rounded-full blur-xl pointer-events-none" />

                {/* Rank Header Pill */}
                <div className="mb-4 flex items-center gap-2 px-5 py-1.5 rounded-full bg-gradient-to-r from-amber-500 to-amber-600 text-white font-black text-xs uppercase tracking-widest shadow-xl border border-amber-300/60">
                  <Trophy className="w-3.5 h-3.5" />
                  <span>COLABORADOR #{currentRank} DE {totalOperators}</span>
                </div>

                {/* The 3D Metallic Card itself */}
                <div className="animate-in fade-in zoom-in-95 duration-200">
                  <CollaboratorCard3D
                    operator={currentOperator}
                    rank={currentRank}
                    size="large"
                    isHighlighted={true}
                  />
                </div>
              </div>

              {/* Next card preview peek (3D perspective) */}
              {nextOperator && (
                <div
                  onClick={handleNext}
                  className="absolute -right-48 opacity-40 hover:opacity-75 transition-all duration-300 scale-75 cursor-pointer rotate-y-12 z-0 filter blur-[1px] hover:blur-none"
                >
                  <CollaboratorCard3D
                    operator={nextOperator}
                    rank={((currentIndex + 1) % totalOperators) + 1}
                    size="compact"
                    showConfettiOnClick={false}
                  />
                </div>
              )}
            </div>

            {/* ===============================================================
                LADO DIREITO: ESFERAS 3D DE EFICIÊNCIA & INDICADORES 4K
               =============================================================== */}
            <div className="w-[430px] shrink-0 glass-panel p-6 rounded-3xl border border-white/20 shadow-2xl flex flex-col justify-between h-[520px]">
              <div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-2xl bg-gradient-to-br from-indigo-500 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-indigo-500/25">
                      <Activity className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-lg font-black text-white tracking-tight uppercase font-heading">
                        DESEMPENHO 3D 4K
                      </h3>
                      <span className="text-[11px] font-semibold text-slate-400">
                        Indicadores de Cinema
                      </span>
                    </div>
                  </div>
                  <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-indigo-400/20 text-indigo-300 border border-indigo-400/30">
                    4K ULTRA
                  </span>
                </div>

                {/* 3D Holographic Gauge / Sphere */}
                <div className="mt-5 p-4.5 rounded-3xl bg-gradient-to-br from-slate-900/90 to-slate-950/90 border border-white/20 shadow-inner flex flex-col items-center text-center relative overflow-hidden">
                  {/* Glowing background ring */}
                  <div className="absolute w-44 h-44 rounded-full border-4 border-dashed border-amber-400/30 animate-spin" style={{ animationDuration: '25s' }} />

                  {/* Centered Holographic Value */}
                  <div className="relative z-10 my-3 flex flex-col items-center">
                    <div className="w-20 h-20 rounded-full bg-gradient-to-br from-amber-400 via-amber-500 to-amber-600 flex items-center justify-center text-slate-950 font-black text-2xl font-heading shadow-xl shadow-amber-500/40 border-2 border-white">
                      {percentile}%
                    </div>
                    <span className="text-xs font-black text-amber-300 uppercase tracking-wider mt-2">
                      PERCENTIL NO SAGA
                    </span>
                    <span className="text-[11px] font-semibold text-slate-300 mt-0.5">
                      Entre os melhores da unidade 3 Corações
                    </span>
                  </div>
                </div>

                {/* 2 Mini Metric 3D Blocks */}
                <div className="grid grid-cols-2 gap-3 mt-3">
                  <div className="p-3 rounded-2xl bg-white/10 border border-white/15">
                    <span className="text-[10px] font-bold text-slate-400 uppercase block">
                      Média / Ordem
                    </span>
                    <span className="text-xl font-black text-white font-heading mt-0.5 block">
                      {currentOperator.movements > 0
                        ? (currentOperator.totalProductivity / currentOperator.movements).toFixed(1)
                        : '0'}
                    </span>
                    <span className="text-[10px] font-extrabold text-emerald-400">
                      itens por movimento
                    </span>
                  </div>

                  <div className="p-3 rounded-2xl bg-white/10 border border-white/15">
                    <span className="text-[10px] font-bold text-slate-400 uppercase block">
                      Posição no Ranking
                    </span>
                    <span className="text-xl font-black text-amber-400 font-heading mt-0.5 block">
                      #{currentRank}º lugar
                    </span>
                    <span className="text-[10px] font-extrabold text-slate-300">
                      de {totalOperators} no total
                    </span>
                  </div>
                </div>
              </div>

              {/* Botão de Atalho para Ver no Modo Lista */}
              <button
                onClick={onSwitchToListMode}
                className="w-full py-3 rounded-2xl bg-white/10 hover:bg-white/20 border border-white/20 text-white font-black text-xs uppercase tracking-wide flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <span>Localizar na Tabela Completa</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* =========================================================================
          PARTE INFERIOR DO APP: OPÇÕES (AUTO PLAY SLIDESHOW & VER EM MODO LISTA)
         ========================================================================= */}
      <div className="w-full pb-4 pt-1 z-20 flex items-center justify-center gap-3.5 shrink-0">
        {/* Botão AutoPlay Slideshow */}
        <button
          onClick={() => {
            if (showcaseMode === 'podium') setShowcaseMode('single');
            setIsPlaying((prev) => !prev);
          }}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl text-xs font-black tracking-wide transition-all cursor-pointer shadow-lg shadow-black/30 border ${
            isPlaying
              ? 'bg-red-500 hover:bg-red-600 text-white border-red-400 animate-pulse'
              : 'bg-white hover:bg-slate-100 text-slate-900 border-white/90'
          }`}
        >
          {isPlaying ? (
            <>
              <Pause className="w-4 h-4 text-white" />
              <span>PAUSAR SLIDESHOW</span>
            </>
          ) : (
            <>
              <Play className="w-4 h-4 text-slate-900" />
              <span>AUTO PLAY SLIDESHOW</span>
            </>
          )}
        </button>

        {/* Botão para Ver Modo Lista */}
        <button
          onClick={onSwitchToListMode}
          className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-black tracking-wide border border-blue-400/50 shadow-lg shadow-blue-900/40 transition-all cursor-pointer group"
        >
          <TableProperties className="w-4 h-4 group-hover:scale-110 transition-transform" />
          <span>VER EM MODO LISTA</span>
        </button>
      </div>
    </div>
  );
};
