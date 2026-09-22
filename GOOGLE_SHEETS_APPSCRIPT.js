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

  let idxAtividade = headers.findIndex(h => 
    h.includes('ATIVIDADE') || h.includes('ATIV') || 
    h.includes('PROCESSO') || h.includes('SERVICO') || h.includes('SERVIÇO') ||
    h.includes('OPERACAO') || h.includes('OPERAÇÃO')
  );

  let idxUma = headers.findIndex(h => 
    h.includes('UMA DESTINO') || h.includes('UMA_DESTINO') ||
    h.includes('UMA ORIGEM') || h.includes('UMA_ORIGEM') || 
    h.includes('DESTINO') || h.includes('ORIGEM') || h.includes('UMA')
  );

  let idxProd = headers.findIndex(h => 
    h.includes('PRODUTIVIDADE') || h.includes('TOTAL') || 
    h.includes('ORDENS') || h.includes('QUANTIDADE') || 
    h.includes('MOVIMENTAÇÃO') || h.includes('MOVIMENTACOES') || 
    h.includes('PEÇAS') || h.includes('PECAS')
  );

  let idxData = headers.findIndex(h => 
    h.includes('DATA') || h.includes('HORA') || h.includes('TIMESTAMP')
  );

  let idxTurno = headers.findIndex(h => h.includes('TURNO'));

  const rankingMap = {};
  const turnosMap = {};
  const activitiesSet = new Set();
  let minDataStr = "";
  let maxDataStr = "";

  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    if (!row || row.join('').trim() === '') continue;

    const func = idxFunc !== -1 
      ? String(row[idxFunc] || '').trim().toUpperCase() 
      : String(row[0] || '').trim().toUpperCase();
    if (!func || func === 'TOTAL' || func === 'TOTAL GERAL') continue;

    // Atividade da linha
    let rawAtv = idxAtividade !== -1 ? String(row[idxAtividade] || '').trim().toUpperCase() : 'MOVIMENTACAO';
    if (!rawAtv) rawAtv = 'MOVIMENTACAO';
    activitiesSet.add(rawAtv);

    // UMA se houver
    const uma = idxUma !== -1 ? String(row[idxUma] || '').trim().toUpperCase() : '';

    // Quantidade se houver coluna de produtividade direta
    let prodQtd = 1;
    if (idxProd !== -1 && row[idxProd] !== undefined && row[idxProd] !== '') {
      const rawVal = row[idxProd];
      prodQtd = typeof rawVal === 'number' ? rawVal : (parseInt(String(rawVal).replace(/\D/g, ''), 10) || 1);
    }

    if (!rankingMap[func]) {
      rankingMap[func] = {
        allUmas: {},
        umaPerActivity: {},
        countPerActivity: {},
        totalCount: 0
      };
    }

    if (idxTurno !== -1 && row[idxTurno]) {
      turnosMap[func] = String(row[idxTurno]).trim().toUpperCase();
    }

    if (uma) {
      rankingMap[func].allUmas[uma] = true;
      if (!rankingMap[func].umaPerActivity[rawAtv]) {
        rankingMap[func].umaPerActivity[rawAtv] = {};
      }
      rankingMap[func].umaPerActivity[rawAtv][uma] = true;
    } else {
      rankingMap[func].countPerActivity[rawAtv] = (rankingMap[func].countPerActivity[rawAtv] || 0) + prodQtd;
      rankingMap[func].totalCount += prodQtd;
    }

    // Datas
    if (idxData !== -1 && row[idxData]) {
      const d = row[idxData];
      let dStr = '';
      if (d instanceof Date) {
        dStr = Utilities.formatDate(d, Session.getScriptTimeZone(), 'dd/MM/yyyy');
      } else {
        dStr = String(d).trim();
      }
      if (dStr) {
        if (!minDataStr) minDataStr = dStr;
        maxDataStr = dStr;
      }
    }
  }

  // Gera a lista de operadores formatada com detalhamento por atividade
  const activitiesList = Array.from(activitiesSet).sort();
  const operators = Object.keys(rankingMap).map(nome => {
    const info = rankingMap[nome];
    const hasUmas = Object.keys(info.allUmas).length > 0;
    const totalProd = hasUmas ? Object.keys(info.allUmas).length : (info.totalCount || 1);

    const activitiesCount = {};
    let topAtv = "";
    let maxAtvCount = -1;

    activitiesList.forEach(atv => {
      const safeKey = atv.replace(/[\.\#\$\/\[\]]/g, '_');
      let count = 0;
      if (info.umaPerActivity[atv]) {
        count = Object.keys(info.umaPerActivity[atv]).length;
      } else if (info.countPerActivity[atv]) {
        count = info.countPerActivity[atv];
      }
      if (count > 0) {
        activitiesCount[safeKey] = count;
        if (count > maxAtvCount) {
          maxAtvCount = count;
          topAtv = atv;
        }
      }
    });

    if (!topAtv) {
      topAtv = activitiesList[0] || "MOVIMENTACAO";
      const safeKey = topAtv.replace(/[\.\#\$\/\[\]]/g, '_');
      activitiesCount[safeKey] = totalProd;
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
      topActivity: topAtv,
      activitiesCount: activitiesCount,
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
  enviarAoFirebase(operators, label, activitiesList, minDataStr, maxDataStr);
}

/**
 * Envia o payload atualizado via PUT direto para o Firebase Realtime Database
 */
function enviarAoFirebase(operators, label, activitiesList, dataInicio, dataFim) {
  const totalProd = operators.reduce((acc, op) => acc + (op.totalProductivity || 0), 0);
  const payload = {
    operators: operators,
    activities: activitiesList || [],
    label: label,
    dataInicio: dataInicio || "01/09/2026",
    dataFim: dataFim || "20/09/2026",
    totalOperators: operators.length,
    totalProductivity: totalProd,
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
