import React, { useMemo } from 'react';
import {
  TrendingUp,
  FileCheck2,
  Users,
  Layers,
  UserCheck,
  Trophy,
  UserMinus,
  FileUp,
  Calendar,
  Sparkles,
  BarChart3,
  Crown
} from 'lucide-react';
import { DashboardKPIs, OperatorSummary } from '../types';
import { matchActivity, normalizarAtividade, isMovimentacaoUma } from '../utils/rankingPdfParser';

interface LayerResumoGeralProps {
  kpis: DashboardKPIs;
  variant?: 'left' | 'right' | 'full';
  operators?: OperatorSummary[];
  selectedActivity?: string;
  onFilterActivity?: (activity: string) => void;
  onOpenImportPDF?: () => void;
  onOpenGoogleSheetsModal?: () => void;
}

export const LayerResumoGeral: React.FC<LayerResumoGeralProps> = ({
  kpis,
  variant = 'full',
  operators = [],
  selectedActivity,
  onFilterActivity,
  onOpenImportPDF,
  onOpenGoogleSheetsModal
}) => {
  const formatNumber = (val: number) => {
    return val.toLocaleString('pt-BR');
  };

  // Cálculo dos Líderes por Atividade (Coluna B)
  const activityLeaders = useMemo(() => {
    if (!operators || operators.length === 0) return [];
    const activities = ['MOVIMENTACAO', 'APANHA', 'APANHA PALETE', 'CONF CARREG', 'CONF VOLUME', 'GOODS ISSUE'];

    return activities.map((act) => {
      let maxScore = 0;
      let topLeader = 'Aguardando';

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

        if (score > maxScore) {
          maxScore = score;
          topLeader = op.name;
        }
      });

      return {
        activity: act === 'MOVIMENTACAO' ? 'MOVIMENTAÇÃO' : act,
        filterKey: act,
        leaderName: topLeader,
        leaderScore: maxScore
      };
    }).filter((item) => item.leaderScore > 0 || ['MOVIMENTAÇÃO', 'APANHA', 'APANHA PALETE'].includes(item.activity));
  }, [operators]);

  // =========================================================================
  // ASA ESQUERDA: MÉTRICAS GERAIS CONSOLIDADAS
  // =========================================================================
  if (variant === 'left') {
    return (
      <div className="glass-panel w-full h-[395px] p-5 flex flex-col justify-between shadow-xl relative overflow-hidden select-none">
        {/* Top Sheen */}
        <div className="absolute -top-10 -left-10 w-48 h-48 bg-gradient-to-br from-amber-300/15 via-white/40 to-transparent rounded-full blur-xl pointer-events-none" />

        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center text-white shadow-md shadow-amber-500/25">
              <TrendingUp className="w-4.5 h-4.5 stroke-[2.5]" />
            </div>
            <div>
              <h2 className="text-[17px] font-black tracking-tight text-[#0f2444] uppercase font-heading leading-tight">
                MÉTRICAS GERAIS
              </h2>
              <span className="text-[10.5px] font-semibold text-slate-500">
                Resultados Operacionais SAGA
              </span>
            </div>
          </div>
          <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
            ONLINE
          </span>
        </div>

        {/* 3 Large KPI Cards */}
        <div className="flex flex-col gap-2.5 my-auto">
          {/* 1. Total de Produtividade */}
          <div className="p-3 rounded-2xl bg-white/75 border border-slate-200/70 shadow-xs flex items-center gap-3.5 hover:bg-white/95 transition-all">
            <div className="w-11 h-11 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0 border border-amber-100">
              <FileCheck2 className="w-5.5 h-5.5" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">
                  Total Produtividade
                </span>
                <span className="text-[10px] font-extrabold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-md">
                  ↑ 12,5%
                </span>
              </div>
              <div className="text-[26px] font-black text-slate-900 tracking-tight leading-none mt-0.5 font-heading">
                {formatNumber(kpis.totalProductivity)}
              </div>
              <span className="text-[10px] font-medium text-slate-400">
                Unidades apanhadas e conferidas
              </span>
            </div>
          </div>

          {/* 2. Total de Colaboradores */}
          <div className="p-3 rounded-2xl bg-white/75 border border-slate-200/70 shadow-xs flex items-center gap-3.5 hover:bg-white/95 transition-all">
            <div className="w-11 h-11 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 border border-blue-100">
              <Users className="w-5.5 h-5.5" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">
                  Total Colaboradores
                </span>
                <span className="text-[10px] font-extrabold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded-md">
                  100% SAGA
                </span>
              </div>
              <div className="text-[26px] font-black text-slate-900 tracking-tight leading-none mt-0.5 font-heading">
                {kpis.totalOperators}
              </div>
              <span className="text-[10px] font-medium text-slate-400">
                {kpis.totalOperators} operadores no relatório
              </span>
            </div>
          </div>

          {/* 3. Total de Movimentações */}
          <div className="p-3 rounded-2xl bg-white/75 border border-slate-200/70 shadow-xs flex items-center gap-3.5 hover:bg-white/95 transition-all">
            <div className="w-11 h-11 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0 border border-purple-100">
              <Layers className="w-5.5 h-5.5" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">
                  Movimentações
                </span>
                <span className="text-[10px] font-extrabold text-purple-600 bg-purple-50 px-1.5 py-0.5 rounded-md">
                  Auditado SAGA
                </span>
              </div>
              <div className="text-[26px] font-black text-slate-900 tracking-tight leading-none mt-0.5 font-heading">
                {formatNumber(kpis.totalMovements)}
              </div>
              <span className="text-[10px] font-medium text-slate-400">
                Fluxo total de pallets e volumes
              </span>
            </div>
          </div>
        </div>

        {/* Footer Quick Metric */}
        <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-slate-900/5 border border-slate-200/60 text-[11px]">
          <span className="font-semibold text-slate-600 flex items-center gap-1.5">
            <BarChart3 className="w-3.5 h-3.5 text-amber-600" />
            Atividade Principal:
          </span>
          <span className="font-black text-slate-900 uppercase">
            {kpis.topActivity} ({formatNumber(kpis.totalProductivity)})
          </span>
        </div>
      </div>
    );
  }

  // =========================================================================
  // ASA DIREITA: PERFORMANCE & GESTÃO
  // =========================================================================
  if (variant === 'right') {
    return (
      <div className="glass-panel w-full h-[395px] p-5 flex flex-col justify-between shadow-xl relative overflow-hidden select-none">
        {/* Top Sheen */}
        <div className="absolute -top-10 -right-10 w-48 h-48 bg-gradient-to-br from-amber-300/15 via-white/40 to-transparent rounded-full blur-xl pointer-events-none" />

        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center text-white shadow-md shadow-amber-500/25">
              <Trophy className="w-4.5 h-4.5 stroke-[2.5]" />
            </div>
            <div>
              <h2 className="text-[17px] font-black tracking-tight text-[#0f2444] uppercase font-heading leading-tight">
                INDICADORES E AÇÕES
              </h2>
              <span className="text-[10.5px] font-semibold text-slate-500">
                Desempenho & Relatórios
              </span>
            </div>
          </div>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-200">
            3 COR - BH
          </span>
        </div>

        {/* Top 2 Metric Cards */}
        <div className="grid grid-cols-2 gap-2.5 my-1">
          {/* Média por Colaborador */}
          <div className="p-2.5 rounded-2xl bg-white/75 border border-slate-200/70 shadow-xs flex flex-col justify-between hover:bg-white/95 transition-all">
            <div className="flex items-center gap-2 text-indigo-600">
              <UserCheck className="w-3.5 h-3.5" />
              <span className="text-[10px] font-bold text-slate-500 uppercase">
                Média / Colab.
              </span>
            </div>
            <div className="text-[20px] font-black text-slate-900 tracking-tight font-heading mt-0.5">
              {formatNumber(kpis.averagePerOperator)}
            </div>
            <span className="text-[9.5px] font-bold text-emerald-600">
              ↑ 10,2% vs meta
            </span>
          </div>

          {/* Destaque Maior Produtividade */}
          <div className="p-2.5 rounded-2xl bg-white/75 border border-slate-200/70 shadow-xs flex flex-col justify-between hover:bg-white/95 transition-all">
            <div className="flex items-center gap-1.5 text-amber-600">
              <Sparkles className="w-3.5 h-3.5" />
              <span className="text-[10px] font-bold text-slate-500 uppercase truncate">
                Líder SAGA
              </span>
            </div>
            <div className="text-[12px] font-black text-slate-900 truncate mt-0.5">
              {kpis.topOperator.name.split(' ').slice(0, 2).join(' ')}
            </div>
            <span className="text-[15px] font-black text-amber-600 font-heading">
              {formatNumber(kpis.topOperator.productivity)}
            </span>
          </div>
        </div>

        {/* LÍDERES POR ATIVIDADE (COLUNA B) */}
        {activityLeaders.length > 0 && (
          <div className="p-2.5 rounded-2xl bg-white/80 border border-amber-200/80 shadow-xs my-1">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[10px] font-black text-amber-900 uppercase tracking-wider flex items-center gap-1.5 font-heading">
                <Crown className="w-3.5 h-3.5 text-amber-500 fill-amber-400" />
                LÍDERES POR ATIVIDADE (COLUNA B)
              </span>
              <span className="text-[8.5px] font-extrabold text-amber-800 bg-amber-100/90 px-1.5 py-0.2 rounded-md">
                CLIQUE PARA FILTRAR
              </span>
            </div>

            <div className="grid grid-cols-3 gap-1.5">
              {activityLeaders.slice(0, 3).map((item) => (
                <button
                  key={item.activity}
                  onClick={() => onFilterActivity && onFilterActivity(item.filterKey)}
                  className={`p-1.5 rounded-xl border text-left transition-all cursor-pointer group ${
                    selectedActivity === item.filterKey
                      ? 'bg-amber-500 text-white border-amber-600 shadow-xs'
                      : 'bg-amber-50/60 hover:bg-amber-100/80 border-amber-200/60'
                  }`}
                >
                  <span className={`block text-[9px] font-extrabold uppercase truncate ${
                    selectedActivity === item.filterKey ? 'text-amber-100' : 'text-amber-800'
                  }`}>
                    {item.activity}
                  </span>
                  <span className={`block text-[10.5px] font-black truncate font-heading ${
                    selectedActivity === item.filterKey ? 'text-white' : 'text-slate-900 group-hover:text-amber-900'
                  }`}>
                    {item.leaderName.split(' ')[0]}
                  </span>
                  <span className={`block text-[9.5px] font-bold ${
                    selectedActivity === item.filterKey ? 'text-amber-200' : 'text-amber-600'
                  }`}>
                    {formatNumber(item.leaderScore)} ord.
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* STATUS DA PLANILHA GOOGLE EM TEMPO REAL */}
        <button
          type="button"
          onClick={() => {
            if (onOpenGoogleSheetsModal) {
              onOpenGoogleSheetsModal();
            } else if (onOpenImportPDF) {
              onOpenImportPDF();
            }
          }}
          className="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 hover:from-emerald-500 hover:to-teal-600 text-white shadow-lg shadow-emerald-700/25 border border-emerald-400/40 select-none cursor-pointer transition-all hover:scale-[1.01] active:scale-[0.99]"
        >
          <div className="w-8 h-8 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center text-white shrink-0 shadow-sm">
            <svg viewBox="0 0 24 24" className="w-4.5 h-4.5 fill-white">
              <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-2 10h-4v4h-2v-4H7v-2h4V7h2v4h4v2z"/>
            </svg>
          </div>
          <div className="text-left">
            <span className="block text-[9.5px] font-extrabold text-emerald-100 tracking-wider uppercase leading-tight">
              PLANILHA + GOOGLE INTEGRADA
            </span>
            <span className="text-[13px] font-black tracking-tight text-white uppercase font-heading leading-tight flex items-center gap-1.5">
              TEMPO REAL AUTOMÁTICO
              <span className="w-2 h-2 rounded-full bg-emerald-300 animate-ping" />
            </span>
          </div>
        </button>
      </div>
    );
  }

  // =========================================================================
  // VARIANTE FULL (FALLBACK)
  // =========================================================================
  return (
    <div className="glass-panel w-full h-[400px] p-6.5 flex flex-col justify-between shadow-2xl relative overflow-hidden select-none">
      {/* Top Subtle Sheen */}
      <div className="absolute -top-12 -right-12 w-64 h-64 bg-gradient-to-br from-amber-200/20 via-white/40 to-transparent rounded-full blur-2xl pointer-events-none" />

      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center text-white shadow-md shadow-amber-500/25">
          <TrendingUp className="w-4.5 h-4.5 stroke-[2.5]" />
        </div>
        <h2 className="text-[21px] font-black tracking-tight text-[#0f2444] uppercase font-heading">
          RESUMO GERAL
        </h2>
      </div>

      {/* Grid of 6 KPI Blocks */}
      <div className="grid grid-cols-3 gap-3.5 my-auto">
        {/* 1. Total de Produtividade */}
        <div className="p-3.5 rounded-2xl bg-white/70 border border-slate-200/60 shadow-xs flex items-start gap-3 hover:bg-white/95 transition-all">
          <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0 mt-0.5">
            <FileCheck2 className="w-4.5 h-4.5" />
          </div>
          <div>
            <span className="block text-[11px] font-semibold text-slate-500 leading-tight">
              Total de Produtividade
            </span>
            <div className="text-[25px] font-black text-slate-900 tracking-tight leading-none mt-1 font-heading">
              {formatNumber(kpis.totalProductivity)}
            </div>
            <span className="inline-flex items-center text-[10.5px] font-bold text-emerald-600 mt-1">
              ↑ 12,5%
            </span>
          </div>
        </div>

        {/* 2. Total de Colaboradores */}
        <div className="p-3.5 rounded-2xl bg-white/70 border border-slate-200/60 shadow-xs flex items-start gap-3 hover:bg-white/95 transition-all">
          <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 mt-0.5">
            <Users className="w-4.5 h-4.5" />
          </div>
          <div>
            <span className="block text-[11px] font-semibold text-slate-500 leading-tight">
              Total de Colaboradores
            </span>
            <div className="text-[25px] font-black text-slate-900 tracking-tight leading-none mt-1 font-heading">
              {kpis.totalOperators}
            </div>
            <span className="inline-flex items-center text-[10.5px] font-bold text-emerald-600 mt-1">
              ↑ 8,3%
            </span>
          </div>
        </div>

        {/* 3. Total de Movimentações */}
        <div className="p-3.5 rounded-2xl bg-white/70 border border-slate-200/60 shadow-xs flex items-start gap-3 hover:bg-white/95 transition-all">
          <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0 mt-0.5">
            <Layers className="w-4.5 h-4.5" />
          </div>
          <div>
            <span className="block text-[11px] font-semibold text-slate-500 leading-tight">
              Total de Movimentações
            </span>
            <div className="text-[25px] font-black text-slate-900 tracking-tight leading-none mt-1 font-heading">
              {formatNumber(kpis.totalMovements)}
            </div>
            <span className="inline-flex items-center text-[10.5px] font-bold text-emerald-600 mt-1">
              ↑ 10,2%
            </span>
          </div>
        </div>

        {/* 4. Média por Colaborador */}
        <div className="p-3.5 rounded-2xl bg-white/70 border border-slate-200/60 shadow-xs flex items-start gap-3 hover:bg-white/95 transition-all">
          <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0 mt-0.5">
            <UserCheck className="w-4.5 h-4.5" />
          </div>
          <div>
            <span className="block text-[11px] font-semibold text-slate-500 leading-tight">
              Média por Colaborador
            </span>
            <div className="text-[25px] font-black text-slate-900 tracking-tight leading-none mt-1 font-heading">
              {formatNumber(kpis.averagePerOperator)}
            </div>
            <span className="inline-flex items-center text-[10.5px] font-bold text-emerald-600 mt-1">
              ↑ 10,2%
            </span>
          </div>
        </div>

        {/* 5. Maior Produtividade */}
        <div className="p-3.5 rounded-2xl bg-white/70 border border-slate-200/60 shadow-xs flex items-start gap-3 hover:bg-white/95 transition-all">
          <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0 mt-0.5">
            <Trophy className="w-4.5 h-4.5" />
          </div>
          <div className="min-w-0">
            <span className="block text-[11px] font-semibold text-slate-500 leading-tight truncate">
              Maior Produtividade
            </span>
            <div className="text-[14.5px] font-black text-slate-900 tracking-tight truncate mt-0.5">
              {kpis.topOperator.name}
            </div>
            <span className="text-[16px] font-black text-amber-600 leading-none font-heading">
              {formatNumber(kpis.topOperator.productivity)}
            </span>
          </div>
        </div>

        {/* 6. Menor Produtividade */}
        <div className="p-3.5 rounded-2xl bg-white/70 border border-slate-200/60 shadow-xs flex items-start gap-3 hover:bg-white/95 transition-all">
          <div className="w-9 h-9 rounded-xl bg-slate-100 text-slate-500 flex items-center justify-center shrink-0 mt-0.5">
            <UserMinus className="w-4.5 h-4.5" />
          </div>
          <div className="min-w-0">
            <span className="block text-[11px] font-semibold text-slate-500 leading-tight truncate">
              Menor Produtividade
            </span>
            <div className="text-[14.5px] font-black text-slate-900 tracking-tight truncate mt-0.5">
              {kpis.lowestOperator.name}
            </div>
            <span className="text-[16px] font-black text-slate-600 leading-none font-heading">
              {formatNumber(kpis.lowestOperator.productivity)}
            </span>
          </div>
        </div>
      </div>

      {/* Bottom Banners */}
      <div className="grid grid-cols-2 gap-3.5 pt-1">
        <div
          onClick={onOpenImportPDF}
          role="button"
          tabIndex={0}
          className="cursor-pointer group flex items-center gap-3.5 px-4.5 py-3 rounded-2xl bg-gradient-to-r from-amber-500 via-amber-600 to-amber-700 text-white shadow-lg shadow-amber-600/30 hover:brightness-110 active:scale-[0.98] transition-all border border-amber-300/50"
        >
          <div className="w-10 h-10 rounded-xl bg-white/25 backdrop-blur-md flex items-center justify-center text-white shrink-0 group-hover:scale-110 transition-transform shadow-sm">
            <FileUp className="w-5 h-5 stroke-[2.5]" />
          </div>
          <div>
            <span className="block text-[10.5px] font-extrabold text-amber-100 tracking-wider uppercase">
              IMPORTAR RELATÓRIO PDF
            </span>
            <span className="text-[17px] font-black tracking-tight text-white uppercase font-heading">
              GERAR DADOS DO APP
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3.5 px-4.5 py-3 rounded-2xl bg-white/80 border border-slate-200/80 shadow-xs">
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
            <Calendar className="w-5 h-5" />
          </div>
          <div>
            <span className="block text-[10.5px] font-medium text-slate-500 tracking-wide uppercase">
              Período dos Dados
            </span>
            <span className="text-[14.5px] font-bold tracking-tight text-slate-900">
              {kpis.periodLabel}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
