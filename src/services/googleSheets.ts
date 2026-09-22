import { OperatorSummary } from '../types';
import { carregarCacheLocal } from './firebase';

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
  // Retorna diretamente do cache/Firebase para evitar bloqueios de CORS e login
  const cached = carregarCacheLocal();
  if (cached && cached.operators && cached.operators.length > 0) {
    return cached.operators;
  }
  throw new Error("Os dados já estão sincronizados automaticamente via Firebase em tempo real.");
}

export async function exportarRankingParaSheets(title: string, operators: OperatorSummary[]): Promise<string> {
  throw new Error("A exportação direta requer autorização OAuth.");
}