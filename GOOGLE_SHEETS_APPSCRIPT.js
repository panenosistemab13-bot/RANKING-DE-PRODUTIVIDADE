/**
 * GOOGLE APPS SCRIPT OFICIAL • RANKING DE PRODUTIVIDADE
 * Sincronização Instantânea em Tempo Real com o App via Firebase
 * 
 * Planilha: https://docs.google.com/spreadsheets/d/1synVKAYxOm4dRUXEuw65u0Lv1erLF7-9PXeAUtSd-QA/edit?gid=111123643#gid=111123643
 * GID da Aba: 111123643
 */

const FIREBASE_URL = "https://ranking-produtividade-default-rtdb.firebaseio.com/ranking_atual.json";
const GID_ALVO = "111123643";

/**
 * Cria o menu personalizado na barra de ferramentas da planilha
 */
function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu("⚡ Sincronização App")
    .addItem("▶ 1. ATIVAR SINCRONIZAÇÃO EM TEMPO REAL", "ativarSincronizacaoEmTempoReal")
    .addItem("🔄 2. Sincronizar Agora Manualmente", "sincronizarComFirebase")
    .addToUi();
}

/**
 * ATIVAÇÃO DOS GATILHOS INSTALÁVEIS COM PERMISSÃO DE REDE
 * Execute esta função UMA VEZ no editor de script para autorizar a sincronização contínua.
 */
function ativarSincronizacaoEmTempoReal() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();

  // Limpa gatilhos anteriores deste projeto para não duplicar
  const triggers = ScriptApp.getProjectTriggers();
  for (let i = 0; i < triggers.length; i++) {
    ScriptApp.deleteTrigger(triggers[i]);
  }

  // 1. Gatilho ao editar qualquer célula (adicionar ou apagar)
  ScriptApp.newTrigger("sincronizarComFirebase")
    .forSpreadsheet(ss)
    .onEdit()
    .create();

  // 2. Gatilho ao alterar estrutura (inserir/excluir linhas, limpar colunas)
  ScriptApp.newTrigger("sincronizarComFirebase")
    .forSpreadsheet(ss)
    .onChange()
    .create();

  // 3. Gatilho de backup a cada 1 minuto (garante sincronização contínua)
  ScriptApp.newTrigger("sincronizarComFirebase")
    .timeBased()
    .everyMinutes(1)
    .create();

  // Executa uma sincronização imediata
  sincronizarComFirebase();

  try {
    SpreadsheetApp.getUi().alert("✅ Sincronização em Tempo Real ativada com sucesso!\n\nQualquer edição ou exclusão na planilha será enviada instantaneamente para o aplicativo.");
  } catch (e) {
    Logger.log("Sincronização ativada com sucesso!");
  }
}

/**
 * Localiza a aba correta pelo GID 111123643
 */
function obterAbaAlvo(ss) {
  const sheets = ss.getSheets();
  for (let i = 0; i < sheets.length; i++) {
    if (sheets[i].getSheetId().toString() === GID_ALVO) {
      return sheets[i];
    }
  }
  // Se não encontrar pelo GID, procura por aba 'PRODUTIVIDADE' ou a primeira
  return ss.getSheetByName("PRODUTIVIDADE") || ss.getActiveSheet() || sheets[0];
}

/**
 * Função que processa os dados da planilha e atualiza o Firebase Realtime
 */
