import { initializeApp, getApps, getApp } from "firebase/app";
import { getDatabase, ref, set, onValue, get, off } from "firebase/database";
import { OperatorSummary } from "../types";

export const firebaseConfig = {
  apiKey: "AIzaSyAjvxb53P5h3HgLrmOI3Q85jEd8t0M7gOI",
  authDomain: "ranking-produtividade.firebaseapp.com",
  databaseURL: "https://ranking-produtividade-default-rtdb.firebaseio.com",
  projectId: "ranking-produtividade",
  storageBucket: "ranking-produtividade.firebasestorage.app",
  messagingSenderId: "181567822869",
  appId: "1:181567822869:web:b63d5dc8172d4ea037021c",
  measurementId: "G-6W668QBFPD"
};

// Singleton Firebase initialization
export const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
export const rtdb = getDatabase(app);

export interface FirebaseRankingData {
  operators: OperatorSummary[];
  label: string;
  dataInicio?: string;
  dataFim?: string;
  updatedAt: string;
  totalOperators: number;
  totalProductivity: number;
  totalMovements: number;
}

const LOCAL_STORAGE_KEY_OPERATORS = 'saga_ranking_cached_operators';
const LOCAL_STORAGE_KEY_LABEL = 'saga_ranking_cached_label';

/**
 * Sanitiza objetos recursivamente para evitar erros no Firebase Realtime Database
 * (Remove chaves com '/', '.', '#', '$', '[', ']' e valores undefined)
 */
function sanitizeForFirebase(obj: any): any {
  if (obj === null || obj === undefined) return null;
  if (typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) return obj.map(sanitizeForFirebase);

  const clean: Record<string, any> = {};
  for (const [key, value] of Object.entries(obj)) {
    if (value === undefined) continue;
    const safeKey = key.replace(/[\.\#\$\/\[\]]/g, '_');
    clean[safeKey] = sanitizeForFirebase(value);
  }
  return clean;
}

/**
 * Salva o ranking atual tanto no Firebase Realtime Database quanto no LocalStorage (cache imediato)
 */
export async function salvarRankingRealtime(
  operators: OperatorSummary[],
  label: string,
  dataInicio?: string,
  dataFim?: string
): Promise<void> {
  const totalProd = operators.reduce((acc, curr) => acc + curr.totalProductivity, 0);
  const totalMov = operators.reduce((acc, curr) => acc + curr.movements, 0);

  const payload: FirebaseRankingData = {
    operators,
    label,
    dataInicio,
    dataFim,
    updatedAt: new Date().toISOString(),
    totalOperators: operators.length,
    totalProductivity: totalProd,
    totalMovements: totalMov
  };

  // 1. Salva no localStorage para carregamento instantâneo sem flicker ao recarregar
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY_OPERATORS, JSON.stringify(operators));
    localStorage.setItem(LOCAL_STORAGE_KEY_LABEL, label);
  } catch (e) {
    console.warn("Erro ao salvar no LocalStorage:", e);
  }

  // 2. Salva no Firebase Realtime Database
  try {
    const rankingRef = ref(rtdb, "ranking_atual");
    const sanitized = sanitizeForFirebase(payload);
    await set(rankingRef, sanitized);
    console.log("[Firebase RTDB] Ranking salvo com sucesso em /ranking_atual!");
  } catch (err) {
    console.error("[Firebase RTDB] Falha ao salvar no Realtime Database:", err);
    throw err;
  }
}

/**
 * Registra o histórico da importação no Realtime Database
 */
export async function salvarHistoricoImportacao(
  fileName: string,
  totalPaginas: number,
  totalRegistros: number,
  totalColaboradores: number,
  colaboradores: any[]
): Promise<void> {
  try {
    const timestamp = Date.now();
    const histRef = ref(rtdb, `historico/${timestamp}`);
    const sanitized = sanitizeForFirebase({
      fileName,
      timestamp: new Date().toISOString(),
      totalPaginas,
      totalRegistros,
      totalColaboradores,
      colaboradores
    });
    await set(histRef, sanitized);
  } catch (e) {
    console.warn("[Firebase RTDB] Erro ao salvar histórico:", e);
  }
}

/**
 * Carrega os dados em cache local imediatamente ao abrir o app
 */
export function carregarCacheLocal(): { operators: OperatorSummary[]; label: string } | null {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY_OPERATORS);
    const label = localStorage.getItem(LOCAL_STORAGE_KEY_LABEL);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return {
          operators: parsed,
          label: label || `SAGA (${parsed.length} Colab.)`
        };
      }
    }
  } catch (e) {
    console.warn("Erro ao ler LocalStorage:", e);
  }
  return null;
}

/**
 * Limpa todos os dados de ranking do Firebase Realtime Database e LocalStorage
 */
export async function limparRankingRealtime(): Promise<void> {
  try {
    localStorage.removeItem(LOCAL_STORAGE_KEY_OPERATORS);
    localStorage.removeItem(LOCAL_STORAGE_KEY_LABEL);
  } catch (e) {
    console.warn("Erro ao limpar LocalStorage:", e);
  }

  try {
    const rankingRef = ref(rtdb, "ranking_atual");
    await set(rankingRef, null);
    console.log("[Firebase RTDB] Dados limpos com sucesso!");
  } catch (err) {
    console.error("[Firebase RTDB] Erro ao limpar ranking no Firebase:", err);
  }
}

