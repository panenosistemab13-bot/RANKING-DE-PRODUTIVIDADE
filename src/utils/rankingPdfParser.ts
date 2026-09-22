// src/utils/rankingPdfParser.ts

import * as pdfjsLib from "pdfjs-dist";
import pdfWorker from "pdfjs-dist/build/pdf.worker.min.mjs?url";
import { obterTurnoColaborador } from "./turnos";

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker;

export interface RankingRow {
  pagina: number;
  atividade: string;
  colaborador: string;
  qtdOrdens: number;
  qtdPecas: number;
  qtdLotes: number;
  qtdServ: number; // PRODUTIVIDADE REAL DO PDF
  qtdItens: number;
  qtdEnd: number;
  data: string;
  funcionarioOriginal?: string;
  umaOrigem?: string;
  umaDestino?: string;
}

export interface RankingColaborador {
  nome: string;
  turno?: string;
  qtdOrdens: number; // PRODUTIVIDADE = Qtd. Ordens
  qtdPecas: number;
  qtdLotes: number;
  qtdServ: number;
  qtdItens: number;
  qtdEnd: number;
  registros: number;
  atividades: string[];
  datas: string[];
  percentual: number;
  posicao: number;
  /*
   * Guarda todos os registros originais
   * daquele colaborador para recalcular filtros perfeitamente.
   */
  registrosDetalhados: RankingRow[];
  activitiesMetrics?: Record<string, {
    qtdOrdens: number;
    qtdPecas: number;
    qtdLotes: number;
    qtdServ: number;
    qtdItens: number;
    qtdEnd: number;
    registros: number;
  }>;
}

export interface RankingPdfResult {
  totalPaginas: number;
  linhas: RankingRow[];
  colaboradores: RankingColaborador[];
  atividades: string[];
  totalRegistros: number;
  totalColaboradores: number;
  dataInicio?: string;
  dataFim?: string;
  frasePeriodo?: string;
  todasDatas?: string[];
}

export type FiltroAtividade = string;

export type TipoOrdenacao =
  | "produtividade"
  | "movimentacoes"
  | "nome";

export function normalizarAtividade(
  atividade: string
) {
  if (!atividade) return "";
  return atividade
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .toUpperCase();
}

/**
 * Recalcula o ranking a partir dos registros detalhados individuais
 * usando a coluna Qtd. Serv. como produtividade.
 */
