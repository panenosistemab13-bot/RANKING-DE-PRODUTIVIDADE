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
  Info
} from 'lucide-react';
import { OFFICIAL_GOOGLE_APPS_SCRIPT, importarRankingDeSheets } from '../services/googleSheets';
import { OperatorSummary } from '../types';

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

  if (!isOpen) return null;

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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-md animate-fadeIn select-none">
      <div className="relative w-full max-w-3xl bg-slate-900 border border-amber-500/30 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-gradient-to-r from-amber-950/40 via-slate-900 to-slate-900">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white shadow-lg shadow-emerald-500/20">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-black text-white tracking-tight flex items-center gap-2">
                INTEGRAÇÃO GOOGLE SHEETS • SAGA WMS
                <span className="text-[10px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-full font-extrabold uppercase">
                  Script Oficial
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                Puxe todas as informações da planilha em tempo real automaticamente
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-slate-800/80 text-slate-400 hover:text-white hover:bg-slate-700 flex items-center justify-center transition-all"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">

          {/* Quick Option 1: Puxar por Link Direto */}
          <div className="p-4 rounded-xl bg-slate-800/50 border border-slate-700/60 space-y-3">
            <div className="flex items-center gap-2 text-amber-400 font-bold text-sm">
              <Zap className="w-4 h-4" />
              OPÇÃO 1: PUXAR DIRETO PELO LINK DA PLANILHA
            </div>
            <p className="text-xs text-slate-300">
              Cole o link da sua planilha pública do Google Sheets ou ID para importar todos os colaboradores instantaneamente:
            </p>

            <div className="flex items-center gap-2">
              <input
                type="text"
                value={sheetInput}
                onChange={(e) => setSheetInput(e.target.value)}
                placeholder="Ex: https://docs.google.com/spreadsheets/d/1synVKAYxOm4dRUXEuw65u0Lv1erLF7-9PXeAUtSd-QA/edit"
                className="flex-1 bg-slate-950 border border-slate-700 rounded-lg px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 transition-colors"
              />
              <button
                onClick={handleFetchSheet}
                disabled={isLoading}
                className="px-4 py-2 rounded-lg bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs flex items-center gap-2 transition-all shadow-md shadow-amber-500/20 disabled:opacity-50"
              >
                {isLoading ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    Carregando...
                  </>
                ) : (
                  <>
                    <FileSpreadsheet className="w-3.5 h-3.5" />
                    Puxar Dados
                  </>
                )}
              </button>
            </div>

            {statusMsg && (
              <div className={`p-2.5 rounded-lg text-xs font-semibold ${
                statusMsg.type === 'success' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' :
                statusMsg.type === 'error' ? 'bg-red-500/20 text-red-300 border border-red-500/30' :
                'bg-blue-500/20 text-blue-300 border border-blue-500/30'
              }`}>
                {statusMsg.text}
              </div>
            )}
          </div>

          {/* Quick Option 2: Script do Apps Script */}
          <div className="p-4 rounded-xl bg-slate-800/50 border border-emerald-500/30 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
                <Code2 className="w-4 h-4" />
                OPÇÃO 2: SCRIPT AUTOMÁTICO PARA O GOOGLE SHEETS (APPS SCRIPT)
              </div>
              <button
                onClick={handleCopyScript}
                className="px-3 py-1.5 rounded-lg bg-emerald-500 text-slate-950 font-black text-xs flex items-center gap-1.5 hover:bg-emerald-400 transition-all shadow-md shadow-emerald-500/20"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    Copiado!
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    Copiar Script
                  </>
                )}
              </button>
            </div>

            {/* Passo a Passo Visual */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="p-3 rounded-lg bg-slate-900 border border-slate-700/80 text-xs space-y-1">
                <div className="flex items-center gap-1.5 font-bold text-amber-400">
                  <span className="w-4 h-4 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center text-[10px]">1</span>
                  Abra o Apps Script
                </div>
                <p className="text-[11px] text-slate-400">
                  Na sua planilha, clique no menu <strong className="text-white">Extensões</strong> &gt; <strong className="text-white">Apps Script</strong>.
                </p>
              </div>

              <div className="p-3 rounded-lg bg-slate-900 border border-slate-700/80 text-xs space-y-1">
                <div className="flex items-center gap-1.5 font-bold text-amber-400">
                  <span className="w-4 h-4 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center text-[10px]">2</span>
                  Cole o Código
                </div>
                <p className="text-[11px] text-slate-400">
                  Substitua todo o texto pelo script abaixo e clique em <strong className="text-white">Salvar (💾)</strong>.
                </p>
              </div>

              <div className="p-3 rounded-lg bg-slate-900 border border-slate-700/80 text-xs space-y-1">
                <div className="flex items-center gap-1.5 font-bold text-amber-400">
                  <span className="w-4 h-4 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center text-[10px]">3</span>
                  Sincronize no Menu
                </div>
                <p className="text-[11px] text-slate-400">
                  Volte à planilha e clique no novo menu <strong className="text-emerald-400">⚡ SAGA WMS &gt; Sincronizar</strong>!
                </p>
              </div>
            </div>

            {/* Script Code Viewer */}
            <div className="relative rounded-xl overflow-hidden bg-slate-950 border border-slate-800">
              <div className="flex items-center justify-between px-4 py-2 bg-slate-900/90 border-b border-slate-800 text-[11px] font-mono text-slate-400">
                <span>GoogleAppsScript.gs</span>
                <span className="text-emerald-400">Envio direto ao Realtime Database SAGA</span>
              </div>
              <pre className="p-4 text-[11px] font-mono text-emerald-300 overflow-x-auto max-h-56 leading-relaxed select-text">
                {OFFICIAL_GOOGLE_APPS_SCRIPT}
              </pre>
            </div>
          </div>

          {/* Dica do Sistema */}
          <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-blue-950/40 border border-blue-500/30 text-xs text-blue-200">
            <Info className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
            <div>
              <strong className="text-blue-300">Regra de Deduplicação SAGA mantida:</strong> O script calcula a produtividade real por contagem única de U.M.A.s e agrupa todas as ordens, turnos e atividades de cada colaborador automaticamente!
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-slate-950 border-t border-slate-800 flex items-center justify-between">
          <span className="text-xs text-slate-500">
            SAGA WMS • 3 Corações • Integração Google Sheets API
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold transition-all"
          >
            Fechar
          </button>
        </div>

      </div>
    </div>
  );
};
