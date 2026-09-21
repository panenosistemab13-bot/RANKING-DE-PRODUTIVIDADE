// Normalização e Mapeamento Oficial de Turnos dos Colaboradores SAGA

export type TipoTurno = 'A' | 'B' | 'C' | 'ADM' | 'RANDS' | 'OUTROS';

export const TURNOS_DISPONIVEIS: { id: string; label: string; shortLabel: string }[] = [
  { id: 'TODOS', label: 'TODOS OS TURNOS', shortLabel: 'TODOS' },
  { id: 'A', label: 'TURNO A', shortLabel: 'TURNO A' },
  { id: 'B', label: 'TURNO B', shortLabel: 'TURNO B' },
  { id: 'C', label: 'TURNO C', shortLabel: 'TURNO C' },
  { id: 'ADM', label: 'TURNO ADM', shortLabel: 'ADM' },
  { id: 'RANDS', label: 'TURNO RANDS', shortLabel: 'RANDS' },
];

// Dicionário canônico fornecido
export const COLABORADORES_TURNOS_MAP: Record<string, string> = {
  "ADRIANO PEREIRA FERNANDES": "C",
  "AILTON DO NASCIMENTO ALVES": "A",
  "ALYSSON RIBEIRO SOARES": "B",
  "ANDERSON CARLOS": "ADM",
  "ANDERSON DE OLIVEIRA": "A",
  "ANTHONY RODRIGO": "RANDS",
  "ARTHUR FILIPE ALMEIDA MACIEL": "C",
  "BRUNO DINIZ PEREIRA": "A",
  "BRUNO FERNANDES LAURENTINO": "A",
  "CARLOS HENRIQUE SIQUEIRA DINIZ": "B",
  "CARLOS NASCIMENTO DOS REIS MARIANO": "RANDS",
  "CARLUCIO NUNES ALVES": "C",
  "CAUAN OLIVEIRA CAMILO": "RANDS",
  "CLEITON MARCOS CATALUNHA DA COSTA": "A",
  "DANIEL HENRIQUE RAMOS DE OLIVEIRA": "A",
  "DOUGLAS JOSE LISBOA": "B",
  "DOUGLAS SOUZA": "RANDS",
  "EDER FABIANO SIMIAO": "A",
  "ELISANDRO ERMELINDO ABADE AMARAL": "C",
  "FABIANO ERINQUE": "ADM",
  "FABIANO HENRIQUE": "ADM",
  "FLAVIO RODRIGUES DE OLIVEIRA": "C",
  "GABRIEL LUCAS RUFINO": "B",
  "GABRIEL SANTOS DUP FAGUNDES": "A",
  "GABRIEL YGOR": "C",
  "GILMAR ALVES TEIXEIRA": "A",
  "HENRIQUE CALDEIRA RODRIGUES": "C",
  "ITALO RODRIGUES SILVA": "C",
  "IZAQUE SILVA RIBEIRO": "B",
  "JOAO CARLOS ASSUNCAO DE SOUZA": "A",
  "JOAO VICTOR RODRIGUES SILVA": "B",
  "JOAO VITOR ALVES": "RANDS",
  "JOAO VITOR RIBEIRO ANDRADE": "B",
  "JONATHAN ALVES DOS SANTOS": "RANDS",
  "JOSE CARLOS TEIXEIRA": "ADM",
  "KAIQUE EDUARDO SANTANA SILVA": "B",
  "KLEVERSSON WALACE": "ADM",
  "LUAN MARTINS": "C",
  "LUCAS DE OLIVEIRA QUEIROZ": "B",
  "LUIS MIGUEL": "RANDS",
  "LUIZ FILIPE DA CRUZ": "A",
  "MAGNO INACIO GOMES": "C",
  "MARCELINO RIBEIRO": "C",
  "MARCIO REZENDE DADA JUNIOR": "A",
  "MARCLEO DENIO": "ADM",
  "MARCUS VINICIUS DE SOUZA": "B",
  "MARIO HENRIQUE DE CARVALHO": "B",
  "PAULO CESAR CASTELIANO SANTIAGO": "C",
  "PAULO HENRIQUE BERTOLDO ROSA DA SILVA": "C",
  "RAI FERNANDES PATROCINIO": "A",
  "RODRIGO JERICO SANTOS": "B",
  "RODRIGO LANA": "B",
  "RONALDO HENRIQUE RANDS": "C",
  "RONILSON ADEMIR SILVA DE FARIA VARGAS": "B",
  "RUY ALVES BARBOSA": "B",
  "SAMUEL NORBERTO DE PAULA PERCHE": "ADM",
  "THAIS DEUSDITE BATISTA DA SILVA": "ADM",
  "THALES ROBERTO BORNACK SANTOS": "ADM",
  "THIAGO CARVALHO ASSUNCAO SILVA": "A",
  "THIAGO DE OLIVEIRA CUPERTINO": "B",
  "TIARLOS FERREIRA DAMASCENO": "B",
  "UALISON MONTEIRO SOBRAL": "C",
  "VALDINEI JUNIO DA SILVA": "ADM",
  "VICENTE BERNADINO": "ADM",
  "VICTOR BRUNO MOREIRA SILVA": "C",
  "WALISSON FRANCISCO JESUS DA SILVA": "C",
  "WANDERSON VALADARES LIMOES": "ADM",
  "WESLLEY ALAN DE OLIVEIRA SOUSA": "C",
  "WILTON FERNANDES CAMPOS": "A",
  "WALLACE LOHAN DE OLIVEIRA SILVA": "C",
};

/**
 * Remove acentos, pontuação, múltiplos espaços e converte para maiúsculo
 */
