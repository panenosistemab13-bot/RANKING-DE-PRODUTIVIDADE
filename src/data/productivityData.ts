import { OperatorSummary, DashboardKPIs } from "../types";

// Base de dados limpa (sem dados fictícios ou testes)
export const EMPTY_OPERATORS: OperatorSummary[] = [];

export const AVAILABLE_ACTIVITIES = [
  'TODAS AS ATIVIDADES',
  'MOVIMENTACAO',
  'RESSUPRIMENTO',
  'MOV/EXP'
];

export const EMPTY_KPIS: DashboardKPIs = {
  totalProductivity: 0,
  totalOperators: 0,
  totalMovements: 0,
  averagePerOperator: 0,
  topOperator: {
    name: "Aguardando Importação",
    productivity: 0
  },
  lowestOperator: {
    name: "Aguardando Importação",
    productivity: 0
  },
  topActivity: "Nenhuma",
  periodLabel: "Aguardando PDF SAGA",
  siteLabel: "3 COR - BH"
};
