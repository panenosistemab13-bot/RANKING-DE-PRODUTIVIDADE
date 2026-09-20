// src/utils/rankingPdfParser.ts

import * as pdfjsLib from "pdfjs-dist";
import pdfWorker from "pdfjs-dist/build/pdf.worker.min.mjs?url";

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
}

export interface RankingColaborador {
  nome: string;
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
}

export interface RankingPdfResult {
  totalPaginas: number;
  linhas: RankingRow[];
  colaboradores: RankingColaborador[];
  atividades: string[];
  totalRegistros: number;
  totalColaboradores: number;
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
  ordenacao: TipoOrdenacao = "produtividade"
): RankingColaborador[] {
  /*
   * Primeiro filtra pela atividade.
   *
   * IMPORTANTE:
   * Não filtrar pelo nome do colaborador.
   * O filtro utiliza os registros reais
   * encontrados no PDF.
   */

  let resultado = colaboradores.map((colaborador) => {
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
    if (b.qtdOrdens !== a.qtdOrdens) {
      return b.qtdOrdens - a.qtdOrdens;
    }
    return a.nome.localeCompare(b.nome, "pt-BR", { sensitivity: "base" });
  });

  const totalOrdens = colaboradores.reduce(
    (soma, colaborador) => soma + colaborador.qtdOrdens,
    0
  );

  colaboradores.forEach((colaborador, index) => {
    colaborador.posicao = index + 1;
    colaborador.percentual =
      totalOrdens > 0 ? (colaborador.qtdOrdens / totalOrdens) * 100 : 0;
  });

  const atividades = Array.from(
    new Set(registros.map((registro) => registro.atividade))
  );

  return {
    totalPaginas: pdf.numPages,
    linhas: registros,
    colaboradores,
    atividades,
    totalRegistros: registros.length,
    totalColaboradores: colaboradores.length,
  };
}
