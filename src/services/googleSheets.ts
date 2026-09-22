import { getAccessToken } from './googleAuth';
import { OperatorSummary } from '../types';
import { RankingRow } from '../utils/rankingPdfParser';

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
 * Script Apps Script oficial para copiar e colar no Google Sheets (Extensões > Apps Script)
 */
export const OFFICIAL_GOOGLE_APPS_SCRIPT = `/**
 * ============================================================================
 * SAGA WMS • 3 CORAÇÕES - SCRIPT DE SINCRONIZAÇÃO EM TEMPO REAL
 * ============================================================================
 * Regra de Negócio:
 * - Localiza dinamicamente o cabeçalho correto e a coluna de Colaborador/Funcionário.
 * - Filtra estritamente datas/timestamps GMT para garantir apenas nomes de colaboradores válidos.
 * - O ranking é contabilizado pelo número de UMA DESTINO única por usuário (1 ponto por UMA DESTINO).
 * - Se a mesma UMA DESTINO se repete para o MESMO usuário, é contabilizada apenas 1 vez.
 * - Se a mesma UMA DESTINO pertencer a OUTRO usuário, contabiliza 1 ponto para o outro usuário.
 * - Todas as atividades reais da coluna ATIVIDADE são extraídas e enviadas para o filtro do app.
 */

const FIREBASE_RTDB_URL = "https://ranking-produtividade-default-rtdb.firebaseio.com/ranking_atual.json";

function onOpen() {
  try {
    const ui = SpreadsheetApp.getUi();
    ui.createMenu('⚡ SAGA WMS')
      .addItem('🚀 Sincronizar com App SAGA (Agora)', 'sincronizarComAppSaga')
      .addSeparator()
      .addItem('⚙️ Agendar Sincronização Automática (A cada hora)', 'agendarSincronizacaoAutomatica')
      .addToUi();
  } catch (e) {
    Logger.log("Erro no onOpen: " + e.toString());
  }
}

function sincronizarComAppSaga() {
  var ui = SpreadsheetApp.getUi();

  try {
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    var data = sheet.getDataRange().getValues();

    if (!data || data.length < 2) {
      ui.alert('⚠️ A planilha está vazia ou possui apenas o cabeçalho.');
      return;
    }

    // 1. Localiza dinamicamente a linha de cabeçalho (varre as primeiras 10 linhas)
    var headerRowIndex = 0;
    var idxFunc = -1;
    var idxUmaDestino = -1;
    var idxUmaOrigem = -1;
    var idxAtividade = -1;
    var idxTurno = -1;

    for (var r = 0; r < Math.min(data.length, 10); r++) {
      var rowHeaders = [];
      for (var h = 0; h < data[r].length; h++) {
        rowHeaders.push(String(data[r][h] || '').toUpperCase().trim());
      }

      var tempFunc = -1;
      var tempUmaDest = -1;
      var tempUmaOrig = -1;
      var tempAtiv = -1;
      var tempTurno = -1;

      for (var c = 0; c < rowHeaders.length; c++) {
        var hName = rowHeaders[c];
        if (!hName) continue;

        if (tempFunc === -1 && (
          hName.indexOf('FUNCIONARIO') !== -1 || hName.indexOf('FUNCIONÁRIO') !== -1 ||
          hName.indexOf('COLABORADOR') !== -1 || hName.indexOf('OPERADOR') !== -1 ||
          hName.indexOf('USUARIO') !== -1 || hName.indexOf('USUÁRIO') !== -1 ||
          hName.indexOf('MATRICULA') !== -1 || hName.indexOf('MATRÍCULA') !== -1 ||
          (hName.indexOf('NOME') !== -1 && hName.indexOf('PRODUTO') === -1 && hName.indexOf('ATIVIDADE') === -1 && hName.indexOf('DEPOSITO') === -1)
        )) {
          tempFunc = c;
        }

        if (tempUmaDest === -1 && (
          hName.indexOf('UMA DESTINO') !== -1 || hName.indexOf('UMA_DESTINO') !== -1 ||
          hName.indexOf('ENDERECO DESTINO') !== -1 || hName.indexOf('ENDEREÇO DESTINO') !== -1 ||
          (hName.indexOf('DESTINO') !== -1 && hName.indexOf('DEPOSITO') === -1)
        )) {
          tempUmaDest = c;
        }

        if (tempUmaOrig === -1 && (
          hName.indexOf('UMA ORIGEM') !== -1 || hName.indexOf('UMA_ORIGEM') !== -1 ||
          hName.indexOf('ENDERECO ORIGEM') !== -1 || hName.indexOf('ENDEREÇO ORIGEM') !== -1 ||
          hName.indexOf('ORIGEM') !== -1
        )) {
          tempUmaOrig = c;
        }

        if (tempAtiv === -1 && (
          hName.indexOf('ATIVIDADE') !== -1 || hName.indexOf('SERVICO') !== -1 ||
          hName.indexOf('SERVIÇO') !== -1 || hName.indexOf('TAREFA') !== -1 ||
          hName.indexOf('OPERAÇÃO') !== -1 || hName.indexOf('OPERACAO') !== -1
        )) {
          tempAtiv = c;
        }

        if (tempTurno === -1 && (hName.indexOf('TURNO') !== -1 || hName.indexOf('EQUIPE') !== -1)) {
          tempTurno = c;
        }
      }

      if (tempFunc !== -1 || tempUmaDest !== -1 || tempAtiv !== -1) {
        headerRowIndex = r;
        idxFunc = tempFunc;
        idxUmaDestino = tempUmaDest;
        idxUmaOrigem = tempUmaOrig;
        idxAtividade = tempAtiv;
        idxTurno = tempTurno;
        break;
      }
    }

    // Fallback de segurança se a coluna do funcionário não foi encontrada por nome
    if (idxFunc === -1) {
      // Procura nas linhas de dados a coluna que contém nomes reais (texto sem data)
      for (var col = 0; col < (data[0] ? data[0].length : 0); col++) {
        var sampleVal = String(data[headerRowIndex + 1] ? data[headerRowIndex + 1][col] : '').trim();
        if (sampleVal && sampleVal.indexOf('GMT') === -1 && !/^\d{2}\/\d{2}/.test(sampleVal) && isNaN(Number(sampleVal))) {
          idxFunc = col;
          break;
        }
      }
      if (idxFunc === -1) idxFunc = 0;
    }

    var idxUma = idxUmaDestino !== -1 ? idxUmaDestino : (idxUmaOrigem !== -1 ? idxUmaOrigem : 1);

    var rankingMap = {};

    for (var i = headerRowIndex + 1; i < data.length; i++) {
      var row = data[i];
      if (!row || row.length === 0) continue;

      var rawFunc = row[idxFunc];
      if (!rawFunc) continue;

      // Validação estrita contra datas e timestamps
      if (rawFunc instanceof Date) continue;

      var func = String(rawFunc).trim().toUpperCase();

      if (
        !func ||
        func === 'UNDEFINED' || func === 'NULL' || func === 'TOTAL' || func === 'SUBTOTAL' ||
        func.indexOf('GMT') !== -1 || func.indexOf('BRT') !== -1 || func.indexOf('UTC') !== -1 ||
        func.indexOf('2026') !== -1 || func.indexOf('2025') !== -1 || func.indexOf('2024') !== -1 ||
        /^\d{2}\/\d{2}\/\d{4}/.test(func) || /^\d{4}-\d{2}-\d{2}/.test(func)
      ) {
        continue;
      }

      var rawUma = row[idxUma];
      var umaDest = (rawUma && !(rawUma instanceof Date)) ? String(rawUma).trim().toUpperCase() : '';

      var rawAtiv = idxAtividade !== -1 ? row[idxAtividade] : null;
      var atividade = 'MOVIMENTAÇÃO';
      if (rawAtiv && !(rawAtiv instanceof Date)) {
        var strAtiv = String(rawAtiv).trim().toUpperCase();
        if (strAtiv && strAtiv.indexOf('GMT') === -1 && strAtiv.indexOf('2026') === -1) {
          atividade = strAtiv;
        }
      }

      var rawTurno = idxTurno !== -1 ? row[idxTurno] : null;
      var turno = (rawTurno && !(rawTurno instanceof Date)) ? String(rawTurno).trim().toUpperCase() : 'A';

      if (!rankingMap[func]) {
        rankingMap[func] = {
          name: func,
          turno: turno || 'A',
          umasObj: {},
          umasCount: 0,
          activitiesCount: {},
          totalRows: 0,
          registrosDetalhados: []
        };
      }

      rankingMap[func].totalRows++;

      // Contabiliza cada UMA DESTINO única por usuário (1 ponto por UMA DESTINO)
      if (umaDest && umaDest !== '') {
        if (!rankingMap[func].umasObj[umaDest]) {
          rankingMap[func].umasObj[umaDest] = true;
          rankingMap[func].umasCount++;
        }
      }

      if (atividade && atividade !== '') {
        rankingMap[func].activitiesCount[atividade] = (rankingMap[func].activitiesCount[atividade] || 0) + 1;
      }

      rankingMap[func].registrosDetalhados.push({
        uma: umaDest || 'N/A',
        atividade: atividade || 'MOVIMENTAÇÃO',
        qtdOrdens: 1,
        qtdServ: 1,
        qtdPecas: 1,
        qtdLotes: 1,
        data: new Date().toLocaleDateString('pt-BR')
      });
    }

    var keys = Object.keys(rankingMap);
    if (keys.length === 0) {
      ui.alert('⚠️ Nenhum colaborador válido encontrado na planilha.\nVerifique se a coluna de NOME/FUNCIONÁRIO está preenchida corretamente.');
      return;
    }

    var operators = [];
    var totalGeral = 0;

    for (var k = 0; k < keys.length; k++) {
      var name = keys[k];
      var item = rankingMap[name];
      var prod = item.umasCount > 0 ? item.umasCount : item.totalRows;
      totalGeral += prod;

      var topAct = 'MOVIMENTAÇÃO';
      var maxAct = 0;
      var actKeys = Object.keys(item.activitiesCount);
      for (var a = 0; a < actKeys.length; a++) {
        var actName = actKeys[a];
        if (item.activitiesCount[actName] > maxAct) {
          maxAct = item.activitiesCount[actName];
          topAct = actName;
        }
      }

      operators.push({
        rank: k + 1,
        name: item.name,
        turno: item.turno || 'A',
        totalProductivity: prod,
        movements: prod,
        participation: 0,
        trendGrowth: 5.5,
        sparkline: [Math.round(prod * 0.7), Math.round(prod * 0.85), prod],
        topActivity: topAct,
        activitiesCount: item.activitiesCount,
        registrosDetalhados: item.registrosDetalhados.slice(0, 200)
      });
    }

    operators.sort(function(a, b) {
      return b.totalProductivity - a.totalProductivity;
    });

    for (var r = 0; r < operators.length; r++) {
      operators[r].rank = r + 1;
    }

    var payload = {
      operators: operators,
      label: "PLANILHA GOOGLE SHEETS SAGA • " + sheet.getName(),
      updatedAt: new Date().toISOString(),
      totalOperators: operators.length,
      totalProductivity: totalGeral,
      totalMovements: totalGeral
    };

    var options = {
      method: 'put',
      contentType: 'application/json',
      payload: JSON.stringify(payload),
      muteHttpExceptions: true
    };

    var response = UrlFetchApp.fetch(FIREBASE_RTDB_URL, options);
    var code = response.getResponseCode();

    if (code === 200) {
      ui.alert('✅ SUCESSO!\n\n' + operators.length + ' colaboradores válidos sincronizados com sucesso!\n\nRanking contabilizado por UMA DESTINO única por usuário.');
    } else {
      ui.alert('⚠️ Resposta do Servidor (Código ' + code + '):\n' + response.getContentText());
    }

  } catch (err) {
    ui.alert('❌ ERRO NO SCRIPT:\n\n' + err.toString());
  }
}

function agendarSincronizacaoAutomatica() {
  var ui = SpreadsheetApp.getUi();
  try {
    ScriptApp.newTrigger('sincronizarComAppSaga')
      .timeBased()
      .everyHours(1)
      .create();
    ui.alert('⏰ Sincronização automática agendada a cada 1 hora!');
  } catch (e) {
    ui.alert('❌ Erro ao agendar: ' + e.toString());
  }
}
`;