function sincronizarComFirebase() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = obterAbaAlvo(ss);

  if (!sheet) {
    Logger.log("Aba não encontrada.");
    return;
  }

  const data = sheet.getDataRange().getValues();
  if (!data || data.length < 2) {
    // Se a planilha foi limpa ou está sem linhas de dados
    enviarAoFirebase([], "Planilha limpa em " + new Date().toLocaleTimeString('pt-BR'));
    return;
  }

  const headers = data[0].map(h => String(h || '').trim().toUpperCase());

  // Procura os índices das colunas
  let idxFunc = headers.findIndex(h => 
    h.includes('FUNCIONARIO') || h.includes('FUNCIONÁRIO') || 
    h.includes('COLABORADOR') || h.includes('OPERADOR') || 
    h.includes('NOME')
  );

  let idxUma = headers.findIndex(h => 
    h.includes('UMA ORIGEM') || h.includes('UMA_ORIGEM') || 
    h.includes('ORIGEM') || h.includes('UMA')
  );

  let idxProd = headers.findIndex(h => 
    h.includes('PRODUTIVIDADE') || h.includes('TOTAL') || 
    h.includes('ORDENS') || h.includes('QUANTIDADE') || 
    h.includes('MOVIMENTAÇÃO') || h.includes('MOVIMENTACOES') || 
    h.includes('PEÇAS') || h.includes('PECAS')
  );

  let idxTurno = headers.findIndex(h => h.includes('TURNO'));

  const rankingMap = {};
  const turnosMap = {};

  // Caso 1: Planilha com registros de UMA por Funcionário (deduplicação SAGA)
  if (idxFunc !== -1 && idxUma !== -1) {
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      if (!row || row.join('').trim() === '') continue;
      const func = String(row[idxFunc] || '').trim().toUpperCase();
      const uma = String(row[idxUma] || '').trim().toUpperCase();
      if (func && uma) {
        if (!rankingMap[func]) rankingMap[func] = {};
        rankingMap[func][uma] = true;
        if (idxTurno !== -1 && row[idxTurno]) {
          turnosMap[func] = String(row[idxTurno]).trim().toUpperCase();
        }
      }
    }
  } 
  // Caso 2: Planilha com Totais diretos (Coluna Funcionário + Coluna Produtividade)
  else if (idxFunc !== -1 && idxProd !== -1) {
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      if (!row || row.join('').trim() === '') continue;
      const func = String(row[idxFunc] || '').trim().toUpperCase();
      const rawVal = row[idxProd];
      const prod = typeof rawVal === 'number' ? rawVal : (parseInt(String(rawVal || '').replace(/\D/g, ''), 10) || 0);
      if (func) {
        rankingMap[func] = (rankingMap[func] || 0) + prod;
        if (idxTurno !== -1 && row[idxTurno]) {
          turnosMap[func] = String(row[idxTurno]).trim().toUpperCase();
        }
      }
    }
  } 
  // Caso 3: Coluna A = Nome, Coluna B = Quantidade
  else {
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      if (!row || row.join('').trim() === '') continue;
      const colA = String(row[0] || '').trim().toUpperCase();
      const colB = row[1];
      const prod = typeof colB === 'number' ? colB : (parseInt(String(colB || '').replace(/\D/g, ''), 10) || 0);
      if (colA && colA !== 'TOTAL' && colA !== 'TOTAL GERAL') {
        rankingMap[colA] = (rankingMap[colA] || 0) + (prod || 1);
      }
    }
  }

  // Gera a lista de operadores formatada
  const operators = Object.keys(rankingMap).map(nome => {
    let totalProd = 0;
    if (typeof rankingMap[nome] === 'object') {
      totalProd = Object.keys(rankingMap[nome]).length;
    } else {
      totalProd = rankingMap[nome];
    }

    const t = turnosMap[nome] || "A";
    const spark = [
      Math.round(totalProd * 0.7),
      Math.round(totalProd * 0.8),
      Math.round(totalProd * 0.75),
      Math.round(totalProd * 0.85),
      Math.round(totalProd * 0.9),
      totalProd
    ];

    return {
      name: nome,
      totalProductivity: totalProd,
      movements: totalProd,
      turno: t,
      topActivity: "MOVIMENTAÇÃO UMA",
      activitiesCount: { "MOVIMENTAÇÃO UMA": totalProd },
      sparkline: spark,
      trendGrowth: 8.5
    };
  });

  // Ordena do maior para o menor e atribui rank
  operators.sort((a, b) => b.totalProductivity - a.totalProductivity);
  operators.forEach((op, index) => {
    op.rank = index + 1;
  });

  const horaAtual = new Date().toLocaleTimeString('pt-BR');
  const label = "Atualizado em tempo real da Planilha Google às " + horaAtual;
  enviarAoFirebase(operators, label);
}

/**
 * Envia o payload atualizado via PUT direto para o Firebase Realtime Database
 */
function enviarAoFirebase(operators, label) {
  const payload = {
    operators: operators,
    label: label,
    dataInicio: "02/01/2026",
    dataFim: "20/09/2026",
    timestamp: new Date().getTime(),
    updatedAt: new Date().toISOString()
  };

  const options = {
    method: "put",
    contentType: "application/json",
    payload: JSON.stringify(payload),
    muteHttpExceptions: true
  };

  try {
    const res = UrlFetchApp.fetch(FIREBASE_URL, options);
    Logger.log("Resposta Firebase: " + res.getResponseCode());
  } catch (err) {
    Logger.log("Erro ao enviar ao Firebase: " + err);
  }
}
