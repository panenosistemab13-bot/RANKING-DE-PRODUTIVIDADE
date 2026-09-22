import React, { useState, useEffect, useMemo } from 'react';
import { getAuth, onAuthStateChanged, User } from 'firebase/auth';
import { LayerBackground } from './components/LayerBackground';
import { HeaderNav } from './components/HeaderNav';
import { LayerPodium3D } from './components/LayerPodium3D';
import { LayerResumoGeral } from './components/LayerResumoGeral';
import { LayerRankingTable } from './components/LayerRankingTable';
import { LayerCinematicShowcase } from './components/LayerCinematicShowcase';
import { DataImportExportModal } from './components/DataImportExportModal';
import { LoginModal } from './components/LoginModal';
import { EMPTY_OPERATORS, EMPTY_KPIS } from './data/productivityData';
import { OperatorSummary, DashboardKPIs, PeriodPreset } from './types';
import { ouvirRankingRealtime, carregarCacheLocal, salvarRankingRealtime, app } from './services/firebase';
import { normalizarAtividade, parseDataBRTimestamp } from './utils/rankingPdfParser';
import { obterTurnoColaborador, salvarTurnoCustomizado } from './utils/turnos';

function formatarFrasePeriodo(label: string | null | undefined, operators: OperatorSummary[]): string {
  // Se o rótulo já contém a frase completa solicitada
  if (label && /in[íi]cio\s+do\s+per[íi]odo/i.test(label)) {
    return label;
  }

  // Tenta extrair as datas dos registros dos colaboradores
  const datasSet = new Set<string>();
  if (operators && operators.length > 0) {
    for (const op of operators) {
      if (op.dataInicio && /^\d{2}\/\d{2}\/\d{4}$/.test(op.dataInicio)) {
        datasSet.add(op.dataInicio);
      }
      if (op.dataFim && /^\d{2}\/\d{2}\/\d{4}$/.test(op.dataFim)) {
        datasSet.add(op.dataFim);
      }
      if (op.datas && Array.isArray(op.datas)) {
        op.datas.forEach((d) => {
          if (/^\d{2}\/\d{2}\/\d{4}$/.test(d.trim())) datasSet.add(d.trim());
        });
      }
      if (op.registrosDetalhados && Array.isArray(op.registrosDetalhados)) {
        op.registrosDetalhados.forEach((r: any) => {
          if (r && r.data && /^\d{2}\/\d{2}\/\d{4}$/.test(String(r.data).trim())) {
            datasSet.add(String(r.data).trim());
          }
        });
      }
    }
  }

  // Se o label anterior continha datas no formato DD/MM/AAAA
  if (label) {
    const matches = label.match(/\b\d{2}\/\d{2}\/\d{4}\b/g);
    if (matches) {
      matches.forEach((d) => datasSet.add(d));
    }
  }

  const list = Array.from(datasSet).filter((d) => parseDataBRTimestamp(d) > 0);
  if (list.length > 0) {
    list.sort((a, b) => {
      const tA = parseDataBRTimestamp(a) || 0;
      const tB = parseDataBRTimestamp(b) || 0;
      return tA - tB;
    });
    const dInicio = list[0];
    const dFim = list[list.length - 1];
    return `início do período ${dInicio} ao fim do período ${dFim}`;
  }

  // Exemplo e padrão real para período
  return "início do período 02/01/2026 ao fim do período 20/09/2026";
}

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [periodPreset, setPeriodPreset] = useState<PeriodPreset>('reference');
  const [viewMode, setViewMode] = useState<'showcase' | 'list'>('showcase');
  const [selectedActivity, setSelectedActivity] = useState<string>('TODAS AS ATIVIDADES');
  const [selectedTurno, setSelectedTurno] = useState<string>('TODOS');
  const [selectedOperator, setSelectedOperator] = useState<string | null>(null);
  const [isDataModalOpen, setIsDataModalOpen] = useState(false);

  // Custom data if imported by user or loaded from Firebase Realtime Database
  const [customOperators, setCustomOperators] = useState<OperatorSummary[] | null>(() => {
    const cached = carregarCacheLocal();
    return cached ? cached.operators : null;
  });
  const [customLabel, setCustomLabel] = useState<string | null>(() => {
    const cached = carregarCacheLocal();
    if (cached) {
      return formatarFrasePeriodo(cached.label, cached.operators);
    }
    return null;
  });
  const [isFirebaseConnected, setIsFirebaseConnected] = useState<boolean>(true);

  // Auth listener
  useEffect(() => {
    const auth = getAuth(app);
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  // Listen to Firebase Realtime Database in real time
  useEffect(() => {
    const unsubscribe = ouvirRankingRealtime(
      (data) => {
        if (data && data.operators && data.operators.length > 0) {
          console.log("[Firebase Realtime Database] Dados recebidos em tempo real:", data);
          setCustomOperators(data.operators);
          setCustomLabel(formatarFrasePeriodo(data.label, data.operators));
        }
        setIsFirebaseConnected(true);
      },
      (err) => {
        console.warn("[Firebase Realtime Database] Erro de conexão:", err);
      }
    );

    return () => {
      unsubscribe();
    };
  }, []);

  // Viewport dimensions for proportional scaling
  const [windowSize, setWindowSize] = useState({
    width: typeof window !== 'undefined' ? window.innerWidth : 1920,
    height: typeof window !== 'undefined' ? window.innerHeight : 1080
  });

  useEffect(() => {
    const handleResize = () => {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight
      });
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Compute active dataset based on preset and assign turno
  const rawActiveOperators = useMemo(() => {
    const list = customOperators && customOperators.length > 0 ? customOperators : EMPTY_OPERATORS;
    return list.map((op) => ({
      ...op,
      turno: op.turno || obterTurnoColaborador(op.name),
    }));
  }, [customOperators]);

  // Helper to filter and recalculate top operators by Shift (Turno) and Activity (Atividade)
  const filteredActiveOperators = useMemo(() => {
    // 1. Filtro por Turno (A, B, C, ADM, RANDS)
    let list = rawActiveOperators;
    if (selectedTurno && selectedTurno !== 'TODOS' && selectedTurno !== 'TODOS OS TURNOS') {
      list = list.filter((op) => {
        const t = op.turno || obterTurnoColaborador(op.name) || "";
        return t.toUpperCase() === (selectedTurno || "").toUpperCase();
      });
    }

    // 2. Filtro por Atividade
    if (selectedActivity && selectedActivity !== 'TODAS AS ATIVIDADES') {
      const targetNorm = normalizarAtividade(selectedActivity);

      list = list
        .map((colab) => {
          if (colab.registrosDetalhados && colab.registrosDetalhados.length > 0) {
            const matching = colab.registrosDetalhados.filter((r) => {
              const regNorm = normalizarAtividade(r.atividade);
              if (regNorm === targetNorm) return true;
              if (regNorm.includes(targetNorm) || targetNorm.includes(regNorm)) return true;
              if (targetNorm.includes('CONF VOLUME') && (regNorm.includes('VOLUME') || regNorm.includes('VOL'))) return true;
              if (targetNorm.includes('CONF CARREG') && (regNorm.includes('CARREG') || regNorm.includes('CARGA'))) return true;
              if (targetNorm.includes('CONF RECEB') && (regNorm.includes('RECEB') || regNorm.includes('REC'))) return true;
              if (targetNorm.includes('MOV EXP') && (regNorm.includes('MOV') && regNorm.includes('EXP'))) return true;
              if (targetNorm.includes('APANHA') && (regNorm.includes('APANHA') || regNorm.includes('SEPAR') || regNorm.includes('PICK'))) return true;
              if (targetNorm.includes('GOODS ISSUE') && (regNorm.includes('GOODS') || regNorm.includes('ISSUE') || regNorm.includes('BAIXA'))) return true;
              if (targetNorm.includes('MOVIMENTACAO') && regNorm.includes('MOV')) return true;
              return false;
            });

            const sumOrdens = matching.reduce((t, r) => t + r.qtdOrdens, 0);
            const sumServ = matching.reduce((t, r) => t + r.qtdServ, 0);
            const sumPecas = matching.reduce((t, r) => t + r.qtdPecas, 0);
            const sumLotes = matching.reduce((t, r) => t + r.qtdLotes, 0);

            return {
              ...colab,
              totalProductivity: sumOrdens,
              movements: sumServ + sumPecas + sumLotes || sumServ || matching.length,
              registros: matching.length,
            };
          }

          const actVal = colab.activitiesCount ? (colab.activitiesCount[selectedActivity] || 0) : 0;
          return {
            ...colab,
            totalProductivity: actVal,
            registros: actVal > 0 ? 1 : 0,
          };
        })
        .filter((c) => c.totalProductivity > 0);
    }

    // Ordenação decrescente por produtividade (Qtd. Ordens)
    const sorted = [...list].sort((a, b) => {
      const prodA = a?.totalProductivity || 0;
      const prodB = b?.totalProductivity || 0;
      if (prodB !== prodA) return prodB - prodA;
      
      const nomeA = String(a?.name || "");
      const nomeB = String(b?.name || "");
      return nomeA.localeCompare(nomeB, 'pt-BR', { sensitivity: 'base' });
    });

    const totalSubsetProd = sorted.reduce((sum, c) => sum + c.totalProductivity, 0);

    return sorted.map((colab, idx) => ({
      ...colab,
      rank: idx + 1,
      participation: totalSubsetProd > 0 ? +((colab.totalProductivity / totalSubsetProd) * 100).toFixed(2) : 0,
    }));
  }, [rawActiveOperators, selectedTurno, selectedActivity]);

  // Compute active KPIs (dinâmicos conforme o turno ou atividade selecionados)
  const currentKPIs = useMemo<DashboardKPIs>(() => {
    const dataset = filteredActiveOperators.length > 0 ? filteredActiveOperators : rawActiveOperators;

    if (dataset && dataset.length > 0) {
      const totalProd = dataset.reduce((acc, curr) => acc + curr.totalProductivity, 0);
      const totalMov = dataset.reduce((acc, curr) => acc + curr.movements, 0);

      // Find predominant activity across dataset
      const actMap: Record<string, number> = {};
      dataset.forEach(op => {
        if (op.activitiesCount) {
          Object.entries(op.activitiesCount).forEach(([act, val]) => {
            actMap[act] = (actMap[act] || 0) + val;
          });
        }
      });
      let bestAct = "APANHA";
      let maxActCount = 0;
      Object.entries(actMap).forEach(([act, count]) => {
        if (count > maxActCount) {
          maxActCount = count;
          bestAct = act;
        }
      });

      const shiftSuffix = selectedTurno !== 'TODOS' ? ` • Turno ${selectedTurno}` : '';

      return {
        totalProductivity: totalProd,
        totalOperators: dataset.length,
        totalMovements: totalMov,
        averagePerOperator: Math.round(totalProd / (dataset.length || 1)),
        topOperator: {
          name: dataset[0]?.name || 'N/A',
          productivity: dataset[0]?.totalProductivity || 0
        },
        lowestOperator: {
          name: dataset[dataset.length - 1]?.name || 'N/A',
          productivity: dataset[dataset.length - 1]?.totalProductivity || 0
        },
        topActivity: `${bestAct} (${maxActCount.toLocaleString('pt-BR')})`,
        periodLabel: formatarFrasePeriodo(customLabel, rawActiveOperators) + shiftSuffix,
        siteLabel: "3 COR - BH"
      };
    }

    return EMPTY_KPIS;
  }, [filteredActiveOperators, rawActiveOperators, customLabel, selectedTurno]);

  // Active top 3 for the 3D podiums (updates with active filter)
  const top1 = filteredActiveOperators[0];
  const top2 = filteredActiveOperators[1];
  const top3 = filteredActiveOperators[2];

  // Uniform scale factor preserving exact 16:9 (1920x1080) aspect ratio without stretching
  const scale = useMemo(() => {
    const scaleX = windowSize.width / 1920;
    const scaleY = windowSize.height / 1080;
    return Math.min(scaleX, scaleY);
  }, [windowSize]);

  // Attempt auto-fullscreen on first user interaction if available
  useEffect(() => {
    const handleFirstInteraction = () => {
      if (!document.fullscreenElement && document.documentElement.requestFullscreen) {
        document.documentElement.requestFullscreen().catch(() => {});
      }
    };
    window.addEventListener('click', handleFirstInteraction, { once: true });
    window.addEventListener('keydown', handleFirstInteraction, { once: true });
    return () => {
      window.removeEventListener('click', handleFirstInteraction);
      window.removeEventListener('keydown', handleFirstInteraction);
    };
  }, []);

  const handleImportCustomData = (newOperators: OperatorSummary[], label: string) => {
    setCustomOperators(newOperators);
    setCustomLabel(label);
    setSelectedOperator(newOperators[0]?.name || null);
  };

  const handleSelectPeriodPreset = (preset: PeriodPreset) => {
    setCustomOperators(null);
    setPeriodPreset(preset);
  };

  const handleUpdateOperatorTurno = (operatorName: string, newTurno: string) => {
    // 1. Salva a customização no localStorage e atualiza o mapa em memória
    salvarTurnoCustomizado(operatorName, newTurno);

    // 2. Atualiza a lista ativa de operadores no estado React
    const currentList = customOperators ? [...customOperators] : [...rawActiveOperators];
    const updated = currentList.map((op) => {
      if ((op.name || "").toUpperCase() === (operatorName || "").toUpperCase()) {
        return {
          ...op,
          turno: newTurno
        };
      }
      return op;
    });

    setCustomOperators(updated);

    // 3. Persiste no Firebase Realtime Database
    salvarRankingRealtime(
      updated,
      customLabel || currentKPIs.periodLabel || 'Relatório SAGA',
      updated[0]?.dataInicio,
      updated[0]?.dataFim
    ).catch((err) => {
      console.warn('Erro ao salvar alteração de turno no Firebase:', err);
    });
  };

  return (
    <div className="app-viewport select-none">
      {loading ? (
        <div className="flex items-center justify-center min-h-screen bg-[#05091B] text-white">
          <div className="animate-pulse">Carregando SAGA...</div>
        </div>
      ) : !user ? (
        <LoginModal onLoginSuccess={setUser} />
      ) : (
        <>
          {/* 
            Uniformly scaled 1920x1080 presentation canvas preserving exact typography and circle proportions
          */}
          <div
            className="dashboard-canvas flex flex-row"
            style={{
              transform: `scale(${scale})`,
              transition: 'transform 0.1s ease-out'
            }}
          >
            {/* =========================================================
                CAMADA 1 — FUNDO CINEMATOGRÁFICO
               ========================================================= */}
            <LayerBackground />

            {/* =========================================================
                ÁREA PRINCIPAL DO DASHBOARD (1920px x 1080px)
               ========================================================= */}
            <main className="flex-1 h-full flex flex-col justify-between px-8 py-4 relative z-10">
              {/* TOPO: Cabeçalho com Título, Período, Site, Marca e Alternador de Modo */}
              <HeaderNav
                periodPreset={periodPreset}
                onSelectPeriodPreset={handleSelectPeriodPreset}
                periodLabel={currentKPIs.periodLabel}
                siteLabel={currentKPIs.siteLabel}
                totalOperatorsCount={rawActiveOperators.length}
                onOpenDataModal={() => setIsDataModalOpen(true)}
                activeView={viewMode}
                onToggleView={setViewMode}
              />

              {/* =========================================================================
                  MODO 1: APRESENTAÇÃO 3D 4K CINEMATOGRÁFICA ISOLADA (PADRÃO AO ENTRAR)
                 ========================================================================= */}
              {viewMode === 'showcase' ? (
                <section className="w-full flex-1 flex items-center justify-center">
                  <LayerCinematicShowcase
                    operators={filteredActiveOperators}
                    kpis={currentKPIs}
                    onSwitchToListMode={() => setViewMode('list')}
                    onSelectOperator={setSelectedOperator}
                    initialOperatorName={selectedOperator}
                    selectedTurno={selectedTurno}
                    onSelectTurno={setSelectedTurno}
                    onUpdateOperatorTurno={handleUpdateOperatorTurno}
                  />
                </section>
              ) : (
                /* =========================================================================
                    MODO 2: MODO LISTA COMPLETA COM VISÃO GERAL E TABELA DE 69 COLABORADORES
                   ========================================================================= */
                <div className="w-full flex-1 flex flex-col justify-between">
                  {/* TOPO DO MODO LISTA: Pódio 3D Centralizado + Resumos SAGA */}
                  <section className="w-full flex items-center justify-between gap-5 px-3">
                    {/* Asa Esquerda: Métricas Gerais Consolidadas SAGA */}
                    <div className="w-[440px] shrink-0">
                      <LayerResumoGeral
                        variant="left"
                        kpis={currentKPIs}
                        onFilterActivity={setSelectedActivity}
                        onOpenImportPDF={() => setIsDataModalOpen(true)}
                      />
                    </div>

                    {/* CENTRO: Mini Pódio 3D em Destaque */}
                    <div className="flex-1 max-w-[940px] flex justify-center">
                      <LayerPodium3D
                        firstPlace={top1}
                        secondPlace={top2}
                        thirdPlace={top3}
                        onSelectOperator={(opName) => {
                          setSelectedOperator(opName);
                          setViewMode('showcase');
                        }}
                        selectedOperator={selectedOperator}
                      />
                    </div>

                    {/* Asa Direita: Indicadores de Performance & Gestão de Relatórios SAGA */}
                    <div className="w-[440px] shrink-0">
                      <LayerResumoGeral
                        variant="right"
                        kpis={currentKPIs}
                        onFilterActivity={setSelectedActivity}
                        onOpenImportPDF={() => setIsDataModalOpen(true)}
                      />
                    </div>
                  </section>

                  {/* TABELA COMPLETA COM OS 69 COLABORADORES */}
                  <section className="w-full px-3 mt-3">
                    <LayerRankingTable
                      operators={rawActiveOperators}
                      selectedActivity={selectedActivity}
                      onSelectActivity={setSelectedActivity}
                      selectedTurno={selectedTurno}
                      onSelectTurno={setSelectedTurno}
                      onSelectOperator={setSelectedOperator}
                      selectedOperator={selectedOperator}
                      onOpenShowcase={(opName) => {
                        if (opName) setSelectedOperator(opName);
                        setViewMode('showcase');
                      }}
                      onUpdateOperatorTurno={handleUpdateOperatorTurno}
                    />
                  </section>
                </div>
              )}
            </main>
          </div>

          {/* MODAL DE IMPORTAÇÃO/EXPORTAÇÃO DE DADOS */}
          <DataImportExportModal
            isOpen={isDataModalOpen}
            onClose={() => setIsDataModalOpen(false)}
            operators={rawActiveOperators}
            periodPreset={periodPreset}
            onSelectPeriodPreset={handleSelectPeriodPreset}
            onImportCustomData={handleImportCustomData}
          />
        </>
      )}
    </div>
  );
}
