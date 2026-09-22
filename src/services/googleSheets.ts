import { getAccessToken } from './googleAuth';
import { OperatorSummary } from '../types';

/**
 * Cria uma nova planilha no Google Sheets e insere os dados do Ranking
 */
export async function exportarRankingParaSheets(
  title: string,
  operators: OperatorSummary[]
): Promise<string> {
  const token = await getAccessToken();
  if (!token) {
    throw new Error('Usuário não autenticado no Google');
  }

  // 1. Cria a planilha
  const createResponse = await fetch('https://sheets.googleapis.com/v4/spreadsheets', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      properties: {
        title: title,
      },
    }),
  });

  if (!createResponse.ok) {
    const errText = await createResponse.text();
    throw new Error(`Erro ao criar planilha: ${errText}`);
  }

  const spreadsheet = await createResponse.json();
  const spreadsheetId = spreadsheet.spreadsheetId;

  // 2. Prepara os dados das linhas
  const headers = [
    'Posição',
    'Colaborador / U.M.A.',
    'Turno',
    'Atividade Principal',
    'Qtd. Ordens (Produtividade)',
    'Movimentações (Peças/Serv/Lotes)',
    '% Participação',
    'Qtd. Peças',
    'Qtd. Lotes',
    'Qtd. Serviços',
    'Qtd. Itens',
    'Qtd. Endereços'
  ];

  const valueRows = operators.map((op) => [
    op.rank,
    op.name,
    op.turno || 'N/A',
    op.topActivity || 'N/A',
    op.totalProductivity,
    op.movements,
    op.participation,
    op.qtdPecas || 0,
    op.qtdLotes || 0,
    op.qtdServ || 0,
    op.qtdItens || 0,
    op.qtdEnd || 0
  ]);

  const values = [headers, ...valueRows];

  // 3. Escreve os dados na planilha (A1:L...)
  const updateRange = `PRODUTIVIDADE!A1:L${values.length}`;
  const updateResponse = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${updateRange}?valueInputOption=USER_ENTERED`,
    {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        values: values,
      }),
    }
  );

  if (!updateResponse.ok) {
    const errText = await updateResponse.text();
    throw new Error(`Erro ao preencher dados na planilha: ${errText}`);
  }

  return spreadsheetId;
}

export const FIXED_SPREADSHEET_ID = '1synVKAYxOm4dRUXEuw65u0Lv1erLF7-9PXeAUtSd-QA';

/**
 * Busca os dados de uma planilha existente do Google Sheets e converte para OperatorSummary[]
 */
export async function importarRankingDeSheets(
  spreadsheetId = FIXED_SPREADSHEET_ID,
  rangeName = 'PRODUTIVIDADE!A:Z'
): Promise<OperatorSummary[]> {
  const token = await getAccessToken();
  if (!token) {
    throw new Error('Usuário não autenticado no Google');
  }

  const effectiveId = spreadsheetId || FIXED_SPREADSHEET_ID;
  let url = `https://sheets.googleapis.com/v4/spreadsheets/${effectiveId}/values/${encodeURIComponent(rangeName)}`;
  let response = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  // Se a aba específica não for encontrada, tenta ler a primeira aba (A:Z)
  if (!response.ok) {
    const fallbackUrl = `https://sheets.googleapis.com/v4/spreadsheets/${effectiveId}/values/A:Z`;
    const fallbackResponse = await fetch(fallbackUrl, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    if (fallbackResponse.ok) {
      response = fallbackResponse;
    } else {
      const errText = await response.text();
      throw new Error(`Erro ao carregar dados da planilha: ${errText}`);
    }
  }

  const data = await response.json();
  const rows: string[][] = data.values;

  if (!rows || rows.length < 2) {
    throw new Error('Nenhum dado encontrado ou a planilha está vazia.');
  }

  const headers = rows[0].map(h => (String(h || '') || "").toUpperCase().trim());
  
  // Detecta se é a planilha SAGA bruta (com FUNCIONARIO na coluna Y/24 e UMA ORIGEM na coluna H/7)
  const idxFuncionario = headers.findIndex(h => h === 'FUNCIONARIO' || h === 'FUNCIONÁRIO');
  const idxUmaOrigem = headers.findIndex(h => h === 'UMA ORIGEM' || h === 'UMA_ORIGEM');

  const finalIdxFunc = idxFuncionario !== -1 ? idxFuncionario : (headers.length > 24 ? 24 : -1);
  const finalIdxUma = idxUmaOrigem !== -1 ? idxUmaOrigem : (headers.length > 7 ? 7 : -1);

  if (finalIdxFunc !== -1 && finalIdxUma !== -1) {
    // Processamento com a Regra Crítica de Deduplicação de U.M.A. por Funcionário
    const rankingMap: Record<string, Set<string>> = {};

    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      if (!row) continue;
      const funcionario = (row[finalIdxFunc] || "").trim().toUpperCase();
      const uma = (row[finalIdxUma] || "").trim().toUpperCase();

      if (funcionario && uma) {
        if (!rankingMap[funcionario]) {
          rankingMap[funcionario] = new Set<string>();
        }
        rankingMap[funcionario].add(uma);
      }
    }

    const parsedOperators: OperatorSummary[] = Object.entries(rankingMap).map(([colaborador, umasSet], index) => {
      const prod = umasSet.size;
      return {
        rank: index + 1,
        name: colaborador,
        turno: 'A',
        totalProductivity: prod,
        movements: prod,
        participation: 0,
        trendGrowth: +(Math.random() * 8 + 2).toFixed(1),
        sparkline: [prod * 0.7, prod * 0.8, prod * 0.75, prod * 0.85, prod * 0.9, prod],
        topActivity: 'MOVIMENTAÇÃO',
        activitiesCount: { 'MOVIMENTAÇÃO': prod }
      };
    });

    // Ordena do maior para o menor
    parsedOperators.sort((a, b) => {
      const prodA = a?.totalProductivity || 0;
      const prodB = b?.totalProductivity || 0;
      return prodB - prodA;
    });

    // Ajusta as posições de rank
    parsedOperators.forEach((op, idx) => {
      op.rank = idx + 1;
    });

    return parsedOperators;
  }

  // Fallback para planilhas de ranking pré-calculadas
  const colIndexColaborador = headers.findIndex(h => h.includes('COLABORADOR') || h.includes('NOME') || h.includes('U.M.A') || h.includes('UMA'));
  const colIndexProdutividade = headers.findIndex(h => h.includes('PRODUTIVIDADE') || h.includes('ORDENS') || h.includes('QUANTIDADE') || h.includes('TOTAL'));
  const colIndexMovimentacoes = headers.findIndex(h => h.includes('MOVIMENTA') || h.includes('MOV') || h.includes('PEÇAS'));
  const colIndexTurno = headers.findIndex(h => h.includes('TURNO'));

  if (colIndexColaborador === -1 || colIndexProdutividade === -1) {
    return parseDefaultRows(rows);
  }

  const parsedOperators: OperatorSummary[] = [];

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    if (!row) continue;
    const name = row[colIndexColaborador];
    if (!name) continue;

    const rawProd = row[colIndexProdutividade];
    const prod = parseInt(String(rawProd || '').replace(/\D/g, ''), 10);
    if (isNaN(prod)) continue;

    const rawMov = colIndexMovimentacoes !== -1 ? row[colIndexMovimentacoes] : '';
    const mov = parseInt(String(rawMov || '').replace(/\D/g, ''), 10) || Math.round(prod / 110);
    
    const turno = colIndexTurno !== -1 ? row[colIndexTurno] : undefined;

    parsedOperators.push({
      rank: i,
      name: (name || "").toUpperCase().trim(),
      turno: turno || 'A',
      totalProductivity: prod,
      movements: mov || 20,
      participation: 0,
      trendGrowth: +(Math.random() * 8 + 2).toFixed(1),
      sparkline: [prod * 0.7, prod * 0.8, prod * 0.75, prod * 0.85, prod * 0.9, prod],
      topActivity: 'APANHA',
      activitiesCount: { 'APANHA': mov || 20 }
    });
  }

  return parsedOperators;
}

function parseDefaultRows(rows: string[][]): OperatorSummary[] {
  const parsedOperators: OperatorSummary[] = [];
  
  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    const name = row[0] || row[1];
    if (!name) continue;

    const prodVal = row[1] || row[2];
    const prod = parseInt(String(prodVal || '').replace(/\D/g, ''), 10);
    if (isNaN(prod)) continue;

    const movVal = row[2] || row[3];
    const mov = parseInt(String(movVal || '').replace(/\D/g, ''), 10) || Math.round(prod / 110);

    parsedOperators.push({
      rank: i,
      name: (name || "").toUpperCase().trim(),
      turno: 'A',
      totalProductivity: prod,
      movements: mov || 20,
      participation: 0,
      trendGrowth: +(Math.random() * 8 + 2).toFixed(1),
      sparkline: [prod * 0.7, prod * 0.8, prod * 0.75, prod * 0.85, prod * 0.9, prod],
      topActivity: 'APANHA',
      activitiesCount: { 'APANHA': mov || 20 }
    });
  }

  return parsedOperators;
}

/**
 * Extrai o ID da planilha de um link do Google Sheets
 */
export function extrairSpreadsheetId(url: string): string {
  const match = url.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
  return match ? match[1] : url;
}