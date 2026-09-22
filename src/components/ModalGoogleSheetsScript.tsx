import React, { useState } from 'react';
import {
  X,
  Copy,
  Check,
  FileSpreadsheet,
  Zap,
  RefreshCw,
  Clock,
  Code2,
  ExternalLink,
  Info,
  Lock,
  KeyRound,
  Eye,
  EyeOff,
  ShieldAlert,
  Sparkles,
  CheckCircle2
} from 'lucide-react';
import { OFFICIAL_GOOGLE_APPS_SCRIPT, importarRankingDeSheets } from '../services/googleSheets';
import { OperatorSummary } from '../types';

const CORRECT_PASSWORD = '#trescafe2029';

interface ModalGoogleSheetsScriptProps {
  isOpen: boolean;
  onClose: () => void;
  onImportData: (operators: OperatorSummary[], label: string) => void;
}

export const ModalGoogleSheetsScript: React.FC<ModalGoogleSheetsScriptProps> = ({
  isOpen,
  onClose,
  onImportData
}) => {
  const [copied, setCopied] = useState(false);
  const [sheetInput, setSheetInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ text: string; type: 'success' | 'error' | 'info' } | null>(null);

  // Autenticação de Senha da Aba
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handlePasswordSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (passwordInput.trim() === CORRECT_PASSWORD) {
      setIsUnlocked(true);
      setPasswordError(null);
    } else {
      setPasswordError('Senha incorreta! Digite a credencial válida de administrador.');
    }
  };

  const handleCopyScript = () => {
    navigator.clipboard.writeText(OFFICIAL_GOOGLE_APPS_SCRIPT);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  const handleFetchSheet = async () => {
    if (!sheetInput.trim()) {
      setStatusMsg({ text: 'Por favor, insira o link da planilha ou ID.', type: 'error' });
      return;
    }

    setIsLoading(true);
    setStatusMsg({ text: 'Conectando e processando dados da planilha...', type: 'info' });

    try {
      const operators = await importarRankingDeSheets(sheetInput.trim());
      if (!operators || operators.length === 0) {
        throw new Error('Nenhum operador encontrado na planilha informada.');
      }

      onImportData(operators, `PLANILHA SHEETS (${operators.length} COLABORADORES)`);
      setStatusMsg({
        text: `✅ Sucesso! ${operators.length} colaboradores carregados com sucesso!`,
        type: 'success'
      });
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (err: any) {
      setStatusMsg({
        text: `❌ ${err.message || 'Erro ao carregar dados da planilha. Verifique as permissões de acesso.'}`,
        type: 'error'
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200 select-none">
      {/* Backdrop Click */}
      <div className="absolute inset-0" onClick={onClose} />

      {/* Modal Container: Compact & Scaled Appropriately */}
      <div
        className={`relative z-10 w-full ${
          isUnlocked ? 'max-w-2xl' : 'max-w-[420px]'
        } bg-slate-900/95 border border-slate-700/80 rounded-2xl shadow-2xl shadow-black/70 overflow-hidden flex flex-col transition-all duration-300 max-h-[88vh]`}
      >
        {/* Header Compacto & Elegante */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800/90 bg-gradient-to-r from-amber-950/30 via-slate-900 to-slate-900 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white shadow-md shadow-emerald-500/25 shrink-0">
              <FileSpreadsheet className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-[12.5px] font-black text-white tracking-tight uppercase font-heading leading-tight">
                  INTEGRAÇÃO GOOGLE SHEETS • SAGA WMS
                </h3>
                <span
                  className={`text-[8.5px] px-2 py-0.5 rounded-full font-black uppercase tracking-wider border leading-none shrink-0 ${
                    isUnlocked
                      ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                      : 'bg-amber-500/15 text-amber-400 border-amber-500/30'
                  }`}
                >
                  {isUnlocked ? 'SCRIPT ATIVO' : 'ÁREA PROTEGIDA'}
                </span>
              </div>
              <p className="text-[10px] text-slate-400 leading-none mt-0.5">
                Puxe todas as informações da planilha em tempo real automaticamente
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-all cursor-pointer shrink-0 ml-2"
            title="Fechar (Esc)"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* =========================================================================
            TELA DE SENHA SE BLOQUEADO (DESIGN COMPACTO, ELEGANTE & COM ZOOM CORRETO)
           ========================================================================= */}
        {!isUnlocked ? (
          <div className="p-6 flex flex-col items-center text-center">
            {/* Ambient Halo & Lock Emblem */}
            <div className="relative mb-3.5">
              <div className="absolute inset-0 bg-amber-500/20 rounded-2xl blur-lg pointer-events-none" />
              <div className="relative w-13 h-13 rounded-2xl bg-gradient-to-br from-amber-500/20 via-slate-800 to-amber-600/25 border border-amber-500/40 flex items-center justify-center text-amber-400 shadow-xl shadow-amber-500/10">
                <Lock className="w-6 h-6 stroke-[2.2]" />
              </div>
            </div>

            {/* Typography */}
            <div className="space-y-1 mb-5 max-w-[320px]">
              <h4 className="text-[14px] font-black text-white tracking-wide uppercase font-heading">
                ÁREA RESTRITA DE INTEGRAÇÃO
              </h4>
              <p className="text-[11px] text-slate-400 leading-snug">
                Esta aba é restrita aos administradores do SAGA WMS. Digite a senha de acesso para visualizar e importar os dados da planilha.
              </p>
            </div>

            {/* Password Form */}
            <form onSubmit={handlePasswordSubmit} className="w-full max-w-[320px] space-y-3">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                  <KeyRound className="w-3.5 h-3.5" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={passwordInput}
                  onChange={(e) => {
                    setPasswordInput(e.target.value);
                    if (passwordError) setPasswordError(null);
                  }}
                  placeholder="Digite a senha de acesso..."
                  autoFocus
                  className="w-full h-10 pl-9 pr-9 bg-slate-950/90 border border-slate-700/80 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20 transition-all shadow-inner"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-500 hover:text-slate-300 transition-colors cursor-pointer"
                  title={showPassword ? 'Ocultar senha' : 'Ver senha'}
                >
                  {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>

              {passwordError && (
                <div className="p-2 rounded-lg bg-red-500/15 border border-red-500/30 text-[11px] font-bold text-red-300 flex items-center justify-center gap-1.5 animate-shake">
                  <ShieldAlert className="w-3.5 h-3.5 shrink-0 text-red-400" />
                  <span>{passwordError}</span>
                </div>
              )}

              <button
                type="submit"
                className="w-full h-10 px-4 rounded-xl bg-gradient-to-r from-amber-500 via-amber-600 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 transition-all hover:scale-[1.01] active:scale-[0.98] cursor-pointer"
              >
                <Lock className="w-3.5 h-3.5 stroke-[2.5]" />
                <span>DESBLOQUEAR ACESSO</span>
              </button>
            </form>
          </div>
        ) : (
          /* =========================================================================
              CONTEÚDO DESBLOQUEADO (COMPACTO, ORGANIZADO & ESCALADO)
             ========================================================================= */
          <div className="flex-1 overflow-y-auto p-4 space-y-3.5 custom-scrollbar text-xs">
            {/* Opção 2 Destaque: Script Automático (Apps Script) - Prioritária */}
            <div className="p-3.5 rounded-xl bg-slate-800/60 border border-emerald-500/40 space-y-3 shadow-md">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-700/60 pb-2.5">
                <div className="flex items-center gap-2 text-emerald-400 font-black text-xs uppercase font-heading">
                  <Code2 className="w-4 h-4 shrink-0 text-emerald-400" />
                  <span>OPÇÃO 2: SCRIPT AUTOMÁTICO (PRODUTIVIDADE)</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded-full bg-blue-500/20 border border-blue-400/40 text-blue-300 font-extrabold text-[9.5px] uppercase tracking-wider">
                    Aba: PRODUTIVIDADE
                  </span>
                  <button
                    onClick={handleCopyScript}
                    className="px-2.5 py-1 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-[11px] flex items-center gap-1.5 transition-all shadow-md shadow-emerald-500/20 cursor-pointer"
                  >
                    {copied ? (
                      <>
                        <Check className="w-3 h-3 stroke-[3]" />
                        <span>Copiado!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3 stroke-[2.5]" />
                        <span>Copiar Script</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* 3 Passos Compactos */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <div className="p-2.5 rounded-lg bg-slate-900/90 border border-slate-700/70 text-[11px] space-y-0.5">
                  <div className="flex items-center gap-1.5 font-black text-amber-400 text-[10.5px]">
                    <span className="w-3.5 h-3.5 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center text-[9px] font-bold">1</span>
                    Apps Script
                  </div>
                  <p className="text-[10px] text-slate-400 leading-tight">
                    Na planilha, clique em <strong className="text-white">Extensões</strong> &gt; <strong className="text-white">Apps Script</strong>.
                  </p>
                </div>

                <div className="p-2.5 rounded-lg bg-slate-900/90 border border-slate-700/70 text-[11px] space-y-0.5">
                  <div className="flex items-center gap-1.5 font-black text-amber-400 text-[10.5px]">
                    <span className="w-3.5 h-3.5 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center text-[9px] font-bold">2</span>
                    Cole o Código
                  </div>
                  <p className="text-[10px] text-slate-400 leading-tight">
                    Substitua o arquivo pelo código copiado e clique em <strong className="text-white">Salvar (💾)</strong>.
                  </p>
                </div>

                <div className="p-2.5 rounded-lg bg-slate-900/90 border border-slate-700/70 text-[11px] space-y-0.5">
                  <div className="flex items-center gap-1.5 font-black text-emerald-400 text-[10.5px]">
                    <span className="w-3.5 h-3.5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-[9px] font-bold">3</span>
                    Sincronize
                  </div>
                  <p className="text-[10px] text-slate-400 leading-tight">
                    Recarregue a planilha e use o menu <strong className="text-emerald-300">⚡ SAGA WMS &gt; Sincronizar</strong>.
                  </p>
                </div>
              </div>

              {/* Code Box Compacto */}
              <div className="relative rounded-lg overflow-hidden bg-slate-950 border border-slate-800">
                <div className="flex items-center justify-between px-3 py-1.5 bg-slate-900/90 border-b border-slate-800 text-[10px] font-mono text-slate-400">
                  <span>GoogleAppsScript.gs</span>
                  <span className="text-emerald-400 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    Envio síncrono ao Firebase RTDB
                  </span>
                </div>
                <pre className="p-3 text-[10px] font-mono text-emerald-300/90 overflow-x-auto max-h-40 leading-relaxed select-text custom-scrollbar">
                  {OFFICIAL_GOOGLE_APPS_SCRIPT}
                </pre>
              </div>
            </div>

            {/* Opção 1 Secundária: Puxar por Link Direto */}
            <div className="p-3 rounded-xl bg-slate-800/40 border border-slate-700/50 space-y-2">
              <div className="flex items-center gap-1.5 text-amber-400 font-black text-xs uppercase font-heading">
                <Zap className="w-3.5 h-3.5" />
                <span>OPÇÃO 1: PUXAR DIRETO PELO LINK OU ID</span>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={sheetInput}
                  onChange={(e) => setSheetInput(e.target.value)}
                  placeholder="Ex: https://docs.google.com/spreadsheets/d/.../edit"
                  className="flex-1 bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 transition-colors"
                />
                <button
                  onClick={handleFetchSheet}
                  disabled={isLoading}
                  className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs flex items-center gap-1.5 transition-all shadow-md shadow-amber-500/20 disabled:opacity-50 cursor-pointer"
                >
                  {isLoading ? (
                    <>
                      <RefreshCw className="w-3 h-3 animate-spin" />
                      Carregando...
                    </>
                  ) : (
                    <>
                      <FileSpreadsheet className="w-3 h-3" />
                      Puxar
                    </>
                  )}
                </button>
              </div>

              {statusMsg && (
                <div
                  className={`p-2 rounded-lg text-[11px] font-semibold ${
                    statusMsg.type === 'success'
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      : statusMsg.type === 'error'
                      ? 'bg-red-500/20 text-red-300 border border-red-500/30'
                      : 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                  }`}
                >
                  {statusMsg.text}
                </div>
              )}
            </div>

            {/* Checklist de Validação Técnica */}
            <div className="p-3 rounded-xl bg-slate-900/90 border border-amber-500/30 space-y-2">
              <div className="flex items-center gap-1.5 text-amber-400 font-black text-[11px] uppercase tracking-wider">
                <ShieldAlert className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span>CHECKLIST DE SINCRONIZAÇÃO EM TEMPO REAL:</span>
              </div>
              <ul className="text-[10.5px] text-slate-300 space-y-1 list-disc pl-4 leading-snug">
                <li>
                  <strong className="text-white">Propriedades do Apps Script:</strong> Chave <code className="bg-slate-950 px-1 py-0.2 rounded text-amber-300 font-mono text-[10px]">FIREBASE_DB_URL</code> com valor <code className="bg-slate-950 px-1 py-0.2 rounded text-emerald-300 font-mono text-[10px]">https://ranking-produtividade-default-rtdb.firebaseio.com</code>.
                </li>
                <li>
                  <strong className="text-white">Regras do Firebase RTDB:</strong> <code className="bg-slate-950 px-1 py-0.2 rounded text-emerald-300 font-mono text-[10px]">{`{".read": true, ".write": true}`}</code>.
                </li>
                <li>
                  <strong className="text-white">Nó de Escuta em Tempo Real:</strong> Escuta contínua no nó <code className="bg-slate-950 px-1 py-0.2 rounded text-amber-300 font-mono text-[10px]">/ranking_atual</code>.
                </li>
              </ul>
            </div>
          </div>
        )}

        {/* Footer Compacto */}
        <div className="px-4 py-2.5 bg-slate-950/90 border-t border-slate-800/80 flex items-center justify-between shrink-0">
          <span className="text-[10px] text-slate-500">
            SAGA WMS • 3 Corações • Integração Google Sheets API
          </span>
          <button
            onClick={onClose}
            className="px-3.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-[11px] font-bold transition-all cursor-pointer"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};
