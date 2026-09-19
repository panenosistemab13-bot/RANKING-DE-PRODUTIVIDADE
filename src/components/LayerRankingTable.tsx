import React, { useState, useMemo } from 'react';
import { Search, Filter, ArrowUp, ArrowDown, ChevronDown, Check, Trophy, Sparkles, Activity, ShieldCheck } from 'lucide-react';
import { OperatorSummary } from '../types';
import { AVAILABLE_ACTIVITIES } from '../data/productivityData';

interface LayerRankingTableProps {
  operators: OperatorSummary[];
  selectedActivity: string;
  onSelectActivity: (activity: string) => void;
  onSelectOperator: (name: string) => void;
  selectedOperator: string | null;
  onOpenShowcase?: (operatorName?: string) => void;
}

export const LayerRankingTable: React.FC<LayerRankingTableProps> = ({
  operators,
  selectedActivity,
  onSelectActivity,
  onSelectOperator,
  selectedOperator,
  onOpenShowcase
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  const [sortBy, setSortBy] = useState<'productivity' | 'movements'>('productivity');

  // Filter and sort operators
  const filteredOperators = useMemo(() => {
    let list = operators.filter((op) => {
      const matchesSearch = op.name.toLowerCase().includes(searchTerm.toLowerCase());
      if (!matchesSearch) return false;

      if (selectedActivity !== 'TODAS AS ATIVIDADES') {
        return op.activitiesCount && op.activitiesCount[selectedActivity] > 0;
      }
      return true;
    });

    if (sortBy === 'movements') {
      list = [...list].sort((a, b) => b.movements - a.movements);
    } else {
      list = [...list].sort((a, b) => b.totalProductivity - a.totalProductivity);
    }

    return list;
  }, [operators, searchTerm, selectedActivity, sortBy]);

  // Max value for progress bar scaling
  const maxProductivity = useMemo(() => {
    if (operators.length === 0) return 1;
    return Math.max(...operators.map((o) => o.totalProductivity));
  }, [operators]);

  const formatNumber = (val: number) => {
    return val.toLocaleString('pt-BR');
  };

  // Ultra-Definition 3D Glowing Sparkline SVG
  const renderSparkline3D = (points: number[], isPositive = true, isTop3 = false) => {
    if (!points || points.length === 0) return null;
    const width = 96;
    const height = 28;
    const min = Math.min(...points);
    const max = Math.max(...points);
    const range = max - min || 1;

    const pathD = points
      .map((val, idx) => {
        const x = (idx / (points.length - 1)) * (width - 8) + 4;
        const y = height - ((val - min) / range) * (height - 10) - 5;
        return `${idx === 0 ? 'M' : 'L'} ${x} ${y}`;
      })
      .join(' ');

    const areaD = `${pathD} L ${width - 4} ${height} L 4 ${height} Z`;

    const gradientId = `spark-grad-${Math.random().toString(36).substr(2, 9)}`;
    const strokeColor = isTop3 ? '#f59e0b' : isPositive ? '#3b82f6' : '#ef4444';

    return (
      <svg width={width} height={height} className="overflow-visible drop-shadow-md">
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={strokeColor} stopOpacity="0.35" />
            <stop offset="100%" stopColor={strokeColor} stopOpacity="0.0" />
          </linearGradient>
        </defs>

        {/* Glowing area fill under curve */}
        <path d={areaD} fill={`url(#${gradientId})`} />

        {/* Main 3D Curve */}
        <path
          d={pathD}
          fill="none"
          stroke={strokeColor}
          strokeWidth="2.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Endpoint Highlight Node */}
        {points.length > 0 && (() => {
          const lastVal = points[points.length - 1];
          const lx = width - 4;
          const ly = height - ((lastVal - min) / range) * (height - 10) - 5;
          return (
            <g>
              <circle cx={lx} cy={ly} r="4" fill={strokeColor} className="animate-pulse" />
              <circle cx={lx} cy={ly} r="2" fill="#ffffff" />
            </g>
          );
        })()}
      </svg>
    );
  };

  return (
    <div className="ranking-table-3d w-full h-[510px] p-6 flex flex-col justify-between relative overflow-hidden select-none">
      {/* Table Header: Title + Search + Filter Button */}
      <div className="flex items-center justify-between pb-3.5 border-b border-slate-200/60">
        <div className="flex items-center gap-3.5">
          {/* 3D Metallic Crown Badge */}
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-amber-400 via-amber-500 to-amber-600 flex items-center justify-center text-white shadow-lg shadow-amber-500/35 border border-amber-300/60 relative group">
            <Trophy className="w-5 h-5 text-white drop-shadow-md stroke-[2.2]" />
            <Sparkles className="w-3.5 h-3.5 text-amber-200 absolute -top-1 -right-1 animate-spin" style={{ animationDuration: '6s' }} />
          </div>

          <div className="flex items-baseline gap-3">
            <h3 className="text-[21px] font-black tracking-tight text-[#0f2444] uppercase font-heading drop-shadow-xs flex items-center gap-2">
              RANKING COMPLETO
              <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-slate-900 text-amber-400 tracking-widest border border-slate-800">
                3D 4K ULTRA
              </span>
            </h3>

            {selectedActivity !== 'TODAS AS ATIVIDADES' && (
              <span className="text-xs font-extrabold px-3 py-1 rounded-full bg-amber-500 text-white shadow-md shadow-amber-500/25 uppercase tracking-wide border border-amber-400">
                {selectedActivity}
              </span>
            )}
          </div>
        </div>

        {/* Search & Filter Controls with Glossy 3D Finish */}
        <div className="flex items-center gap-3 relative">
          {/* Search Box */}
          <div className="relative w-80">
            <Search className="w-4 h-4 text-amber-600/70 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar colaborador..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9.5 pr-4 py-2.5 text-xs font-bold rounded-2xl bg-white/95 border border-slate-200/90 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500 placeholder:text-slate-400 text-slate-900 transition-all shadow-sm"
            />

            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-slate-200 hover:bg-slate-300 text-slate-600 flex items-center justify-center text-xs font-bold"
              >
                ✕
              </button>
            )}
          </div>

          {/* Filter Popover Button with 3D Effect */}
          <div className="relative">
            <button
              onClick={() => setShowFilterDropdown(!showFilterDropdown)}
              className={`flex items-center gap-2 px-4.5 py-2.5 rounded-2xl border text-xs font-extrabold transition-all shadow-md ${
                showFilterDropdown || selectedActivity !== 'TODAS AS ATIVIDADES'
                  ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-white border-amber-600 shadow-amber-500/25'
                  : 'bg-white/95 text-slate-800 border-slate-200/90 hover:bg-white hover:border-slate-300'
              }`}
            >
              <Filter className="w-3.5 h-3.5" />
              <span>FILTROS</span>
              <ChevronDown className="w-3 h-3 ml-0.5" />
            </button>

            {/* Filter Dropdown Menu */}
            {showFilterDropdown && (
              <div className="absolute right-0 mt-2.5 w-76 rounded-3xl bg-white/95 backdrop-blur-2xl border border-slate-200/90 shadow-2xl p-3.5 z-50 animate-in fade-in zoom-in-95 duration-150">
                <div className="px-2 py-1 text-[10.5px] font-black uppercase tracking-wider text-slate-400">
                  Filtrar por Atividade
                </div>

                <div className="flex flex-col gap-0.5 max-h-56 overflow-y-auto custom-scrollbar my-1">
                  {AVAILABLE_ACTIVITIES.map((act) => (
                     <button
                      key={act}
                      onClick={() => {
                        onSelectActivity(act);
                        setShowFilterDropdown(false);
                      }}
                      className={`w-full text-left px-3.5 py-2 rounded-xl text-xs font-bold flex items-center justify-between transition-all ${
                        selectedActivity === act
                          ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-white shadow-sm'
                          : 'text-slate-700 hover:bg-slate-100/80'
                      }`}
                    >
                      <span className="truncate">{act}</span>
                      {selectedActivity === act && <Check className="w-3.5 h-3.5 shrink-0" />}
                    </button>
                  ))}
                </div>

                <div className="border-t border-slate-100 my-2 pt-2.5">
                  <div className="px-2 py-1 text-[10.5px] font-black uppercase tracking-wider text-slate-400">
                    Ordenar Por
                  </div>

                  <div className="grid grid-cols-2 gap-1.5 mt-1">
                    <button
                      onClick={() => setSortBy('productivity')}
                      className={`px-3 py-2 rounded-xl text-xs font-black text-center transition-all ${
                        sortBy === 'productivity'
                          ? 'bg-slate-900 text-white shadow-md'
                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200/80'
                      }`}
                    >
                      Produtividade
                    </button>

                    <button
                      onClick={() => setSortBy('movements')}
                      className={`px-3 py-2 rounded-xl text-xs font-black text-center transition-all ${
                        sortBy === 'movements'
                          ? 'bg-slate-900 text-white shadow-md'
                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200/80'
                      }`}
                    >
                      Movimentações
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Botão de Acesso Direto ao Pódio 3D 4K */}
          {onOpenShowcase && (
            <button
              onClick={() => onOpenShowcase(selectedOperator || undefined)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-white font-black text-xs shadow-md shadow-amber-500/30 border border-amber-300/50 transition-all cursor-pointer group"
            >
              <Trophy className="w-3.5 h-3.5 group-hover:rotate-12 transition-transform" />
              <span>APRESENTAÇÃO 3D (TECLADO ➔)</span>
            </button>
          )}
        </div>
      </div>

      {/* 3D Ultra Column Headers */}
      <div className="grid grid-cols-[75px_230px_1fr_170px_130px_130px_110px] items-center px-4 py-2.5 text-[11px] font-black uppercase tracking-wider text-slate-400 border-b border-slate-200/50 my-1">
        <div className="text-center flex items-center justify-center gap-1">
          <ShieldCheck className="w-3.5 h-3.5 text-amber-500" />
          POSIÇÃO
        </div>
        <div>COLABORADOR</div>
        <div className="px-2">DESEMPENHO RELATIVO</div>
        <div className="text-right">TOTAL DE PRODUTIVIDADE</div>
        <div className="text-center">MOVIMENTAÇÕES</div>
        <div className="text-center">PARTICIPAÇÃO</div>
        <div className="text-center flex items-center justify-center gap-1">
          <Activity className="w-3.5 h-3.5 text-blue-500" />
          EVOLUÇÃO
        </div>
      </div>

      {/* Table Rows Body with 3D Glossy Cards */}
      <div className="flex-1 overflow-y-auto custom-scrollbar divide-y divide-slate-100/40 pr-1 space-y-1">
        {filteredOperators.length === 0 ? (
          <div className="h-44 flex flex-col items-center justify-center text-slate-400">
            <Search className="w-8 h-8 mb-2 opacity-40" />
            <p className="text-sm font-bold">Nenhum colaborador encontrado com os filtros atuais.</p>
          </div>
        ) : (
          filteredOperators.map((op, index) => {
            const displayRank = index + 1;
            const progressPercent = Math.min(100, Math.max(10, (op.totalProductivity / maxProductivity) * 100));
            const isSelected = selectedOperator === op.name;

            return (
              <div
                key={op.name}
                onClick={() => onSelectOperator(op.name)}
                className={`ranking-row-3d grid grid-cols-[75px_230px_1fr_170px_130px_130px_110px] items-center px-4 py-2 cursor-pointer rounded-2xl border transition-all ${
                  isSelected
                    ? 'bg-gradient-to-r from-amber-100/90 via-amber-50/95 to-amber-100/90 border-amber-400 ring-2 ring-amber-400/60 shadow-lg'
                    : 'border-transparent hover:border-amber-200/60'
                }`}
              >
                {/* 1. POSIÇÃO (3D METALLIC BADGES) */}
                <div className="flex items-center justify-center">
                  {displayRank === 1 ? (
                    <div className="w-8.5 h-8.5 rounded-full bg-gradient-to-br from-amber-300 via-amber-400 to-amber-600 text-amber-950 font-black text-xs flex items-center justify-center shadow-lg shadow-amber-500/40 border border-white/80 font-heading">
                      1º
                    </div>
                  ) : displayRank === 2 ? (
                    <div className="w-8.5 h-8.5 rounded-full bg-gradient-to-br from-slate-100 via-slate-300 to-slate-500 text-slate-900 font-black text-xs flex items-center justify-center shadow-md shadow-slate-400/40 border border-white/80 font-heading">
                      2º
                    </div>
                  ) : displayRank === 3 ? (
                    <div className="w-8.5 h-8.5 rounded-full bg-gradient-to-br from-amber-600 via-orange-600 to-amber-800 text-white font-black text-xs flex items-center justify-center shadow-md shadow-orange-600/40 border border-white/80 font-heading">
                      3º
                    </div>
                  ) : (
                    <div className="w-7.5 h-7.5 rounded-full bg-white/90 text-slate-700 font-extrabold text-xs flex items-center justify-center border border-slate-200 shadow-xs font-heading">
                      {displayRank}º
                    </div>
                  )}
                </div>

                {/* 2. COLABORADOR */}
                <div className="flex items-center gap-2 pr-2">
                  <span className="text-[14px] font-black text-slate-900 tracking-tight uppercase truncate font-heading">
                    {op.name}
                  </span>
                </div>

                {/* 3. BARRA DE PRODUTIVIDADE 3D COM GLOW E NEON */}
                <div className="px-2 flex items-center">
                  <div className="w-full h-3.5 bar-3d-track p-0.5">
                    <div
                      className={`h-full rounded-full transition-all duration-700 ease-out relative ${
                        displayRank === 1
                          ? 'bar-3d-fill-gold'
                          : displayRank === 2
                          ? 'bar-3d-fill-silver'
                          : displayRank === 3
                          ? 'bar-3d-fill-bronze'
                          : 'bar-3d-fill-blue'
                      }`}
                      style={{ width: `${progressPercent}%` }}
                    >
                      <div className="bar-3d-sheen" />
                    </div>
                  </div>
                </div>

                {/* 4. TOTAL DE PRODUTIVIDADE (NÚMERO 3D EM DESTAQUE) */}
                <div className="text-right font-black text-[16px] text-slate-900 tracking-tight font-heading drop-shadow-xs">
                  {formatNumber(op.totalProductivity)}
                </div>

                {/* 5. MOVIMENTAÇÕES */}
                <div className="text-center font-extrabold text-[14px] text-slate-800">
                  {op.movements}
                </div>

                {/* 6. PARTICIPAÇÃO (% + BADGE TENDÊNCIA 3D) */}
                <div className="flex items-center justify-center gap-1.5">
                  <span className="text-[13px] font-bold text-slate-800">
                    {op.participation.toFixed(2).replace('.', ',')}%
                  </span>
                  <div className="flex items-center text-[11px] font-bold text-emerald-700 bg-emerald-100/80 border border-emerald-300/80 px-2 py-0.5 rounded-lg shadow-2xs">
                    {op.trendGrowth >= 0 ? (
                      <>
                        <ArrowUp className="w-3 h-3 stroke-[3]" />
                        <span>{op.trendGrowth.toFixed(1).replace('.', ',')}%</span>
                      </>
                    ) : (
                      <>
                        <ArrowDown className="w-3 h-3 stroke-[3] text-red-500" />
                        <span className="text-red-600">{Math.abs(op.trendGrowth).toFixed(1).replace('.', ',')}%</span>
                      </>
                    )}
                  </div>
                </div>

                {/* 7. EVOLUÇÃO (SPARKLINE 3D COM ÁREA ILUMINADA) + CARD 3D */}
                <div className="flex items-center justify-center gap-2">
                  {renderSparkline3D(op.sparkline, op.trendGrowth >= 0, displayRank <= 3)}
                  {onOpenShowcase && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectOperator(op.name);
                        onOpenShowcase(op.name);
                      }}
                      title="Ver Card 3D 4K deste colaborador"
                      className="px-2 py-0.5 rounded-lg bg-amber-500/15 hover:bg-amber-500 hover:text-white text-amber-700 text-[10px] font-black border border-amber-400/40 transition-all cursor-pointer shadow-xs"
                    >
                      3D ➔
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Footer count indicator with 3D styling */}
      <div className="pt-2.5 px-2 flex items-center justify-between text-[11.5px] font-bold text-slate-500 border-t border-slate-200/60 mt-1">
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          Exibindo {filteredOperators.length} de {operators.length} colaboradores
        </span>
        <span className="text-[11px] font-semibold text-slate-400">Clique em qualquer colaborador para destacar no pódio 3D</span>
      </div>
    </div>
  );
};