export function filtrarRanking(
  colaboradores: RankingColaborador[],
  atividade: FiltroAtividade,
  ordenacao: TipoOrdenacao = "produtividade",
  turno?: string
): RankingColaborador[] {
  /*
   * Primeiro filtra pela atividade e turno.
   *
   * IMPORTANTE:
   * O filtro utiliza os registros reais encontrados no PDF.
   */

  let baseColaboradores = colaboradores;
  if (turno && turno !== "TODOS" && turno !== "TODOS OS TURNOS") {
    baseColaboradores = baseColaboradores.filter((c) => {
      const colabTurno = c.turno || obterTurnoColaborador(c.nome);
      return (colabTurno || "").toUpperCase() === (turno || "").toUpperCase();
    });
  }

  let resultado = baseColaboradores.map((colaborador) => {
    const registrosFiltrados =
      colaborador.registrosDetalhados.filter(
        (registro) => {
          if (
            !atividade ||
            atividade === "TODAS AS ATIVIDADES"
          ) {
            return true;
          }

          const regNorm = normalizarAtividade(registro.atividade);
          const atvNorm = normalizarAtividade(atividade);

          if (regNorm === atvNorm) return true;

          // Suporte a variações e abreviações comuns
          if (regNorm.includes(atvNorm) || atvNorm.includes(regNorm)) return true;
          if (atvNorm.includes("CONF VOLUME") && (regNorm.includes("VOLUME") || regNorm.includes("VOL"))) return true;
          if (atvNorm.includes("CONF CARREG") && (regNorm.includes("CARREG") || regNorm.includes("CARGA"))) return true;
          if (atvNorm.includes("CONF RECEB") && (regNorm.includes("RECEB") || regNorm.includes("REC"))) return true;
          if (atvNorm.includes("MOV EXP") && (regNorm.includes("MOV") && regNorm.includes("EXP"))) return true;
          if (atvNorm.includes("APANHA") && (regNorm.includes("APANHA") || regNorm.includes("SEPAR") || regNorm.includes("PICK"))) return true;
          if (atvNorm.includes("GOODS ISSUE") && (regNorm.includes("GOODS") || regNorm.includes("ISSUE") || regNorm.includes("BAIXA"))) return true;
          if (atvNorm.includes("MOVIMENTACAO") && regNorm.includes("MOV")) return true;

          return false;
        }
      );

    /*
     * REFAZ OS TOTAIS SOMENTE COM OS
     * REGISTROS DA ATIVIDADE SELECIONADA.
     */

    const somas = {
      /*
       * ESTE É O CAMPO PRINCIPAL.
       * PRODUTIVIDADE = Qtd. Ordens
       */
      qtdOrdens: registrosFiltrados.reduce((total, r) => total + r.qtdOrdens, 0),
      qtdPecas: registrosFiltrados.reduce((total, r) => total + r.qtdPecas, 0),
      qtdLotes: registrosFiltrados.reduce((total, r) => total + r.qtdLotes, 0),
      qtdServ: registrosFiltrados.reduce((total, r) => total + r.qtdServ, 0),
      qtdItens: registrosFiltrados.reduce((total, r) => total + r.qtdItens, 0),
      qtdEnd: registrosFiltrados.reduce((total, r) => total + r.qtdEnd, 0),
      registros: registrosFiltrados.length,
      registrosDetalhados: registrosFiltrados,
      atividades: Array.from(new Set(registrosFiltrados.map(r => r.atividade))),
      datas: Array.from(new Set(registrosFiltrados.map(r => r.data))),
    };

    return {
      ...colaborador,
      ...somas,
    };
  });

  /*
   * Remove colaboradores que não possuem
   * nenhum registro na atividade escolhida.
   */

  resultado = resultado.filter(
    (colaborador) => colaborador.registros > 0
  );

  /*
   * ORDENAÇÃO
   *
   * Produtividade = Qtd. Ordens
   */

  if (ordenacao === "produtividade") {
    resultado.sort((a, b) => {
      if (b.qtdOrdens !== a.qtdOrdens) {
        return b.qtdOrdens - a.qtdOrdens;
      }

      /*
       * Desempate determinístico.
       * Assim o nome não fica mudando
       * de posição entre importações.
       */
      return a.nome.localeCompare(b.nome, "pt-BR", {
        sensitivity: "base",
      });
    });
  } else if (ordenacao === "movimentacoes") {
    /*
     * Ordenação por movimentações.
     */
    resultado.sort((a, b) => {
      const movA = a.qtdServ + a.qtdPecas + a.qtdLotes;
      const movB = b.qtdServ + b.qtdPecas + b.qtdLotes;

      if (movB !== movA) {
        return movB - movA;
      }

      return a.nome.localeCompare(b.nome, "pt-BR", {
        sensitivity: "base",
      });
    });
  } else if (ordenacao === "nome") {
    resultado.sort((a, b) =>
      a.nome.localeCompare(b.nome, "pt-BR", { sensitivity: "base" })
    );
  }

  /*
   * RECALCULA O PERCENTUAL E AS POSIÇÕES.
   */

  const totalProdutividade = resultado.reduce((soma, c) => soma + c.qtdOrdens, 0);

  return resultado.map((colaborador, index) => ({
    ...colaborador,
    posicao: index + 1,
    percentual: totalProdutividade > 0 ? (colaborador.qtdOrdens / totalProdutividade) * 100 : 0,
  }));
}

/* =========================================================
   UTILITÁRIOS
========================================================= */

function numero(valor: string): number {
  if (!valor) return 0;

  return (
    Number(
      valor
        .trim()
        .replace(/\./g, "")
        .replace(",", ".")
    ) || 0
  );
}

export function parseDataBRTimestamp(str: string): number {
  if (!str) return 0;
  const match = str.trim().match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (!match) return 0;
  const dia = parseInt(match[1], 10);
  const mes = parseInt(match[2], 10) - 1;
  const ano = parseInt(match[3], 10);
  if (isNaN(dia) || isNaN(mes) || isNaN(ano)) return 0;
  return new Date(ano, mes, dia).getTime();
}