/**
 * Normaliza os operadores recebidos do Firebase Realtime Database
 * Aceita tanto Array quanto Dicionário de objetos e mapeia formatos legados ou automáticos
 */
export function normalizarOperadoresFirebase(rawOperators: any): OperatorSummary[] {
  if (!rawOperators) return [];
  const list = Array.isArray(rawOperators) ? rawOperators : Object.values(rawOperators);
  if (!Array.isArray(list)) return [];

  return list
    .filter((item) => item && typeof item === 'object')
    .map((item: any, idx: number) => {
      const name = String(
        item.name ||
        item.colaborador ||
        item.COLABORADOR ||
        item.funcionario ||
        item.FUNCIONARIO ||
        item.FUNCIONÁRIO ||
        item.nome ||
        item.NOME ||
        `Colaborador ${idx + 1}`
      ).trim().toUpperCase();

      const rawProd = item.totalProductivity ?? item.produtividade ?? item.PRODUTIVIDADE ?? item.ordens ?? item.ORDENS ?? item.quantidade ?? item.QUANTIDADE ?? item.movements ?? 0;
      const prod = typeof rawProd === 'number' ? rawProd : (parseInt(String(rawProd).replace(/\D/g, ''), 10) || 0);

      const rawMov = item.movements ?? item.movimentacoes ?? item.MOVIMENTACOES ?? item.pecas ?? prod;
      const mov = typeof rawMov === 'number' ? rawMov : (parseInt(String(rawMov).replace(/\D/g, ''), 10) || prod);

      const rank = Number(item.rank ?? (idx + 1)) || (idx + 1);
      const turno = item.turno || item.TURNO || 'A';
      const topActivity = item.topActivity || 'MOVIMENTAÇÃO UMA';
      const activitiesCount = item.activitiesCount || { [topActivity]: prod };
      const sparkline = Array.isArray(item.sparkline) && item.sparkline.length > 0
        ? item.sparkline
        : [prod * 0.7, prod * 0.8, prod * 0.75, prod * 0.85, prod * 0.9, prod];

      return {
        rank,
        name,
        turno,
        totalProductivity: prod,
        movements: mov,
        participation: Number(item.participation || 0),
        trendGrowth: Number(item.trendGrowth || 8.5),
        sparkline,
        topActivity,
        activitiesCount,
        dataInicio: item.dataInicio,
        dataFim: item.dataFim,
        datas: item.datas,
        qtdOrdens: item.qtdOrdens,
        qtdPecas: item.qtdPecas,
        qtdLotes: item.qtdLotes,
        qtdServ: item.qtdServ,
        qtdItens: item.qtdItens,
        qtdEnd: item.qtdEnd,
        registros: item.registros,
        registrosDetalhados: item.registrosDetalhados
      } as OperatorSummary;
    });
}

/**
 * Busca os dados atuais do Firebase uma vez de forma direta
 */
export async function buscarRankingRealtime(): Promise<FirebaseRankingData | null> {
  try {
    const rankingRef = ref(rtdb, "ranking_atual");
    const snapshot = await get(rankingRef);
    if (snapshot.exists()) {
      const val = snapshot.val() as any;
      if (val && val.operators) {
        const normalizedOps = normalizarOperadoresFirebase(val.operators);
        const dataObj: FirebaseRankingData = {
          ...val,
          operators: normalizedOps
        };
        // Atualiza cache local
        try {
          localStorage.setItem(LOCAL_STORAGE_KEY_OPERATORS, JSON.stringify(normalizedOps));
          localStorage.setItem(LOCAL_STORAGE_KEY_LABEL, val.label || "Planilha Google Oficial");
        } catch {}
        return dataObj;
      }
    }
  } catch (e) {
    console.warn("[Firebase RTDB] Erro em buscarRankingRealtime:", e);
  }
  return null;
}

/**
 * Assina atualizações em tempo real do ranking no Firebase
 */
export function ouvirRankingRealtime(
  onData: (data: FirebaseRankingData | null) => void,
  onError?: (error: Error) => void
): () => void {
  const rankingRef = ref(rtdb, "ranking_atual");

  // Primeira tentativa direta com get()
  buscarRankingRealtime().then((directData) => {
    if (directData) {
      onData(directData);
    }
  });

  const unsubscribe = onValue(
    rankingRef,
    (snapshot) => {
      if (snapshot.exists()) {
        const val = snapshot.val() as any;
        if (val && val.operators) {
          const normalizedOps = normalizarOperadoresFirebase(val.operators);
          const dataObj: FirebaseRankingData = {
            ...val,
            operators: normalizedOps
          };
          // Atualiza cache local
          try {
            localStorage.setItem(LOCAL_STORAGE_KEY_OPERATORS, JSON.stringify(normalizedOps));
            localStorage.setItem(LOCAL_STORAGE_KEY_LABEL, val.label || "Planilha Google Oficial");
          } catch {}
          onData(dataObj);
        }
      } else {
        onData(null);
      }
    },
    (error) => {
      console.warn("[Firebase RTDB] Erro no listener onValue:", error);
      onError?.(error);
    }
  );

  return () => off(rankingRef, "value", unsubscribe);
}