export function normalizarNomeParaBusca(nome: string): string {
  if (!nome) return "";
  return nome
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase()
    .replace(/[^A-Z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

// Mapa pré-normalizado para busca instantânea O(1)
const MAPA_NORMALIZADO = new Map<string, string>();
Object.entries(COLABORADORES_TURNOS_MAP).forEach(([nome, turno]) => {
  MAPA_NORMALIZADO.set(normalizarNomeParaBusca(nome), turno);
});

const LOCAL_STORAGE_KEY_TURNOS_CUSTOM = 'saga_ranking_turnos_customizados';

/**
 * Carrega o mapa de turnos customizados manualmente pelo usuário
 */
export function carregarTurnosCustomizados(): Record<string, string> {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY_TURNOS_CUSTOM);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (e) {
    console.warn("Erro ao carregar turnos customizados:", e);
  }
  return {};
}

/**
 * Salva a alteração manual de turno de um colaborador no LocalStorage
 * e atualiza o mapa em memória
 */
export function salvarTurnoCustomizado(nome: string, turno: string): void {
  try {
    const mapa = carregarTurnosCustomizados();
    const norm = normalizarNomeParaBusca(nome);
    mapa[norm] = turno;
    mapa[nome.trim().toUpperCase()] = turno;
    localStorage.setItem(LOCAL_STORAGE_KEY_TURNOS_CUSTOM, JSON.stringify(mapa));
    MAPA_NORMALIZADO.set(norm, turno);
  } catch (e) {
    console.warn("Erro ao salvar turno customizado:", e);
  }
}

/**
 * Identifica o turno de um colaborador dado seu nome
 */
export function obterTurnoColaborador(nome?: string): string {
  if (!nome) return "OUTROS";
  const norm = normalizarNomeParaBusca(nome);
  if (!norm) return "OUTROS";

  // 0. Verifica primeiro se há turno customizado pelo usuário
  const customMap = carregarTurnosCustomizados();
  if (customMap[norm]) {
    return customMap[norm];
  }
  if (customMap[nome.trim().toUpperCase()]) {
    return customMap[nome.trim().toUpperCase()];
  }

  // 1. Busca exata direta
  if (MAPA_NORMALIZADO.has(norm)) {
    return MAPA_NORMALIZADO.get(norm)!;
  }

  // 2. Busca por contenção (se nome do PDF contém ou está contido na lista)
  for (const [nomeOficial, turno] of MAPA_NORMALIZADO.entries()) {
    if (norm.includes(nomeOficial) || nomeOficial.includes(norm)) {
      return turno;
    }
  }

  // 3. Busca por primeiro e último nome
  const partes = norm.split(" ").filter(p => p.length > 2);
  if (partes.length >= 2) {
    const primeiro = partes[0];
    const ultimo = partes[partes.length - 1];
    for (const [nomeOficial, turno] of MAPA_NORMALIZADO.entries()) {
      if (nomeOficial.startsWith(primeiro) && nomeOficial.includes(ultimo)) {
        return turno;
      }
    }
  }

  return "OUTROS";
}

/**
 * Retorna estilos visuais de alta definição para o selo de turno
 */
export function obterEstiloVisualTurno(turno?: string): {
  badgeBg: string;
  badgeText: string;
  badgeBorder: string;
  glow: string;
  tag: string;
  dotColor: string;
  ringColor: string;
} {
  const t = (turno || "").toUpperCase().trim();

  switch (t) {
    case "A":
      return {
        badgeBg: "bg-gradient-to-r from-amber-500 to-amber-600",
        badgeText: "text-amber-950 font-black",
        badgeBorder: "border-amber-300/80",
        glow: "shadow-amber-500/40",
        tag: "TURNO A",
        dotColor: "bg-amber-400",
        ringColor: "ring-amber-400/50"
      };
    case "B":
      return {
        badgeBg: "bg-gradient-to-r from-blue-600 to-indigo-600",
        badgeText: "text-white font-black",
        badgeBorder: "border-blue-400/80",
        glow: "shadow-blue-500/40",
        tag: "TURNO B",
        dotColor: "bg-blue-400",
        ringColor: "ring-blue-400/50"
      };
    case "C":
      return {
        badgeBg: "bg-gradient-to-r from-emerald-600 to-teal-600",
        badgeText: "text-white font-black",
        badgeBorder: "border-emerald-400/80",
        glow: "shadow-emerald-500/40",
        tag: "TURNO C",
        dotColor: "bg-emerald-400",
        ringColor: "ring-emerald-400/50"
      };
    case "ADM":
      return {
        badgeBg: "bg-gradient-to-r from-rose-600 to-red-600",
        badgeText: "text-white font-black",
        badgeBorder: "border-rose-400/80",
        glow: "shadow-rose-500/40",
        tag: "TURNO ADM",
        dotColor: "bg-rose-400",
        ringColor: "ring-rose-400/50"
      };
    case "RANDS":
      return {
        badgeBg: "bg-gradient-to-r from-purple-600 to-violet-700",
        badgeText: "text-white font-black",
        badgeBorder: "border-purple-400/80",
        glow: "shadow-purple-500/40",
        tag: "TURNO RANDS",
        dotColor: "bg-purple-400",
        ringColor: "ring-purple-400/50"
      };
    default:
      return {
        badgeBg: "bg-slate-700",
        badgeText: "text-slate-200 font-bold",
        badgeBorder: "border-slate-500/50",
        glow: "shadow-slate-700/30",
        tag: t ? `TURNO ${t}` : "GERAL",
        dotColor: "bg-slate-400",
        ringColor: "ring-slate-400/40"
      };
  }
}