export function extrairDatasDeTextoOuLinhas(
  paginasLinhas: string[][],
  registros: RankingRow[]
): {
  dataInicio: string;
  dataFim: string;
  frasePeriodo: string;
  todasDatas: string[];
} {
  const datasEncontradas = new Set<string>();

  // 1. Coleta datas das linhas de registro estruturadas
  for (const reg of registros) {
    if (reg.data && /^\d{2}\/\d{2}\/\d{4}$/.test(reg.data.trim())) {
      datasEncontradas.add(reg.data.trim());
    }
  }

  // 2. Coleta datas de cabeçalhos e textos de todas as páginas do PDF
  const regexData = /\b(\d{2}\/\d{2}\/\d{4})\b/g;
  for (const linhas of paginasLinhas) {
    for (const linha of linhas) {
      if (/impresso\s+em/i.test(linha)) continue;

      let match: RegExpExecArray | null;
      while ((match = regexData.exec(linha)) !== null) {
        const d = match[1];
        const parts = d.split('/');
        const dia = parseInt(parts[0], 10);
        const mes = parseInt(parts[1], 10);
        const ano = parseInt(parts[2], 10);
        if (dia >= 1 && dia <= 31 && mes >= 1 && mes <= 12 && ano >= 2000 && ano <= 2099) {
          datasEncontradas.add(d);
        }
      }
    }
  }

  const arrayDatas = Array.from(datasEncontradas).filter((d) => parseDataBRTimestamp(d) > 0);

  if (arrayDatas.length === 0) {
    return {
      dataInicio: "02/01/2026",
      dataFim: "20/09/2026",
      frasePeriodo: "início do período 02/01/2026 ao fim do período 20/09/2026",
      todasDatas: ["02/01/2026", "20/09/2026"]
    };
  }

  arrayDatas.sort((a, b) => parseDataBRTimestamp(a) - parseDataBRTimestamp(b));

  const dataInicio = arrayDatas[0];
  const dataFim = arrayDatas[arrayDatas.length - 1];
  const frasePeriodo = `início do período ${dataInicio} ao fim do período ${dataFim}`;

  return {
    dataInicio,
    dataFim,
    frasePeriodo,
    todasDatas: arrayDatas
  };
}

function ehNumero(valor: string): boolean {
  return /^\d[\d.]*$/.test(valor.trim());
}

function ehData(valor: string): boolean {
  return /^\d{2}\/\d{2}\/\d{4}$/.test(valor.trim());
}

function normalizarChave(nome: string): string {
  return nome
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .toUpperCase();
}

