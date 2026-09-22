import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Search, Filter, ArrowUp, ArrowDown, ChevronDown, Check, Trophy, Sparkles, Activity, ShieldCheck, X, RotateCcw, Clock, Edit3, Crown, Maximize2, Minimize2 } from 'lucide-react';
import { OperatorSummary } from '../types';
import { normalizarAtividade, RankingColaborador, RankingRow, isMovimentacaoUma, matchActivity } from '../utils/rankingPdfParser';
import { TURNOS_DISPONIVEIS, obterTurnoColaborador, obterEstiloVisualTurno } from '../utils/turnos';
import { ModalEditarTurno } from './ModalEditarTurno';

interface LayerRankingTableProps {
  operators: OperatorSummary[];
  selectedActivity: string;
  onSelectActivity: (activity: string) => void;
  selectedTurno?: string;
  onSelectTurno?: (turno: string) => void;
  onSelectOperator: (name: string) => void;
  selectedOperator: string | null;
  onOpenShowcase?: (operatorName?: string) => void;
  onUpdateOperatorTurno?: (operatorName: string, newTurno: string) => void;
}

export const LayerRankingTable: React.FC<LayerRankingTableProps> = ({
  operators,
  selectedActivity,
  onSelectActivity,
  selectedTurno,
  onSelectTurno,
  onSelectOperator,
  selectedOperator,
  onOpenShowcase,
  onUpdateOperatorTurno
}) => {
  const tableRef = useRef<HTMLDivElement>(null);
  const [isTableFullscreen, setIsTableFullscreen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [localTurno, setLocalTurno] = useState('TODOS');
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  const [sortBy, setSortBy] = useState<'produtividade' | 'movimentacoes' | 'nome'>('produtividade');
  const [editingTurnoOperator, setEditingTurnoOperator] = useState<{ name: string; currentTurno?: string } | null>(null);

  const toggleTableFullscreen = () => {
    if (!isTableFullscreen) {
      setIsTableFullscreen(true);
      if (tableRef.current && tableRef.current.requestFullscreen) {
        tableRef.current.requestFullscreen().catch(() => {});
      }
    } else {
      setIsTableFullscreen(false);
      if (document.fullscreenElement && document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
      }
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isTableFullscreen) {
        setIsTableFullscreen(false);
      }
    };
    const handleFullscreenChange = () => {
      if (!document.fullscreenElement && isTableFullscreen) {
        setIsTableFullscreen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, [isTableFullscreen]);

  const activeTurno = selectedTurno !== undefined ? selectedTurno : localTurno;
  const handleTurnoChange = (t: string) => {
    if (onSelectTurno) {
      onSelectTurno(t);
    } else {
      setLocalTurno(t);
    }
  };

  // Contagem de colaboradores por turno
  const turnoCounts = useMemo(() => {
    const counts: Record<string, number> = {
      TODOS: operators.length,
      A: 0,
      B: 0,
      C: 0,
      ADM: 0,
      RANDS: 0,
      OUTROS: 0,
    };

    operators.forEach((op) => {
      const t = (op?.turno || obterTurnoColaborador(op?.name || "") || "").toUpperCase();
      if (counts[t] !== undefined) {
        counts[t]++;
      } else {
        counts.OUTROS++;
      }
    });

    return counts;
  }, [operators]);

  // Extrai dinamicamente todas as atividades reais encontradas na Coluna (B)
  const availableActivities = useMemo(() => {
    const list: string[] = ['TODAS AS ATIVIDADES'];
    const standard = [
      'MOVIMENTACAO',
      'APANHA',
      'APANHA PALETE',
      'CONF CARREG',
      'CONF VOLUME',
      'GOODS ISSUE',
      'MOV/EXP',
      'CONF RECEBIMENTO',
      'INVENTARIO'
    ];

    const foundSet = new Set<string>();

    operators.forEach((op) => {
      if (op.registrosDetalhados) {
        op.registrosDetalhados.forEach((r) => {
          if (r.atividade) {
            foundSet.add(r.atividade.trim());
          }
        });
      }
      if (op.topActivity) {
        foundSet.add(op.topActivity.trim());
      }
      if (op.activitiesCount) {
        Object.keys(op.activitiesCount).forEach((act) => {
          if (act) {
            foundSet.add(act.replace(/_/g, '/').trim());
          }
        });
      }
      if (op.activitiesMetrics) {
        Object.keys(op.activitiesMetrics).forEach((act) => {
          if (act) {
            foundSet.add((act || "").toUpperCase().replace(/_/g, '/').trim());
          }
        });
      }
    });

    standard.forEach((s) => {
      foundSet.add(s);
    });

    foundSet.forEach((item) => {
      if (item && (item || "").toUpperCase() !== 'TODAS AS ATIVIDADES') {
        list.push(item);
      }
    });

    return list;
  }, [operators]);

  // Mapeia o Líder de cada Atividade
  const activityLeadersMap = useMemo(() => {
    const map: Record<string, { leaderName: string; leaderScore: number; totalVolume: number }> = {};

    availableActivities.forEach((act) => {
      if (act === 'TODAS AS ATIVIDADES' || isMovimentacaoUma(act)) return;

      let maxScore = -1;
      let topName = '—';
      let sumTotal = 0;

      operators.forEach((op) => {
        let score = 0;
        if (op.registrosDetalhados && op.registrosDetalhados.length > 0) {
          const matching = op.registrosDetalhados.filter((r) => matchActivity(r.atividade, act));
          score = matching.reduce((acc, r) => acc + (r.qtdOrdens || 0), 0);
        } else if (op.activitiesMetrics && typeof op.activitiesMetrics === 'object') {
          const actNorm = normalizarAtividade(act);
          let m = op.activitiesMetrics[actNorm];
          if (!m) {
            const key = Object.keys(op.activitiesMetrics).find((k) => matchActivity(k, act));
            if (key) m = op.activitiesMetrics[key];
          }
          if (m) score = m.qtdOrdens || 0;
        } else if (op.activitiesCount) {
          score = op.activitiesCount[act] || 0;
        }

        if (score > 0) {
          sumTotal += score;
          if (score > maxScore) {
            maxScore = score;
            topName = op.name;
          }
        }
      });

      if (maxScore > 0) {
        map[act] = {
          leaderName: topName,
          leaderScore: maxScore,
          totalVolume: sumTotal
        };
      }
    });

    return map;
  }, [operators, availableActivities]);

  /*
   * RECALCULA O RANKING A PARTIR DOS REGISTROS INDIVIDUAIS
   * PRODUTIVIDADE = Qtd. Serv. (4º campo do PDF)
   */
  const filteredOperators = useMemo<OperatorSummary[]>(() => {
    const searchNorm = normalizarAtividade(searchTerm);

    // 1. Mapeia e recalcula os totais de cada colaborador para a atividade selecionada
    let resultado = operators.map((colab) => {
      // Se possui o mapeamento de métricas pré-agrupado de altíssima performance (essencial para >99k linhas)
      if (colab.activitiesMetrics && typeof colab.activitiesMetrics === 'object') {
        if (!selectedActivity || selectedActivity === 'TODAS AS ATIVIDADES') {
          return colab;
        }

        const atvNorm = normalizarAtividade(selectedActivity);
        let metrics = colab.activitiesMetrics[atvNorm];

        if (!metrics) {
          const matchingKey = Object.keys(colab.activitiesMetrics).find((key) => {
            if (key === atvNorm) return true;
            if (key.includes(atvNorm) || atvNorm.includes(key)) return true;
            // Abreviações
            if (atvNorm.includes('CONF_VOLUME') && (key.includes('VOLUME') || key.includes('VOL'))) return true;
            if (atvNorm.includes('CONF_CARREG') && (key.includes('CARREG') || key.includes('CARGA'))) return true;
            if (atvNorm.includes('CONF_RECEB') && (key.includes('RECEB') || key.includes('REC'))) return true;
            if (atvNorm.includes('MOV_EXP') && (key.includes('MOV') && key.includes('EXP'))) return true;
            if (atvNorm.includes('APANHA') && (key.includes('APANHA') || key.includes('SEPAR') || key.includes('PICK'))) return true;
            if (atvNorm.includes('GOODS_ISSUE') && (key.includes('GOODS') || key.includes('ISSUE') || key.includes('BAIXA'))) return true;
            if (atvNorm.includes('MOVIMENTACAO') && key.includes('MOV')) return true;
            if (atvNorm.includes('INVENTARIO') && key.includes('INV')) return true;
            return false;
          });
          if (matchingKey) {
            metrics = colab.activitiesMetrics[matchingKey];
          }
        }

        if (metrics) {
          const totalMov = metrics.qtdServ + metrics.qtdPecas + metrics.qtdLotes;
          return {
            ...colab,
            totalProductivity: metrics.qtdOrdens,
            movements: totalMov > 0 ? totalMov : (metrics.qtdServ || metrics.registros),
            qtdOrdens: metrics.qtdOrdens,
            qtdPecas: metrics.qtdPecas,
            qtdLotes: metrics.qtdLotes,
            qtdServ: metrics.qtdServ,
            qtdItens: metrics.qtdItens,
            qtdEnd: metrics.qtdEnd,
            registros: metrics.registros,
            registrosDetalhados: [],
          };
        } else {
          return {
            ...colab,
            totalProductivity: 0,
            movements: 0,
            qtdOrdens: 0,
            qtdPecas: 0,
            qtdLotes: 0,
            qtdServ: 0,
            qtdItens: 0,
            qtdEnd: 0,
            registros: 0,
            registrosDetalhados: [],
          };
        }
      }

      // Se possui registros detalhados, filtra estritamente por atividade
      if (colab.registrosDetalhados && colab.registrosDetalhados.length > 0) {
        const registrosFiltrados = colab.registrosDetalhados.filter((registro) => {
          if (!selectedActivity || selectedActivity === 'TODAS AS ATIVIDADES') {
            return true;
          }

          const regNorm = normalizarAtividade(registro.atividade);
          const atvNorm = normalizarAtividade(selectedActivity);

          if (regNorm === atvNorm) return true;
          if (regNorm.includes(atvNorm) || atvNorm.includes(regNorm)) return true;

          // Abreviações comuns
          if (atvNorm.includes('CONF VOLUME') && (regNorm.includes('VOLUME') || regNorm.includes('VOL'))) return true;
          if (atvNorm.includes('CONF CARREG') && (regNorm.includes('CARREG') || regNorm.includes('CARGA'))) return true;
          if (atvNorm.includes('CONF RECEB') && (regNorm.includes('RECEB') || regNorm.includes('REC'))) return true;
          if (atvNorm.includes('MOV EXP') && (regNorm.includes('MOV') && regNorm.includes('EXP'))) return true;
          if (atvNorm.includes('APANHA') && (regNorm.includes('APANHA') || regNorm.includes('SEPAR') || regNorm.includes('PICK'))) return true;
          if (atvNorm.includes('GOODS ISSUE') && (regNorm.includes('GOODS') || regNorm.includes('ISSUE') || regNorm.includes('BAIXA'))) return true;
          if (atvNorm.includes('MOVIMENTACAO') && regNorm.includes('MOV')) return true;

          return false;
        });

        const sumOrdens = registrosFiltrados.reduce((t, r) => t + r.qtdOrdens, 0);
        const sumPecas = registrosFiltrados.reduce((t, r) => t + r.qtdPecas, 0);
        const sumLotes = registrosFiltrados.reduce((t, r) => t + r.qtdLotes, 0);
        const sumServ = registrosFiltrados.reduce((t, r) => t + r.qtdServ, 0);
        const sumItens = registrosFiltrados.reduce((t, r) => t + r.qtdItens, 0);
        const sumEnd = registrosFiltrados.reduce((t, r) => t + r.qtdEnd, 0);

        const totalMov = sumServ + sumPecas + sumLotes;

        return {
          ...colab,
          totalProductivity: sumOrdens, // PRODUTIVIDADE = Qtd. Ordens
          movements: totalMov > 0 ? totalMov : (sumServ || registrosFiltrados.length),
          qtdOrdens: sumOrdens,
          qtdPecas: sumPecas,
          qtdLotes: sumLotes,
          qtdServ: sumServ,
          qtdItens: sumItens,
          qtdEnd: sumEnd,
          registros: registrosFiltrados.length,
          registrosDetalhados: registrosFiltrados,
        };
      }

      // Fallback se não tiver registros detalhados gravados
      if (selectedActivity && selectedActivity !== 'TODAS AS ATIVIDADES') {
        const actVal = colab.activitiesCount ? (colab.activitiesCount[selectedActivity] || 0) : 0;
        return {
          ...colab,
          totalProductivity: actVal,
          registros: actVal > 0 ? 1 : 0,
        };
      }

      return colab;
    });

    // 2. Remove colaboradores que não possuem nenhum registro na atividade selecionada
    if (selectedActivity && selectedActivity !== 'TODAS AS ATIVIDADES') {
      resultado = resultado.filter((c) => (c.registros ?? 0) > 0 || c.totalProductivity > 0);
    }

    // 2.5. Filtro por Turno (A, B, C, ADM, RANDS)
    if (activeTurno && activeTurno !== 'TODOS' && activeTurno !== 'TODOS OS TURNOS') {
      resultado = resultado.filter((c) => {
        const t = c.turno || obterTurnoColaborador(c.name);
        return (t || "").toUpperCase() === (activeTurno || "").toUpperCase();
      });
    }

    // 3. Aplica busca por nome (se houver termo digitado)
    if (searchNorm) {
      resultado = resultado.filter((c) => normalizarAtividade(c.name).includes(searchNorm));
    }

    // 4. Ordenação
    const rankingOrdenado = Array.isArray(resultado)
      ? [...resultado].sort((a, b) => {
          if (sortBy === 'produtividade') {
            const prodA = a?.totalProductivity || 0;
            const prodB = b?.totalProductivity || 0;
            if (prodB !== prodA) return prodB - prodA;
          } else if (sortBy === 'movimentacoes') {
            const movA = a?.movements || 0;
            const movB = b?.movements || 0;
            if (movB !== movA) return movB - movA;
          }

          const nomeA = String(a?.name || "");
          const nomeB = String(b?.name || "");
          return nomeA.localeCompare(nomeB, 'pt-BR', { sensitivity: 'base' });
        })
      : [];
    resultado = rankingOrdenado;

    // 5. Recalcula posições e percentuais
    const totalProdFiltrado = resultado.reduce((s, c) => s + c.totalProductivity, 0);

    return resultado.map((colab, index) => ({
      ...colab,
      rank: index + 1,
      participation: totalProdFiltrado > 0 ? +((colab.totalProductivity / totalProdFiltrado) * 100).toFixed(2) : 0,
    }));
  }, [operators, selectedActivity, activeTurno, searchTerm, sortBy]);

  // Maior valor para cálculo visual das barras de progresso
  const maxProductivity = useMemo(() => {
    if (filteredOperators.length === 0) return 1;
    return Math.max(...filteredOperators.map((o) => o.totalProductivity));
  }, [filteredOperators]);

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

  const isFilterActive = selectedActivity !== 'TODAS AS ATIVIDADES' || searchTerm.trim() !== '' || sortBy !== 'produtividade';

  return (
    <div
      ref={tableRef}
      className={`ranking-table-3d transition-all duration-300 select-none ${
        isTableFullscreen
          ? 'fixed inset-0 z-[9999] p-6 md:p-8 bg-slate-950/95 backdrop-blur-2xl flex flex-col justify-between overflow-hidden w-screen h-screen shadow-2xl'
          : 'w-full h-[510px] p-6 flex flex-col justify-between relative overflow-hidden'
      }`}
    >
      {/* Table Header: Title + Search + Filter Button */}
      <div className="flex items-center justify-between pb-3.5 border-b border-slate-200/60">
        <div className="flex items-center gap-3.5">
          {/* 3D Metallic Crown Badge */}
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-amber-400 via-amber-500 to-amber-600 flex items-center justify-center text-white shadow-lg shadow-amber-500/35 border border-amber-300/60 relative group">
            <Trophy className="w-5 h-5 text-white drop-shadow-md stroke-[2.2]" />
            <Sparkles className="w-3.5 h-3.5 text-amber-200 absolute -top-1 -right-1 animate-spin" style={{ animationDuration: '6s' }} />
          </div>

          <div className="flex items-center gap-3">
            <h3 className="text-[21px] font-black tracking-tight text-[#0f2444] uppercase font-heading drop-shadow-xs flex items-center gap-2">
              RANKING COMPLETO
              <span className="text-[10px] font-black px-3 py-1 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 text-white tracking-wider uppercase shadow-xs">
                PRODUTIVIDADE SAGA (QTD. ORDENS)
              </span>
            </h3>

            {/* Badge de Atividade Ativa com Botão X para Limpar */}
            {selectedActivity !== 'TODAS AS ATIVIDADES' && (
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100 text-amber-950 font-extrabold text-xs shadow-xs uppercase tracking-wide border border-amber-300">
                <span>{selectedActivity}</span>
                <button
                  onClick={() => onSelectActivity('TODAS AS ATIVIDADES')}
                  title="Remover filtro de atividade"
                  className="w-4 h-4 rounded-full bg-amber-200/80 hover:bg-amber-300 flex items-center justify-center transition-colors cursor-pointer ml-1"
                >
                  <X className="w-2.5 h-2.5" />
                </button>
              </div>
            )}

            {/* Badge de Turno Ativo com Botão X para Limpar */}
            {activeTurno !== 'TODOS' && (
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-900 text-amber-300 font-extrabold text-xs shadow-md uppercase tracking-wide border border-slate-700">
                <span>Turno: {activeTurno}</span>
                <button
                  onClick={() => handleTurnoChange('TODOS')}
                  title="Remover filtro de turno"
                  className="w-4 h-4 rounded-full bg-white/20 hover:bg-white/40 flex items-center justify-center transition-colors cursor-pointer ml-1 text-white"
                >
                  <X className="w-2.5 h-2.5" />
                </button>
              </div>
            )}

            {searchTerm.trim() !== '' && (
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-500 text-white font-bold text-xs shadow-sm uppercase">
                <span>Busca: "{searchTerm}"</span>
                <button
                  onClick={() => setSearchTerm('')}
                  title="Limpar busca"
                  className="w-4 h-4 rounded-full bg-white/20 hover:bg-white/40 flex items-center justify-center transition-colors cursor-pointer"
                >
                  <X className="w-2.5 h-2.5" />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Right Search & Filters */}
        <div className="flex items-center gap-3">
          {/* Search Box */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar colaborador..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-56 h-9.5 pl-10 pr-4 text-xs font-semibold text-slate-800 placeholder-slate-400 bg-white/90 border border-slate-200/80 rounded-2xl shadow-2xs focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500 transition-all"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Filter Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowFilterDropdown(!showFilterDropdown)}
              className="flex items-center gap-2 px-3.5 py-2 rounded-2xl text-xs font-black border shadow-xs transition-all duration-150 cursor-pointer bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-white border-amber-400/80"
            >
              <Filter className="w-3.5 h-3.5" />
              <span className="uppercase tracking-wide font-heading">
                {selectedActivity}
              </span>
              <ChevronDown className="w-3 h-3 ml-0.5" />
            </button>

            {/* Filter Dropdown Menu */}
            {showFilterDropdown && (
              <div className="absolute right-0 mt-2.5 w-84 rounded-3xl bg-white/95 backdrop-blur-2xl border border-slate-200/90 shadow-2xl p-3.5 z-50 animate-in fade-in zoom-in-95 duration-150">
                <div className="flex items-center justify-between px-2 py-1">
                  <span className="text-[10.5px] font-black uppercase tracking-wider text-slate-400">
                    Filtrar por Atividade (Coluna B)
                  </span>
                  {isFilterActive && (
                    <button
                      onClick={() => {
                        onSelectActivity('TODAS AS ATIVIDADES');
                        setSearchTerm('');
                        setSortBy('produtividade');
                      }}
                      className="text-[10px] font-bold text-amber-600 hover:text-amber-700 flex items-center gap-1 cursor-pointer"
                    >
                      <RotateCcw className="w-2.5 h-2.5" />
                      Resetar
                    </button>
                  )}
                </div>

                <div className="flex flex-col gap-1 max-h-64 overflow-y-auto custom-scrollbar my-1">
                  {availableActivities.map((act) => {
                    const isSelected = selectedActivity === act;
                    const leaderInfo = activityLeadersMap[act];

                    return (
                      <button
                        key={act}
                        onClick={() => {
                          onSelectActivity(act);
                          setShowFilterDropdown(false);
                        }}
                        className={`w-full text-left px-3.5 py-2 rounded-xl text-xs font-bold flex items-center justify-between transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-sm'
                            : 'text-slate-700 hover:bg-slate-100/80'
                        }`}
                      >
                        <div className="flex flex-col min-w-0 pr-2">
                          <span className="truncate">{act}</span>
                          {leaderInfo && (
                            <span className={`text-[10px] font-medium truncate flex items-center gap-1 ${
                              isSelected ? 'text-amber-100 font-bold' : 'text-slate-500'
                            }`}>
                              👑 Líder: <span className="font-bold">{leaderInfo.leaderName.split(' ').slice(0, 2).join(' ')}</span> ({formatNumber(leaderInfo.leaderScore)})
                            </span>
                          )}
                        </div>
                        {isSelected && <Check className="w-3.5 h-3.5 shrink-0 ml-1" />}
                      </button>
                    );
                  })}
                </div>

                {/* Filtro por Turno no Dropdown */}
                <div className="border-t border-slate-100 my-2 pt-2">
                  <div className="px-2 py-1 text-[10.5px] font-black uppercase tracking-wider text-slate-400 flex items-center gap-1">
                    <Clock className="w-3 h-3 text-amber-500" />
                    Filtrar por Turno
                  </div>

                  <div className="grid grid-cols-3 gap-1.5 mt-1">
                    {TURNOS_DISPONIVEIS.map((t) => {
                      const isSel = (activeTurno || "").toUpperCase() === (t?.id || "").toUpperCase();
                      const count = turnoCounts[t.id] ?? 0;
                      return (
                        <button
                          key={t.id}
                          onClick={() => {
                            handleTurnoChange(t.id);
                            setShowFilterDropdown(false);
                          }}
                          className={`px-2 py-1.5 rounded-xl text-[11px] font-black text-center transition-all cursor-pointer flex items-center justify-between ${
                            isSel
                              ? 'bg-slate-900 text-white shadow-md'
                              : 'bg-slate-100 text-slate-700 hover:bg-slate-200/80'
                          }`}
                        >
                          <span className="truncate">{t.id}</span>
                          <span className={`text-[9px] px-1 py-0.2 rounded-md font-bold ${
                            isSel ? 'bg-amber-400 text-slate-950' : 'bg-slate-200 text-slate-600'
                          }`}>
                            {count}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="border-t border-slate-100 my-2 pt-2.5">
                  <div className="px-2 py-1 text-[10.5px] font-black uppercase tracking-wider text-slate-400">
                    Ordenar Por
                  </div>

                  <div className="grid grid-cols-3 gap-1.5 mt-1">
                    <button
                      onClick={() => setSortBy('produtividade')}
                      className={`px-2 py-2 rounded-xl text-[11px] font-black text-center transition-all cursor-pointer ${
                        sortBy === 'produtividade'
                          ? 'bg-slate-900 text-white shadow-md'
                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200/80'
                      }`}
                    >
                      Produtiv.
                    </button>

                    <button
                      onClick={() => setSortBy('movimentacoes')}
                      className={`px-2 py-2 rounded-xl text-[11px] font-black text-center transition-all cursor-pointer ${
                        sortBy === 'movimentacoes'
                          ? 'bg-slate-900 text-white shadow-md'
                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200/80'
                      }`}
                    >
                      Moviment.
                    </button>

                    <button
                      onClick={() => setSortBy('nome')}
                      className={`px-2 py-2 rounded-xl text-[11px] font-black text-center transition-all cursor-pointer ${
                        sortBy === 'nome'
                          ? 'bg-slate-900 text-white shadow-md'
                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200/80'
                      }`}
                    >
                      Nome A-Z
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
              className="flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-white font-black text-xs shadow-md shadow-amber-500/30 border border-amber-300/50 transition-all cursor-pointer group"
            >
              <Trophy className="w-3.5 h-3.5 group-hover:rotate-12 transition-transform" />
              <span>APRESENTAÇÃO 3D (RELOAD)</span>
              <ChevronDown className="w-3 h-3 ml-0.5" />
            </button>
          )}

          {/* Botão de Tela Cheia para o Ranking Completo */}
          <button
            onClick={toggleTableFullscreen}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-2xl font-black text-xs transition-all cursor-pointer shadow-md border ${
              isTableFullscreen
                ? 'bg-rose-600 hover:bg-rose-500 text-white border-rose-400/60 shadow-rose-600/30'
                : 'bg-slate-900 hover:bg-slate-800 text-amber-400 hover:text-amber-300 border-slate-700 shadow-slate-900/40'
            }`}
            title={isTableFullscreen ? "Sair da Tela Cheia (ESC)" : "Expandir Ranking Completo em Tela Cheia"}
          >
            {isTableFullscreen ? (
              <>
                <Minimize2 className="w-4 h-4 text-rose-200" />
                <span>SAIR DA TELA CHEIA</span>
              </>
            ) : (
              <>
                <Maximize2 className="w-4 h-4 text-amber-400" />
                <span>TELA CHEIA</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Banner Destaque do Líder da Atividade Selecionada (Coluna B) */}
      {selectedActivity !== 'TODAS AS ATIVIDADES' && activityLeadersMap[selectedActivity] && (
        <div className="my-1.5 px-4.5 py-2 rounded-2xl bg-gradient-to-r from-amber-500/15 via-orange-500/10 to-amber-500/15 border border-amber-300/70 flex items-center justify-between text-xs font-bold text-slate-800 shadow-xs animate-in fade-in duration-200">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center text-white shadow-xs">
              <Crown className="w-4 h-4 fill-amber-100" />
            </div>
            <div>
              <span className="text-[10px] font-black text-amber-950 uppercase tracking-widest block leading-none font-heading">
                LÍDER DA ATIVIDADE ({selectedActivity})
              </span>
              <span className="text-[14px] font-black text-slate-900 tracking-tight font-heading mt-0.5 block">
                {activityLeadersMap[selectedActivity].leaderName}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right">
              <span className="text-[10px] font-bold text-slate-500 block leading-none">
                Produtividade do Líder
              </span>
              <span className="text-[14px] font-black text-amber-700 tracking-tight font-heading mt-0.5 block">
                {formatNumber(activityLeadersMap[selectedActivity].leaderScore)} Ordens
              </span>
            </div>
            <span className="text-[10.5px] font-extrabold text-amber-900 bg-amber-100/90 px-3 py-1 rounded-xl border border-amber-200">
              Total Atividade: {formatNumber(activityLeadersMap[selectedActivity].totalVolume)}
            </span>
          </div>
        </div>
      )}
      <div className="flex items-center justify-between py-1.5 px-3 bg-slate-100/90 rounded-2xl border border-slate-200/80 my-1 shadow-2xs">
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-black text-slate-500 uppercase tracking-wider flex items-center gap-1">
            <Clock className="w-3.5 h-3.5 text-amber-500" />
            Turno:
          </span>
          <div className="flex items-center gap-1 bg-white p-0.5 rounded-xl border border-slate-200/80">
            {TURNOS_DISPONIVEIS.map((t) => {
              const isSelected = (activeTurno || "").toUpperCase() === (t?.id || "").toUpperCase();
              const count = turnoCounts[t.id] ?? 0;
              return (
                <button
                  key={t.id}
                  onClick={() => handleTurnoChange(t.id)}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-black transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-slate-900 text-white shadow-sm ring-1 ring-slate-700'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  <span>{t.label}</span>
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-extrabold ${
                    isSelected ? 'bg-amber-400 text-slate-950' : 'bg-slate-100 text-slate-600'
                  }`}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Resumo do Turno Ativo */}
        <div className="flex items-center gap-3 text-xs font-bold text-slate-500 pr-1">
          <span>Mostrando: <strong className="text-slate-900">{filteredOperators.length}</strong> de <strong className="text-slate-900">{operators.length}</strong> colaboradores</span>
          {activeTurno !== 'TODOS' && (
            <button
              onClick={() => handleTurnoChange('TODOS')}
              className="text-[11px] font-black text-amber-600 hover:text-amber-700 underline cursor-pointer"
            >
              Ver Todos os Turnos
            </button>
          )}
        </div>
      </div>

      {/* 3D Ultra Column Headers */}
      <div className="grid grid-cols-[70px_250px_1fr_170px_130px_130px_110px] items-center px-4 py-2.5 text-[11px] font-black uppercase tracking-wider text-slate-400 border-b border-slate-200/50 my-1">
        <div className="text-center flex items-center justify-center gap-1">
          <ShieldCheck className="w-3.5 h-3.5 text-amber-500" />
          POSIÇÃO
        </div>
        <div>COLABORADOR & TURNO</div>
        <div className="px-2">DESEMPENHO RELATIVO</div>
        <div className="text-right">PRODUTIVIDADE (QTD. ORDENS)</div>
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
            <p className="text-sm font-bold">Nenhum registro encontrado para este filtro de atividade ou turno.</p>
            {isFilterActive && (
              <button
                onClick={() => {
                  onSelectActivity('TODAS AS ATIVIDADES');
                  handleTurnoChange('TODOS');
                  setSearchTerm('');
                  setSortBy('produtividade');
                }}
                className="mt-3 px-4 py-1.5 rounded-xl bg-amber-500 text-white font-bold text-xs shadow-md hover:bg-amber-600 transition-colors cursor-pointer"
              >
                Limpar Filtros e Ver Todas
              </button>
            )}
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
                className={`ranking-row-3d grid grid-cols-[70px_250px_1fr_170px_130px_130px_110px] items-center px-4 py-2 cursor-pointer rounded-2xl border transition-all ${
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

                {/* 2. COLABORADOR COM BADGE DE TURNO EDITÁVEL */}
                <div className="flex items-center gap-2 pr-2 overflow-hidden">
                  <span className="text-[13.5px] font-black text-slate-900 tracking-tight uppercase truncate font-heading">
                    {op.name}
                  </span>
                  {(() => {
                    const turno = op.turno || obterTurnoColaborador(op.name);
                    const turnoStyle = obterEstiloVisualTurno(turno);
                    return onUpdateOperatorTurno ? (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingTurnoOperator({ name: op.name, currentTurno: turno });
                        }}
                        title={`Clique para alterar o turno de ${op.name}`}
                        className={`group/badge flex items-center gap-1 px-2 py-0.5 rounded-md text-[9.5px] font-black uppercase tracking-wider shrink-0 border shadow-2xs transition-all hover:scale-105 hover:ring-2 hover:ring-amber-400 cursor-pointer ${turnoStyle.badgeBg} ${turnoStyle.badgeText} ${turnoStyle.badgeBorder}`}
                      >
                        <span>{turnoStyle.tag}</span>
                        <Edit3 className="w-2.5 h-2.5 opacity-60 group-hover/badge:opacity-100 transition-opacity" />
                      </button>
                    ) : (
                      <span className={`px-2 py-0.5 rounded-md text-[9.5px] font-black uppercase tracking-wider shrink-0 border shadow-2xs ${turnoStyle.badgeBg} ${turnoStyle.badgeText} ${turnoStyle.badgeBorder}`}>
                        {turnoStyle.tag}
                      </span>
                    );
                  })()}
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

                {/* 4. PRODUTIVIDADE = QTD. SERV. (NÚMERO 3D EM DESTAQUE) */}
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
          Exibindo {filteredOperators.length} colaboradores na atividade {selectedActivity !== 'TODAS AS ATIVIDADES' ? `"${selectedActivity}"` : 'geral'}
        </span>
        <span className="text-[11px] font-semibold text-slate-400">Produtividade calculada com base na coluna Qtd. Ordens do PDF</span>
      </div>

      {/* Modal de Edição de Turno */}
      <ModalEditarTurno
        isOpen={editingTurnoOperator !== null}
        onClose={() => setEditingTurnoOperator(null)}
        operatorName={editingTurnoOperator?.name || null}
        currentTurno={editingTurnoOperator?.currentTurno}
        allOperators={operators}
        onSelectOperator={(name) => {
          const found = operators.find((o) => (o?.name || "").toUpperCase() === (name || "").toUpperCase());
          setEditingTurnoOperator({
            name,
            currentTurno: found?.turno || obterTurnoColaborador(name)
          });
        }}
        onSaveTurno={(name, newTurno) => {
          onUpdateOperatorTurno?.(name, newTurno);
          setEditingTurnoOperator({ name, currentTurno: newTurno });
        }}
      />
    </div>
  );
};
