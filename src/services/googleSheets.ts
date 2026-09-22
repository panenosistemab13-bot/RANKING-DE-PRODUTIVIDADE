import { OperatorSummary } from '../types';

export function extrairSpreadsheetId(urlOrId: string): string {
  if (!urlOrId) return '';
  const trimmed = urlOrId.trim();
  const match = trimmed.match(/\/d\/([a-zA-Z0-9-_]+)/);
  if (match && match[1]) {
    return match[1];
  }
  return trimmed;
}

export async function importarRankingDeSheets(spreadsheetId: string): Promise<OperatorSummary[]> {
  const cleanId = extrairSpreadsheetId(spreadsheetId);
  const url = `https://docs.google.com/spreadsheets/d/${cleanId}/gviz/tq?tqx=out:csv&sheet=PRODUTIVIDADE`;
  
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error("Não foi possível aceder à planilha. Verifique se está partilhada publicamente.");
  }
  
  const csvText = await response.text();
  const linhas = csvText.split('\n').map(l => l.split(',').map(c => c.replace(/^"|"$/g, '').trim()));
  
  if (linhas.length < 2) return [];

  const headers = linhas[0].map(h => h.toUpperCase());
  const idxFunc = headers.findIndex(h => h.includes("FUNCIONARIO") || h.includes("NOME") || h.includes("COLABORADOR"));
  const idxUma = headers.findIndex(h => h.includes("UMA") || h.includes("PRODUTIVIDADE") || h.includes("ORDENS"));

  if (idxFunc === -1) {
    throw new Error("Coluna de colaborador/nome não encontrada na planilha.");
  }

  const rankingMap: Record<string, Set<string>> = {};
  for (let i = 1; i < linhas.length; i++) {
    const row = linhas[i];
    if (!row || row.length <= idxFunc) continue;
    const func = row[idxFunc]?.trim().toUpperCase();
    const uma = idxUma !== -1 ? row[idxUma]?.trim().toUpperCase() : `REG_${i}`;
    
    if (func) {
      if (!rankingMap[func]) rankingMap[func] = new Set();
      if (uma) rankingMap[func].add(uma);
    }
  }

  const operators: OperatorSummary[] = Object.keys(rankingMap).map((func, index) => ({
    rank: index + 1,
    name: func,
    turno: "OUTROS",
    totalProductivity: rankingMap[func].size,
    movements: rankingMap[func].size,
    participation: 0,
    trendGrowth: 5.0,
    sparkline: [10, 15, 12, 18, 20, rankingMap[func].size],
    topActivity: "APANHA",
    activitiesCount: { APANHA: rankingMap[func].size }
  })).sort((a, b) => b.totalProductivity - a.totalProductivity);

  operators.forEach((op, idx) => { op.rank = idx + 1; });
  return operators;
}

export async function exportarRankingParaSheets(title: string, operators: OperatorSummary[]): Promise<string> {
  throw new Error("A exportação direta requer autorização OAuth.");
}