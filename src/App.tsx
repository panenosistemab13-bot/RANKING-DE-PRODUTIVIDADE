import React, { useState, useEffect, useMemo } from 'react';
import { LayerBackground } from './components/LayerBackground';
import { HeaderNav } from './components/HeaderNav';
import { LayerPodium3D } from './components/LayerPodium3D';
import { LayerResumoGeral } from './components/LayerResumoGeral';
import { LayerRankingTable } from './components/LayerRankingTable';
import { LayerCinematicShowcase } from './components/LayerCinematicShowcase';
import { DataImportExportModal } from './components/DataImportExportModal';
import {
  REFERENCE_OPERATORS,
  REFERENCE_KPIS,
  FULL_MONTH_OPERATORS,
  FULL_MONTH_KPIS
} from './data/productivityData';
import { OperatorSummary, DashboardKPIs, PeriodPreset } from './types';
import { ouvirRankingRealtime } from './services/firebase';

export default function App() {
  const [periodPreset, setPeriodPreset] = useState<PeriodPreset>('reference');
  const [viewMode, setViewMode] = useState<'showcase' | 'list'>('showcase');
  const [selectedActivity, setSelectedActivity] = useState<string>('TODAS AS ATIVIDADES');
  const [selectedOperator, setSelectedOperator] = useState<string | null>(null);
  const [isDataModalOpen, setIsDataModalOpen] = useState(false);

  // Custom data if imported by user or loaded from Firebase Realtime Database
  const [customOperators, setCustomOperators] = useState<OperatorSummary[] | null>(null);
  const [customLabel, setCustomLabel] = useState<string | null>(null);
  const [isFirebaseConnected, setIsFirebaseConnected] = useState<boolean>(true);

  // Listen to Firebase Realtime Database in real time
  useEffect(() => {
    const unsubscribe = ouvirRankingRealtime(
      (data) => {
        if (data && data.operators && data.operators.length > 0) {
          console.log("[Firebase Realtime Database] Dados recebidos em tempo real:", data);
          setCustomOperators(data.operators);
          setCustomLabel(data.label || `SAGA (${data.operators.length} Colab.)`);
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

  // Compute active dataset based on preset
  const rawActiveOperators = useMemo(() => {
    if (customOperators) return customOperators;
    if (periodPreset === 'full') return FULL_MONTH_OPERATORS;
    return REFERENCE_OPERATORS;
  }, [periodPreset, customOperators]);

  // Compute active KPIs
  const currentKPIs = useMemo<DashboardKPIs>(() => {
    if (customOperators) {
      const totalProd = customOperators.reduce((acc, curr) => acc + curr.totalProductivity, 0);
      const totalMov = customOperators.reduce((acc, curr) => acc + curr.movements, 0);

      // Find predominant activity across all custom operators
      const actMap: Record<string, number> = {};
      customOperators.forEach(op => {
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

      return {
        totalProductivity: totalProd,
        totalOperators: customOperators.length,
        totalMovements: totalMov,
        averagePerOperator: Math.round(totalProd / (customOperators.length || 1)),
        topOperator: {
          name: customOperators[0]?.name || 'N/A',
          productivity: customOperators[0]?.totalProductivity || 0
        },
        lowestOperator: {
          name: customOperators[customOperators.length - 1]?.name || 'N/A',
          productivity: customOperators[customOperators.length - 1]?.totalProductivity || 0
        },
        topActivity: `${bestAct} (${maxActCount.toLocaleString('pt-BR')})`,
        periodLabel: customLabel || "Relatório Importado",
        siteLabel: "3 COR - BH"
      };
    }

    if (periodPreset === 'full') {
      return FULL_MONTH_KPIS;
    }
    return REFERENCE_KPIS;
  }, [periodPreset, customOperators, customLabel]);

  // Active top 3 for the 3D podiums
  const top1 = rawActiveOperators[0];
  const top2 = rawActiveOperators[1];
  const top3 = rawActiveOperators[2];

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

  return (
    <div className="app-viewport select-none">
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
                operators={rawActiveOperators}
                kpis={currentKPIs}
                onSwitchToListMode={() => setViewMode('list')}
                onSelectOperator={setSelectedOperator}
                initialOperatorName={selectedOperator}
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
                  onSelectOperator={setSelectedOperator}
                  selectedOperator={selectedOperator}
                  onOpenShowcase={(opName) => {
                    if (opName) setSelectedOperator(opName);
                    setViewMode('showcase');
                  }}
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
    </div>
  );
}