function limparNome(nome: string): string {
  return nome
    .replace(/^>\s*/, "")
    .replace(/^#\s*/, "")
    .replace(/\s+/g, " ")
    .trim();
}

/* =========================================================
   IDENTIFICA ATIVIDADE
========================================================= */

function extrairAtividade(
  texto: string,
  atividadeAtual: string
): string {
  const match = texto.match(
    /(?:#\s*)?Atividade\s*:\s*(.+)/i
  );

  if (match) {
    return match[1].trim();
  }

  return atividadeAtual;
}

/* =========================================================
   VERIFICA SE UMA LINHA É CABEÇALHO/RODAPÉ
========================================================= */

function ignorarLinha(texto: string): boolean {
  const t = texto.trim();

  if (!t) return true;

  if (/^Relatório de Produtividade/i.test(t)) return true;
  if (/^Página:/i.test(t)) return true;
  if (/^Site:/i.test(t)) return true;
  if (/^Processo:/i.test(t)) return true;
  if (/^Usuário/i.test(t)) return true;
  if (/^Impresso em/i.test(t)) return true;
  if (/^Proprietário:/i.test(t)) return true;

  return false;
}

/* =========================================================
   EXTRAI TODAS AS LINHAS REAIS DO PDF
========================================================= */

async function extrairPaginas(file: File) {
  const buffer = await file.arrayBuffer();

  const pdf = await pdfjsLib.getDocument({
    data: new Uint8Array(buffer),
  }).promise;

  const paginas: string[][] = [];

  for (
    let paginaNumero = 1;
    paginaNumero <= pdf.numPages;
    paginaNumero++
  ) {
    const pagina = await pdf.getPage(paginaNumero);

    const content = await pagina.getTextContent();

    const linhas = content.items
      .map((item: any) => String(item.str ?? "").trim())
      .filter(Boolean);

    paginas.push(linhas);
  }

  return {
    pdf,
    paginas,
  };
}

/* =========================================================
   PARSER PRINCIPAL
========================================================= */

export async function lerRankingProdutividade(
  file: File
): Promise<RankingPdfResult> {
  if (!file) {
    throw new Error("Nenhum PDF foi selecionado.");
  }

  const { pdf, paginas } = await extrairPaginas(file);

  const registros: RankingRow[] = [];

  let atividadeAtual = "NÃO INFORMADA";

  /* =======================================================
     PERCORRE TODAS AS PÁGINAS
  ======================================================= */

  for (
    let paginaIndex = 0;
    paginaIndex < paginas.length;
    paginaIndex++
  ) {
    const pagina = paginaIndex + 1;
    const linhas = paginas[paginaIndex];

    for (let i = 0; i < linhas.length; i++) {
      const linhaAtual = linhas[i];

      atividadeAtual = extrairAtividade(
        linhaAtual,
        atividadeAtual
      );

      if (ignorarLinha(linhaAtual)) {
        continue;
      }

      /*
        ESTRUTURA DO PDF:
        Colaborador
        Qtd. Ordens
        Qtd. Peças
        Qtd. Lotes
        Qtd. Serv.   (4º número depois do nome = Produtividade)
        Qtd. Itens
        Qtd. End.
        Data
      */

      if (!ehData(linhaAtual)) {
        continue;
      }

      const indiceData = i;
      const indiceEnd = indiceData - 1;
      const indiceItens = indiceData - 2;
      const indiceServ = indiceData - 3;
      const indiceLotes = indiceData - 4;
      const indicePecas = indiceData - 5;
      const indiceOrdens = indiceData - 6;
      const indiceNome = indiceData - 7;

      if (indiceNome < 0) {
        continue;
      }

      const qtdEnd = linhas[indiceEnd];
      const qtdItens = linhas[indiceItens];
      const qtdServ = linhas[indiceServ];
      const qtdLotes = linhas[indiceLotes];
      const qtdPecas = linhas[indicePecas];
      const qtdOrdens = linhas[indiceOrdens];

      if (
        !ehNumero(qtdEnd) ||
        !ehNumero(qtdItens) ||
        !ehNumero(qtdServ) ||
        !ehNumero(qtdLotes) ||
        !ehNumero(qtdPecas) ||
        !ehNumero(qtdOrdens)
      ) {
        continue;
      }

      let nome = limparNome(linhas[indiceNome]);

      if (!nome) {
        continue;
      }

      if (nome.toLowerCase().includes("atividade:")) {
        continue;
      }

      if (
        /^Página/i.test(nome) ||
        /^Site/i.test(nome) ||
        /^Processo/i.test(nome)
      ) {
        continue;
      }

      registros.push({
        pagina,
        atividade: atividadeAtual,
        colaborador: nome,
        qtdOrdens: numero(qtdOrdens),
        qtdPecas: numero(qtdPecas),
        qtdLotes: numero(qtdLotes),
        qtdServ: numero(qtdServ),
        qtdItens: numero(qtdItens),
        qtdEnd: numero(qtdEnd),
        data: linhaAtual,
      });
    }
  }

  /* =======================================================
     AGRUPAMENTO DOS COLABORADORES
  ======================================================= */

  const mapa = new Map<string, RankingColaborador>();

  for (const registro of registros) {
    const chave = normalizarChave(registro.colaborador);

    let colaborador = mapa.get(chave);

    if (!colaborador) {
      colaborador = {
        nome: registro.colaborador,
        turno: obterTurnoColaborador(registro.colaborador),
        qtdOrdens: 0,
        qtdPecas: 0,
        qtdLotes: 0,
        qtdServ: 0,
        qtdItens: 0,
        qtdEnd: 0,
        registros: 0,
        atividades: [],
        datas: [],
        percentual: 0,
        posicao: 0,
        registrosDetalhados: [],
      };

      mapa.set(chave, colaborador);
    }

    colaborador.qtdOrdens += registro.qtdOrdens;
    colaborador.qtdPecas += registro.qtdPecas;
    colaborador.qtdLotes += registro.qtdLotes;
    colaborador.qtdServ += registro.qtdServ;
    colaborador.qtdItens += registro.qtdItens;
    colaborador.qtdEnd += registro.qtdEnd;
    colaborador.registros++;

    if (!colaborador.atividades.includes(registro.atividade)) {
      colaborador.atividades.push(registro.atividade);
    }

    if (!colaborador.datas.includes(registro.data)) {
      colaborador.datas.push(registro.data);
    }

    // Guarda cada registro original
    colaborador.registrosDetalhados.push(registro);
  }

  const colaboradores = Array.from(mapa.values());

  /* =======================================================
     ORDENAÇÃO INICIAL POR Qtd. Ordens (PRODUTIVIDADE)
  ======================================================= */

  colaboradores.sort((a, b) => {
    const ordensA = a?.qtdOrdens || 0;
    const ordensB = b?.qtdOrdens || 0;
    if (ordensB !== ordensA) {
      return ordensB - ordensA;
    }
    const nomeA = String(a?.nome || "");
    const nomeB = String(b?.nome || "");
    return nomeA.localeCompare(nomeB, "pt-BR", { sensitivity: "base" });
  });

  const totalOrdens = colaboradores.reduce(
    (soma, colaborador) => soma + colaborador.qtdOrdens,
    0
  );

  colaboradores.forEach((colaborador, index) => {
    colaborador.posicao = index + 1;
    colaborador.percentual =
      totalOrdens > 0 ? (colaborador.qtdOrdens / totalOrdens) * 100 : 0;

    // Pré-agrupamento de métricas por atividade
    const actMap: Record<string, {
      qtdOrdens: number;
      qtdPecas: number;
      qtdLotes: number;
      qtdServ: number;
      qtdItens: number;
      qtdEnd: number;
      registros: number;
    }> = {};

    for (const r of colaborador.registrosDetalhados) {
      const normAct = normalizarAtividade(r.atividade);
      if (!actMap[normAct]) {
        actMap[normAct] = {
          qtdOrdens: 0,
          qtdPecas: 0,
          qtdLotes: 0,
          qtdServ: 0,
          qtdItens: 0,
          qtdEnd: 0,
          registros: 0
        };
      }
      actMap[normAct].qtdOrdens += r.qtdOrdens;
      actMap[normAct].qtdPecas += r.qtdPecas;
      actMap[normAct].qtdLotes += r.qtdLotes;
      actMap[normAct].qtdServ += r.qtdServ;
      actMap[normAct].qtdItens += r.qtdItens;
      actMap[normAct].qtdEnd += r.qtdEnd;
      actMap[normAct].registros++;
    }
    colaborador.activitiesMetrics = actMap;

    // Se o relatório for gigante, limpa registrosDetalhados para não sobrecarregar
    if (registros.length > 5000) {
      colaborador.registrosDetalhados = [];
    }
  });

  const atividades = Array.from(
    new Set(registros.map((registro) => registro.atividade))
  );

  const intervaloDatas = extrairDatasDeTextoOuLinhas(paginas, registros);

  return {
    totalPaginas: pdf.numPages,
    linhas: registros,
    colaboradores,
    atividades,
    totalRegistros: registros.length,
    totalColaboradores: colaboradores.length,
    dataInicio: intervaloDatas.dataInicio,
    dataFim: intervaloDatas.dataFim,
    frasePeriodo: intervaloDatas.frasePeriodo,
    todasDatas: intervaloDatas.todasDatas,
  };
}

/* =========================================================
   EXTRATOR DE LINHAS TABULARES (PRESERVA COORDENADAS)
========================================================= */

async function extrairLinhasTabulares(file: File) {
  const buffer = await file.arrayBuffer();

  const pdf = await pdfjsLib.getDocument({
    data: new Uint8Array(buffer),
  }).promise;

  const paginasLinhas: string[][] = [];

  for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
    const page = await pdf.getPage(pageNum);
    const content = await page.getTextContent();
    
    // Agrupa itens de texto por coordenada Y (linha física)
    const items = content.items.map((item: any) => ({
      str: String(item.str ?? "").trim(),
      x: item.transform[4],
      y: item.transform[5]
    })).filter(item => item.str !== "");

    const linesMap: { y: number; items: typeof items }[] = [];
    for (const item of items) {
      let placed = false;
      for (const line of linesMap) {
        if (Math.abs(line.y - item.y) <= 4) {
          line.items.push(item);
          placed = true;
          break;
        }
      }
      if (!placed) {
        linesMap.push({ y: item.y, items: [item] });
      }
    }

    // Ordena as linhas de cima para baixo (Y decrescente)
    linesMap.sort((a, b) => b.y - a.y);

    const lines: string[] = [];
    for (const line of linesMap) {
      // Ordena itens da esquerda para a direita (X crescente)
      line.items.sort((a, b) => a.x - b.x);
      const lineStr = line.items.map(it => it.str).join(" ");
      lines.push(lineStr);
    }

    paginasLinhas.push(lines);
  }

  return {
    pdf,
    paginasLinhas
  };
}

/* =========================================================
   PARSER DE RELATÓRIO U.M.A. (SUPORTA MAIS DE 100.000 LINHAS)
========================================================= */

export interface UmaParsedRow {
  lote: string;
  prioridade: string;
  modOper: string;
  atividade: string;
  situacao: string;
  umaMista: string;
  umaOrigem: string;
  umaDestino: string;
  codMercadoria: string;
  mercadoria: string;
  emb: number;
  qtdMer: number;
  total: number;
  uv: number;
  skuPadrao: string;
  endOrigem: string;
  endDestino: string;
  endLote: string;
  agrupamentoLote: string;
  funcionario: string;
  data: string;
  dataHora: string;
}

export interface RankingUmaPdfResult extends RankingPdfResult {
  rawRows: UmaParsedRow[];
}

export async function lerRankingUMA(
  file: File
): Promise<RankingUmaPdfResult> {
  if (!file) {
    throw new Error("Nenhum PDF foi selecionado.");
  }

  const { pdf, paginasLinhas } = await extrairLinhasTabulares(file);

  const rawRows: UmaParsedRow[] = [];
  const registros: RankingRow[] = [];
  const uniqueEmployeeUmas = new Set<string>(); // "funcionarioNome|umaOrigem"

  for (let pageIndex = 0; pageIndex < paginasLinhas.length; pageIndex++) {
    const pageNum = pageIndex + 1;
    const lines = paginasLinhas[pageIndex];

    for (const line of lines) {
      const tokens = line.trim().split(/\s+/);
      if (tokens.length < 10) continue;

      // Valida os campos estruturais obrigatórios na esquerda da linha
      const lote = tokens[0];
      const prioridade = tokens[1];
      const modOper = tokens[2];
      const atividade = tokens[3];
      const situacao = tokens[4];

      if (!/^\d+$/.test(lote)) continue;
      if (!/^-?\d+$/.test(prioridade)) continue;
      if (modOper !== "RF") continue;
      if (situacao !== "FIM" && situacao !== "FIM_") continue;

      // Encontra COD MERCADORIA (exatamente de 8 dígitos)
      let idxCodMercadoria = -1;
      for (let j = 5; j < tokens.length; j++) {
        if (/^\d{8}$/.test(tokens[j])) {
          idxCodMercadoria = j;
          break;
        }
      }
      if (idxCodMercadoria === -1) continue;

      // Classifica os tokens entre SITUAÇÃO e COD MERCADORIA como UMA MISTA/ORIGEM/DESTINO
      const umaTokens = tokens.slice(5, idxCodMercadoria);
      let umaMista = "";
      let umaOrigem = "";
      let umaDestino = "";

      if (umaTokens.length === 3) {
        umaMista = umaTokens[0];
        umaOrigem = umaTokens[1];
        umaDestino = umaTokens[2];
      } else if (umaTokens.length === 2) {
        if (/^[A-Za-z]/.test(umaTokens[0])) {
          umaMista = umaTokens[0];
          umaOrigem = umaTokens[1];
        } else {
          umaOrigem = umaTokens[0];
          umaDestino = umaTokens[1];
        }
      } else if (umaTokens.length === 1) {
        umaOrigem = umaTokens[0];
      }

      if (!umaOrigem) continue; // Precisa ter pelo menos uma origem definida

      const codMercadoria = tokens[idxCodMercadoria];

      // Busca o SKU PADRÃO (primeiro token após o COD MERCADORIA que possui 3 ou mais pontos)
      let idxSkuPadrao = -1;
      for (let j = idxCodMercadoria + 1; j < tokens.length; j++) {
        const dotCount = (tokens[j].match(/\./g) || []).length;
        if (dotCount >= 3) {
          idxSkuPadrao = j;
          break;
        }
      }
      if (idxSkuPadrao === -1 || idxSkuPadrao < idxCodMercadoria + 5) continue;

      // Extrai os campos numéricos EMB, QTD MER., TOTAL e UV imediatamente anteriores ao SKU PADRÃO
      const emb = numero(tokens[idxSkuPadrao - 4]);
      const qtdMer = numero(tokens[idxSkuPadrao - 3]);
      const total = numero(tokens[idxSkuPadrao - 2]);
      const uv = numero(tokens[idxSkuPadrao - 1]);

      const skuPadrao = tokens[idxSkuPadrao];

      // Extrai a descrição da MERCADORIA
      const mercadoria = tokens.slice(idxCodMercadoria + 1, idxSkuPadrao - 4).join(" ");

      // Busca a primeira DATA/HORA de processamento na direita (formato DD/MM/YYYY)
      let idxDate = -1;
      for (let j = idxSkuPadrao + 1; j < tokens.length; j++) {
        if (/^\d{2}\/\d{2}\/\d{4}$/.test(tokens[j])) {
          idxDate = j;
          break;
        }
      }
      if (idxDate === -1) continue;

      const data = tokens[idxDate];
      const hora = tokens[idxDate + 1] || "";
      const dataHora = `${data} ${hora}`;

      // Identifica o código e nome do FUNCIONÁRIO (escaneando para trás a partir da data)
      let idxEmployeeCode = -1;
      for (let j = idxDate - 1; j > idxSkuPadrao; j--) {
        if (/^\d+$/.test(tokens[j])) {
          idxEmployeeCode = j;
          break;
        }
      }
      if (idxEmployeeCode === -1) continue;

      const funcionarioNome = (tokens.slice(idxEmployeeCode + 1, idxDate).join(" ") || "").trim().toUpperCase();
      if (!funcionarioNome) continue;

      // REQUISITO CRÍTICO DE DEDUPLICAÇÃO DE UMA:
      // Se o mesmo código de "UMA ORIGEM" aparecer mais de uma vez para o mesmo funcionário, desconsidere.
      const keyCombo = `${funcionarioNome}|${(umaOrigem || "").toUpperCase().trim()}`;
      if (uniqueEmployeeUmas.has(keyCombo)) {
        continue;
      }
      uniqueEmployeeUmas.add(keyCombo);

      // Extrai os endereços
      const addressTokens = tokens.slice(idxSkuPadrao + 1, idxEmployeeCode);
      const endOrigem = addressTokens[0] || "";
      const endDestino = addressTokens[1] || "";
      const endLote = addressTokens[2] || "";
      const agrupamentoLote = addressTokens.slice(3).join(" ");

      // Salva na lista bruta para exportação Excel
      rawRows.push({
        lote,
        prioridade,
        modOper,
        atividade,
        situacao,
        umaMista,
        umaOrigem,
        umaDestino,
        codMercadoria,
        mercadoria,
        emb,
        qtdMer,
        total,
        uv,
        skuPadrao,
        endOrigem,
        endDestino,
        endLote,
        agrupamentoLote,
        funcionario: funcionarioNome,
        data,
        dataHora
      });

      // Cria a linha de ranking (Identificando o colaborador pela Coluna Y "FUNCIONARIO")
      registros.push({
        pagina: pageNum,
        atividade,
        colaborador: funcionarioNome, // Chave do ranking (FUNCIONARIO)
        qtdOrdens: 1, // Cada UMA única conta como 1 Ordem/Serviço
        qtdPecas: qtdMer,
        qtdLotes: 1,
        qtdServ: 1, // 1 Serviço por UMA única
        qtdItens: 1,
        qtdEnd: 1,
        data,
        funcionarioOriginal: funcionarioNome,
        umaOrigem,
        umaDestino
      });
    }
  }

  /* =======================================================
     AGRUPAMENTO DOS COLABORADORES (PELO FUNCIONÁRIO)
  ======================================================= */

  const mapa = new Map<string, RankingColaborador>();

  for (const registro of registros) {
    const chave = normalizarChave(registro.colaborador);

    let colab = mapa.get(chave);

    if (!colab) {
      colab = {
        nome: registro.colaborador, // Nome do Funcionário
        turno: obterTurnoColaborador(registro.colaborador),
        qtdOrdens: 0,
        qtdPecas: 0,
        qtdLotes: 0,
        qtdServ: 0,
        qtdItens: 0,
        qtdEnd: 0,
        registros: 0,
        atividades: [],
        datas: [],
        percentual: 0,
        posicao: 0,
        registrosDetalhados: [],
      };
      mapa.set(chave, colab);
    }

    colab.qtdOrdens += registro.qtdOrdens;
    colab.qtdPecas += registro.qtdPecas;
    colab.qtdLotes += registro.qtdLotes;
    colab.qtdServ += registro.qtdServ;
    colab.qtdItens += registro.qtdItens;
    colab.qtdEnd += registro.qtdEnd;
    colab.registros++;

    if (!colab.atividades.includes(registro.atividade)) {
      colab.atividades.push(registro.atividade);
    }

    if (!colab.datas.includes(registro.data)) {
      colab.datas.push(registro.data);
    }

    colab.registrosDetalhados.push(registro);
  }

  const colaboradores = Array.from(mapa.values());

  // Ordenação decrescente por produtividade (Qtd. Ordens)
  colaboradores.sort((a, b) => {
    const ordensA = a?.qtdOrdens || 0;
    const ordensB = b?.qtdOrdens || 0;
    if (ordensB !== ordensA) {
      return ordensB - ordensA;
    }
    const nomeA = String(a?.nome || "");
    const nomeB = String(b?.nome || "");
    return nomeA.localeCompare(nomeB, "pt-BR", { sensitivity: "base" });
  });

  const totalOrdens = colaboradores.reduce((soma, c) => soma + c.qtdOrdens, 0);

  colaboradores.forEach((colab, index) => {
    colab.posicao = index + 1;
    colab.percentual = totalOrdens > 0 ? (colab.qtdOrdens / totalOrdens) * 100 : 0;

    // Constrói o dicionário de atividades otimizado
    const actMap: Record<string, {
      qtdOrdens: number;
      qtdPecas: number;
      qtdLotes: number;
      qtdServ: number;
      qtdItens: number;
      qtdEnd: number;
      registros: number;
    }> = {};

    for (const r of colab.registrosDetalhados) {
      const normAct = normalizarAtividade(r.atividade);
      if (!actMap[normAct]) {
        actMap[normAct] = {
          qtdOrdens: 0,
          qtdPecas: 0,
          qtdLotes: 0,
          qtdServ: 0,
          qtdItens: 0,
          qtdEnd: 0,
          registros: 0
        };
      }
      actMap[normAct].qtdOrdens += r.qtdOrdens;
      actMap[normAct].qtdPecas += r.qtdPecas;
      actMap[normAct].qtdLotes += r.qtdLotes;
      actMap[normAct].qtdServ += r.qtdServ;
      actMap[normAct].qtdItens += r.qtdItens;
      actMap[normAct].qtdEnd += r.qtdEnd;
      actMap[normAct].registros++;
    }
    colab.activitiesMetrics = actMap;

    // Se o dataset de registros for muito grande (>5000), descarta os detalhes
    // para economizar tráfego com LocalStorage e Realtime Database.
    if (registros.length > 5000) {
      colab.registrosDetalhados = [];
    }
  });

  const atividades = Array.from(
    new Set(registros.map((r) => r.atividade))
  );

  // Extrai período e intervalo de datas
  const arrayDatas = Array.from(new Set(registros.map(r => r.data)))
    .filter(d => parseDataBRTimestamp(d) > 0)
    .sort((a, b) => {
      const tA = parseDataBRTimestamp(a) || 0;
      const tB = parseDataBRTimestamp(b) || 0;
      return tA - tB;
    });

  const dataInicio = arrayDatas[0] || "02/01/2026";
  const dataFim = arrayDatas[arrayDatas.length - 1] || "20/09/2026";
  const frasePeriodo = `início do período ${dataInicio} ao fim do período ${dataFim}`;

  return {
    totalPaginas: pdf.numPages,
    linhas: registros,
    colaboradores,
    atividades,
    totalRegistros: registros.length,
    totalColaboradores: colaboradores.length,
    dataInicio,
    dataFim,
    frasePeriodo,
    todasDatas: arrayDatas,
    rawRows
  };
}
