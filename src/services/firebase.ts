import { OperatorSummary } from "../types";

export interface LocalRankingData {
  operators: OperatorSummary[];
  activities?: string[];
  label: string;
  dataInicio?: string;
  dataFim?: string;
  updatedAt: string;
  totalOperators: number;
  totalProductivity: number;
  totalMovements: number;
}

const LOCAL_STORAGE_KEY_OPERATORS = 'saga_ranking_cached_operators';
const LOCAL_STORAGE_KEY_LABEL = 'saga_ranking_cached_label';
const LOCAL_STORAGE_KEY_WEBAPP_URL = 'saga_ranking_webapp_url';

/**
 * Salva a URL do Web App do Apps Script no LocalStorage
 */
export function salvarWebAppUrl(url: string): void {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY_WEBAPP_URL, url);
  } catch (e) {
    console.warn("Erro ao salvar WebApp URL:", e);
  }
}

/**
 * Obtém a URL do Web App do Apps Script
 */
export function obterWebAppUrl(): string | null {
  try {
    return localStorage.getItem(LOCAL_STORAGE_KEY_WEBAPP_URL);
  } catch {
    return null;
  }
}

/**
 * Salva o ranking no LocalStorage (cache local sem Firebase)
 */
export function salvarCacheLocal(
  operators: OperatorSummary[],
  label: string,
  dataInicio?: string,
  dataFim?: string
): void {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY_OPERATORS, JSON.stringify(operators));
    localStorage.setItem(LOCAL_STORAGE_KEY_LABEL, label);
  } catch (e) {
    console.warn("Erro ao salvar no LocalStorage:", e);
  }
}

/**
 * Carrega os dados em cache local imediatamente ao abrir o app
 */
export function carregarCacheLocal(): { operators: OperatorSummary[]; label: string; activities?: string[] } | null {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY_OPERATORS);
    const label = localStorage.getItem(LOCAL_STORAGE_KEY_LABEL);
    const rawActivities = localStorage.getItem('saga_ranking_cached_activities');
    let activities: string[] | undefined = undefined;
    if (rawActivities) {
      try {
        activities = JSON.parse(rawActivities);
      } catch {}
    }
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return {
          operators: parsed,
          label: label || `SAGA (${parsed.length} Colab.)`,
          activities: Array.isArray(activities) ? activities : undefined
        };
      }
    }
  } catch (e) {
    console.warn("Erro ao ler LocalStorage:", e);
  }
  return null;
}

/**
 * Limpa todos os dados de ranking do LocalStorage
 */
export function limparCacheLocal(): void {
  try {
    localStorage.removeItem(LOCAL_STORAGE_KEY_OPERATORS);
    localStorage.removeItem(LOCAL_STORAGE_KEY_LABEL);
  } catch (e) {
    console.warn("Erro ao limpar LocalStorage:", e);
  }
}

/**
 * Normaliza os operadores recebidos da API do Apps Script Web App
 */
export function normalizarOperadores(rawOperators: any): OperatorSummary[] {
  if (!rawOperators) return [];
  const list = Array.isArray(rawOperators) ? rawOperators : Object.values(rawOperators);
  if (!Array.isArray(list)) return [];

  return list
    .filter((item) => item && typeof item === 'object')
    .map((item: any, idx: number) => {
      const name = String(
        item.name ||
        item.colaborador ||
        item.COLABORADOR ||
        item.funcionario ||
        item.FUNCIONARIO ||
        item.FUNCIONÁRIO ||
        item.nome ||
        item.NOME ||
        `Colaborador ${idx + 1}`
      ).trim().toUpperCase();

      const rawProd = item.totalProductivity ?? item.produtividade ?? item.PRODUTIVIDADE ?? item.ordens ?? item.ORDENS ?? item.quantidade ?? item.QUANTIDADE ?? item.movements ?? 0;
      const prod = typeof rawProd === 'number' ? rawProd : (parseInt(String(rawProd).replace(/\D/g, ''), 10) || 0);

      const rawMov = item.movements ?? item.movimentacoes ?? item.MOVIMENTACOES ?? item.pecas ?? prod;
      const mov = typeof rawMov === 'number' ? rawMov : (parseInt(String(rawMov).replace(/\D/g, ''), 10) || prod);

      const rank = Number(item.rank ?? (idx + 1)) || (idx + 1);
      const turno = item.turno || item.TURNO || 'A';
      const topActivity = item.topActivity || 'MOVIMENTAÇÃO UMA';
      const activitiesCount = item.activitiesCount || { [topActivity]: prod };
      const sparkline = Array.isArray(item.sparkline) && item.sparkline.length > 0
        ? item.sparkline
        : [prod * 0.7, prod * 0.8, prod * 0.75, prod * 0.85, prod * 0.9, prod];

      return {
        rank,
        name,
        turno,
        totalProductivity: prod,
        movements: mov,
        participation: Number(item.participation || 0),
        trendGrowth: Number(item.trendGrowth || 8.5),
        sparkline,
        topActivity,
        activitiesCount,
        dataInicio: item.dataInicio,
        dataFim: item.dataFim,
        datas: item.datas,
        qtdOrdens: item.qtdOrdens,
        qtdPecas: item.qtdPecas,
        qtdLotes: item.qtdLotes,
        qtdServ: item.qtdServ,
        qtdItens: item.qtdItens,
        qtdEnd: item.qtdEnd,
        registros: item.registros,
        registrosDetalhados: item.registrosDetalhados
      } as OperatorSummary;
    });
}