/**
 * Busca os dados de uma planilha existente do Google Sheets e converte para OperatorSummary[]
 */
export async function importarRankingDeSheets(
  spreadsheetIdOrUrl = FIXED_SPREADSHEET_ID,
  rangeName = 'PRODUTIVIDADE!A:Z'
): Promise<OperatorSummary[]> {
  const extractedId = extrairSpreadsheetId(spreadsheetIdOrUrl);

  // 1. Tenta carregar via Google Apps Script / Web App URL direto se for link de script
  if (spreadsheetIdOrUrl.includes('script.google.com') || spreadsheetIdOrUrl.includes('/exec')) {
    const res = await fetch(spreadsheetIdOrUrl);
    if (!res.ok) throw new Error('Não foi possível conectar ao Web App do Google Apps Script.');
    const json = await res.json();
    if (json.operators && Array.isArray(json.operators)) {
      return json.operators;
    }
    if (json.values && Array.isArray(json.values)) {
      return parseRowsFromSheetData(json.values);
    }
  }

  // 2. Tenta via GViz API pública do Google Sheets (não exige OAuth)
  try {
    const gvizUrl = `https://docs.google.com/spreadsheets/d/${extractedId}/gviz/tq?tqx=out:json`;
    const gvizRes = await fetch(gvizUrl);
    if (gvizRes.ok) {
      const text = await gvizRes.text();
      // Remove o wrapper google.visualization.Query.setResponse(...)
      const match = text.match(/google\.visualization\.Query\.setResponse\(([\s\S]*)\);/);
      if (match && match[1]) {
        const parsedGviz = JSON.parse(match[1]);
        if (parsedGviz.table && parsedGviz.table.rows) {
          const rows: string[][] = [];
          // Extrai cabeçalhos
          if (parsedGviz.table.cols) {
            const headerRow = parsedGviz.table.cols.map((c: any) => c.label || c.id || '');
            rows.push(headerRow);
          }
          // Extrai células
          parsedGviz.table.rows.forEach((r: any) => {
            if (r.c) {
              const rowValues = r.c.map((cell: any) => cell ? (cell.v !== null && cell.v !== undefined ? String(cell.v) : '') : '');
              rows.push(rowValues);
            }
          });

          if (rows.length >= 2) {
            return parseRowsFromSheetData(rows);
          }
        }
      }
    }
  } catch (gvizErr) {
    console.warn("Conexão GViz não pública, tentando via Google OAuth API:", gvizErr);
  }

  // 3. Fallback: Google Sheets API oficial v4 com Token OAuth
  const token = await getAccessToken();
  if (!token) {
    throw new Error('Por favor, faça login com sua Conta Google para acessar esta planilha privada, ou use o Script SAGA para envio direto.');
  }

  let url = `https://sheets.googleapis.com/v4/spreadsheets/${extractedId}/values/${encodeURIComponent(rangeName)}`;
  let response = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const fallbackUrl = `https://sheets.googleapis.com/v4/spreadsheets/${extractedId}/values/A:Z`;
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

  return parseRowsFromSheetData(rows);
}

