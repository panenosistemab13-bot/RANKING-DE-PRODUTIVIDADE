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
  qtdServ: number;
  qtdItens: number;
  qtdEnd: number;
  data: string;
}

export interface RankingColaborador {
  nome: string;
  qtdOrdens: number;
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
}

export interface RankingPdfResult {
  totalPaginas: number;
  linhas: RankingRow[];
  colaboradores: RankingColaborador[];
  atividades: string[];
  totalRegistros: number;
  totalColaboradores: number;
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

    /*
      O PDF separa:
      
      NOME
      52
      0
      6
      276
      58
      58
      DATA

      Portanto NÃO podemos simplesmente procurar
      "nome + números + data" em uma única string.
    */

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

  const { pdf, paginas } =
    await extrairPaginas(file);

  const registros: RankingRow[] = [];

  let atividadeAtual = "NÃO INFORMADA";

  /* =======================================================
     PERCORRE TODAS AS 39 PÁGINAS
  ======================================================= */

  for (
    let paginaIndex = 0;
    paginaIndex < paginas.length;
    paginaIndex++
  ) {

    const pagina = paginaIndex + 1;

    const linhas = paginas[paginaIndex];

    /*
      Atualiza atividade sempre que encontrar:
      Atividade: APANHA
      Atividade: APANHA PALETE
      etc.
    */

    for (let i = 0; i < linhas.length; i++) {

      const linhaAtual = linhas[i];

      atividadeAtual =
        extrairAtividade(
          linhaAtual,
          atividadeAtual
        );

      /*
        Ignora cabeçalhos e rodapés.
      */

      if (ignorarLinha(linhaAtual)) {
        continue;
      }

      /*
        ====================================================
        ESTRUTURA REAL DO PDF

        NOME
        ORDEM
        PEÇA
        LOTE
        SERV
        ITEM
        END
        DATA

        Portanto procuramos:

        DATA
          ↑
        6 números
          ↑
        NOME
        ====================================================
      */

      if (!ehData(linhaAtual)) {
        continue;
      }

      /*
        A data está depois de exatamente
        6 números.
      */

      const indiceData = i;

      const indiceEnd = indiceData - 1;
      const indiceItens = indiceData - 2;
      const indiceServ = indiceData - 3;
      const indiceLotes = indiceData - 4;
      const indicePecas = indiceData - 5;
      const indiceOrdens = indiceData - 6;
      const indiceNome = indiceData - 7;

      /*
        Verifica se todos os campos existem.
      */

      if (indiceNome < 0) {
        continue;
      }

      const qtdEnd = linhas[indiceEnd];
      const qtdItens = linhas[indiceItens];
      const qtdServ = linhas[indiceServ];
      const qtdLotes = linhas[indiceLotes];
      const qtdPecas = linhas[indicePecas];
      const qtdOrdens = linhas[indiceOrdens];

      /*
        Todos os seis campos precisam ser números.
      */

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

      let nome = limparNome(
        linhas[indiceNome]
      );

      /*
        Evita capturar cabeçalhos.
      */

      if (!nome) {
        continue;
      }

      if (
        nome.toLowerCase().includes("atividade:")
      ) {
        continue;
      }

      if (
        /^Página/i.test(nome) ||
        /^Site/i.test(nome) ||
        /^Processo/i.test(nome)
      ) {
        continue;
      }

      /*
        ====================================================
        REGISTRO VÁLIDO
        ====================================================
      */

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

  const mapa =
    new Map<string, RankingColaborador>();

  for (const registro of registros) {

    const chave =
      normalizarChave(
        registro.colaborador
      );

    let colaborador =
      mapa.get(chave);

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
      };

      mapa.set(
        chave,
        colaborador
      );
    }

    /*
      SOMA TODAS AS OCORRÊNCIAS.
    */

    colaborador.qtdOrdens +=
      registro.qtdOrdens;

    colaborador.qtdPecas +=
      registro.qtdPecas;

    colaborador.qtdLotes +=
      registro.qtdLotes;

    colaborador.qtdServ +=
      registro.qtdServ;

    colaborador.qtdItens +=
      registro.qtdItens;

    colaborador.qtdEnd +=
      registro.qtdEnd;

    colaborador.registros++;

    if (
      !colaborador.atividades.includes(
        registro.atividade
      )
    ) {
      colaborador.atividades.push(
        registro.atividade
      );
    }

    if (
      !colaborador.datas.includes(
        registro.data
      )
    ) {
      colaborador.datas.push(
        registro.data
      );
    }
  }

  /* =======================================================
     TRANSFORMA MAP EM ARRAY
  ======================================================= */

  const colaboradores =
    Array.from(
      mapa.values()
    );

  /* =======================================================
     ORDENAÇÃO
  ======================================================= */

  colaboradores.sort(
    (a, b) => {

      if (
        b.qtdOrdens !==
        a.qtdOrdens
      ) {
        return (
          b.qtdOrdens -
          a.qtdOrdens
        );
      }

      if (
        b.qtdPecas !==
        a.qtdPecas
      ) {
        return (
          b.qtdPecas -
          a.qtdPecas
        );
      }

      if (
        b.qtdItens !==
        a.qtdItens
      ) {
        return (
          b.qtdItens -
          a.qtdItens
        );
      }

      return (
        b.qtdEnd -
        a.qtdEnd
      );
    }
  );

  /* =======================================================
     POSIÇÃO
  ======================================================= */

  const total =
    colaboradores.reduce(
      (soma, colaborador) =>
        soma +
        colaborador.qtdOrdens,
      0
    );

  colaboradores.forEach(
    (colaborador, index) => {

      colaborador.posicao =
        index + 1;

      colaborador.percentual =
        total > 0
          ? (
              colaborador.qtdOrdens /
              total
            ) * 100
          : 0;
    }
  );

  /* =======================================================
     TODAS AS ATIVIDADES
  ======================================================= */

  const atividades =
    Array.from(
      new Set(
        registros.map(
          registro =>
            registro.atividade
        )
      )
    );

  /* =======================================================
     RESULTADO FINAL
  ======================================================= */

  return {

    totalPaginas:
      pdf.numPages,

    linhas:
      registros,

    colaboradores,

    atividades,

    totalRegistros:
      registros.length,

    totalColaboradores:
      colaboradores.length,
  };
}
