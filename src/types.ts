import { RankingRow } from "./utils/rankingPdfParser";

export interface RawProductivityEntry {
  operator: string;
  orders: number;
  pieces: number;
  lots: number;
  services: number; // Qtd. Serv.
  items: number;    // Qtd. Itens
  ends: number;     // Qtd. End.
  date: string;     // DD/MM/YYYY
  activity: string; // e.g. APANHA, CONF CARREG, CONF VOLUME, GOODS ISSUE, MOV/EXP, CONF RECEBIMENTO, MOVIMENTACAO
  process: string;  // Expedição, Recebimento
}

export interface OperatorSummary {
  rank: number;
  name: string;
  turno?: string; // Turno identificado ('A' | 'B' | 'C' | 'ADM' | 'RANDS')
  totalProductivity: number; // Qtd. Ordens (Produtividade Principal do SAGA)
  movements: number; // Movimentações (Qtd. Serv. + Peças + Lotes)
  participation: number; // % de participação no total
  trendGrowth: number;  // Tendência
  sparkline: number[];  // Mini gráfico de evolução
  topActivity: string;
  activitiesCount: Record<string, number>;
  qtdOrdens?: number;
  qtdPecas?: number;
  qtdLotes?: number;
  qtdServ?: number;
  qtdItens?: number;
  qtdEnd?: number;
  registros?: number;
  registrosDetalhados?: RankingRow[];
}

export interface DashboardKPIs {
  totalProductivity: number;
  totalOperators: number;
  totalMovements: number;
  averagePerOperator: number;
  topOperator: {
    name: string;
    productivity: number;
  };
  lowestOperator: {
    name: string;
    productivity: number;
  };
  topActivity: string;
  periodLabel: string;
  siteLabel: string;
}

export type PeriodPreset = 'reference' | 'full' | 'week1' | 'week2' | 'week3';