/**
 * Converte matriz de strings da planilha para OperatorSummary[]
 */
function parseRowsFromSheetData(rows: string[][]): OperatorSummary[] {
  if (!rows || rows.length < 2) {
    throw new Error('Nenhum dado válido encontrado.');
  }

  // Localiza dinamicamente a linha de cabeçalho
  let headerRowIndex = 0;
  let idxFuncionario = -1;
  let idxUmaDestino = -1;
  let idxUmaOrigem = -1;
  let idxAtividade = -1;
  let idxTurno = -1;

  for (let r = 0; r < Math.min(rows.length, 10); r++) {
    const rowHeaders = (rows[r] || []).map(h => (String(h || '') || "").toUpperCase().trim());

    let tempFunc = -1;
    let tempUmaDest = -1;
    let tempUmaOrig = -1;
    let tempAtiv = -1;
    let tempTurno = -1;

    for (let c = 0; c < rowHeaders.length; c++) {
      const hName = rowHeaders[c];
      if (!hName) continue;

      if (tempFunc === -1 && (
        hName.includes('FUNCIONARIO') || hName.includes('FUNCIONÁRIO') ||
        hName.includes('COLABORADOR') || hName.includes('OPERADOR') ||
        hName.includes('USUARIO') || hName.includes('USUÁRIO') ||
        hName.includes('MATRICULA') || hName.includes('MATRÍCULA') ||
        (hName.includes('NOME') && !hName.includes('PRODUTO') && !hName.includes('ATIVIDADE') && !hName.includes('DEPOSITO'))
      )) {
        tempFunc = c;
      }

      if (tempUmaDest === -1 && (
        hName.includes('UMA DESTINO') || hName.includes('UMA_DESTINO') ||
        hName.includes('ENDERECO DESTINO') || hName.includes('ENDEREÇO DESTINO') ||
        (hName.includes('DESTINO') && !hName.includes('DEPOSITO'))
      )) {
        tempUmaDest = c;
      }

      if (tempUmaOrig === -1 && (
        hName.includes('UMA ORIGEM') || hName.includes('UMA_ORIGEM') ||
        hName.includes('ENDERECO ORIGEM') || hName.includes('ENDEREÇO ORIGEM') ||
        hName.includes('ORIGEM')
      )) {
        tempUmaOrig = c;
      }

      if (tempAtiv === -1 && (
        hName.includes('ATIVIDADE') || hName.includes('SERVICO') ||
        hName.includes('SERVIÇO') || hName.includes('TAREFA') ||
        hName.includes('OPERAÇÃO') || hName.includes('OPERACAO')
      )) {
        tempAtiv = c;
      }

      if (tempTurno === -1 && (hName.includes('TURNO') || hName.includes('EQUIPE'))) {
        tempTurno = c;
      }
    }

    if (tempFunc !== -1 || tempUmaDest !== -1 || tempAtiv !== -1) {
      headerRowIndex = r;
      idxFuncionario = tempFunc;
      idxUmaDestino = tempUmaDest;
      idxUmaOrigem = tempUmaOrig;
      idxAtividade = tempAtiv;
      idxTurno = tempTurno;
      break;
    }
  }

  if (idxFuncionario === -1) {
    for (let col = 0; col < (rows[0] ? rows[0].length : 0); col++) {
      const sampleVal = String(rows[headerRowIndex + 1] ? rows[headerRowIndex + 1][col] : '').trim();
      if (sampleVal && !sampleVal.includes('GMT') && !/^\d{2}\/\d{2}/.test(sampleVal) && isNaN(Number(sampleVal))) {
        idxFuncionario = col;
        break;
      }
    }
    if (idxFuncionario === -1) idxFuncionario = 0;
  }

  const finalIdxUma = idxUmaDestino !== -1 ? idxUmaDestino : (idxUmaOrigem !== -1 ? idxUmaOrigem : 1);

  const rankingMap: Record<string, {
    name: string;
    turno: string;
    umasSet: Set<string>;
    activitiesCount: Record<string, number>;
    totalOrdens: number;
    registrosDetalhados: RankingRow[];
  }> = {};

  for (let i = headerRowIndex + 1; i < rows.length; i++) {
    const row = rows[i];
    if (!row) continue;

    const rawFunc = row[idxFuncionario];
    if (!rawFunc) continue;

    const funcionario = String(rawFunc).trim().toUpperCase();

    // Filtra estritamente datas e timestamps
    if (
      !funcionario ||
      funcionario === 'UNDEFINED' || funcionario === 'NULL' || funcionario === 'TOTAL' || funcionario === 'SUBTOTAL' ||
      funcionario.includes('GMT') || funcionario.includes('BRT') || funcionario.includes('UTC') ||
      funcionario.includes('2026') || funcionario.includes('2025') || funcionario.includes('2024') ||
      /^\d{2}\/\d{2}\/\d{4}/.test(funcionario) || /^\d{4}-\d{2}-\d{2}/.test(funcionario)
    ) {
      continue;
    }

    const rawUma = row[finalIdxUma];
    const umaDest = rawUma ? String(rawUma).trim().toUpperCase() : '';

    const rawAtiv = idxAtividade !== -1 ? row[idxAtividade] : null;
    let atividade = 'MOVIMENTAÇÃO';
    if (rawAtiv) {
      const strAtiv = String(rawAtiv).trim().toUpperCase();
      if (strAtiv && !strAtiv.includes('GMT') && !strAtiv.includes('2026')) {
        atividade = strAtiv;
      }
    }

    const rawTurno = idxTurno !== -1 ? row[idxTurno] : null;
    const turno = rawTurno ? String(rawTurno).trim().toUpperCase() : 'A';

    if (!rankingMap[funcionario]) {
      rankingMap[funcionario] = {
        name: funcionario,
        turno: turno || 'A',
        umasSet: new Set<string>(),
        activitiesCount: {},
        totalOrdens: 0,
        registrosDetalhados: []
      };
    }
    
    // Contabiliza cada UMA DESTINO única por usuário (1 ponto por UMA DESTINO única do usuário)
    if (umaDest) rankingMap[funcionario].umasSet.add(umaDest);
    rankingMap[funcionario].totalOrdens += 1;

    if (atividade) {
      rankingMap[funcionario].activitiesCount[atividade] = (rankingMap[funcionario].activitiesCount[atividade] || 0) + 1;
    }

    rankingMap[funcionario].registrosDetalhados.push({
      pagina: 1,
      colaborador: funcionario,
      atividade: atividade || 'MOVIMENTAÇÃO',
      qtdOrdens: 1,
      qtdServ: 1,
      qtdPecas: 1,
      qtdLotes: 1,
      qtdItens: 1,
      qtdEnd: 1,
      data: new Date().toLocaleDateString('pt-BR'),
      umaDestino: umaDest || 'N/A'
    });
  }

  const parsedOperators: OperatorSummary[] = Object.values(rankingMap).map((item, index) => {
    const prod = item.umasSet.size > 0 ? item.umasSet.size : item.totalOrdens;
    let topAct = 'MOVIMENTAÇÃO';
    let maxAct = 0;
    Object.entries(item.activitiesCount).forEach(([act, count]) => {
      if (count > maxAct) {
        maxAct = count;
        topAct = act;
      }
    });

    return {
      rank: index + 1,
      name: item.name,
      turno: item.turno || 'A',
      totalProductivity: prod,
      movements: prod,
      participation: 0,
      trendGrowth: +(Math.random() * 8 + 2).toFixed(1),
      sparkline: [prod * 0.7, prod * 0.8, prod * 0.75, prod * 0.85, prod * 0.9, prod],
      topActivity: topAct,
      activitiesCount: item.activitiesCount,
      registrosDetalhados: item.registrosDetalhados.slice(0, 200)
    };
  });

  // Ordena do maior para o menor
  parsedOperators.sort((a, b) => b.totalProductivity - a.totalProductivity);
  parsedOperators.forEach((op, idx) => {
    op.rank = idx + 1;
  });

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