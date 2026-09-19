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
  totalProductivity: number;
  movements: number;
  participation: number; // Percentage of total, e.g. 4.16
  trendGrowth: number;  // Trend vs previous period, e.g. +12.4
  sparkline: number[];  // Mini trendline points
  topActivity: string;
  activitiesCount: Record<string, number>;
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
