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
  updatedAt: string;
  totalOperators: number;
  totalProductivity: number;
  totalMovements: number;
}

/**
 * Salva o ranking atual no Firebase Realtime Database
 */
export async function salvarRankingRealtime(
  operators: OperatorSummary[],
  label: string
): Promise<void> {
  const rankingRef = ref(rtdb, "ranking_atual");
  const totalProd = operators.reduce((acc, curr) => acc + curr.totalProductivity, 0);
  const totalMov = operators.reduce((acc, curr) => acc + curr.movements, 0);

  const payload: FirebaseRankingData = {
    operators,
    label,
    updatedAt: new Date().toISOString(),
    totalOperators: operators.length,
    totalProductivity: totalProd,
    totalMovements: totalMov
  };

  await set(rankingRef, payload);
}

/**
 * Registra o histórico completo da importação no Realtime Database
 */
export async function salvarHistoricoImportacao(
  fileName: string,
  totalPaginas: number,
  totalRegistros: number,
  totalColaboradores: number,
  colaboradores: any[]
): Promise<void> {
  const timestamp = Date.now();
  const histRef = ref(rtdb, `historico/${timestamp}`);
  await set(histRef, {
    fileName,
    timestamp: new Date().toISOString(),
    totalPaginas,
    totalRegistros,
    totalColaboradores,
    colaboradores
  });
}

/**
 * Assina atualizações em tempo real do ranking no Firebase
 */
export function ouvirRankingRealtime(
  onData: (data: FirebaseRankingData | null) => void,
  onError?: (error: Error) => void
): () => void {
  const rankingRef = ref(rtdb, "ranking_atual");

  const unsubscribe = onValue(
    rankingRef,
    (snapshot) => {
      if (snapshot.exists()) {
        const val = snapshot.val() as FirebaseRankingData;
        onData(val);
      } else {
        onData(null);
      }
    },
    (error) => {
      console.warn("Realtime Database listener error:", error);
      onError?.(error);
    }
  );

  return () => off(rankingRef, "value", unsubscribe);
}
