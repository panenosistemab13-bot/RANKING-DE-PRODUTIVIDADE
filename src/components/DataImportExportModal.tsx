import React, { useState, useRef, useEffect } from 'react';
import { X, UploadCloud, AlertCircle, FileSpreadsheet, CheckCircle2, Loader2, Database } from 'lucide-react';
import { OperatorSummary, PeriodPreset } from '../types';
import { lerRankingProdutividade, lerRankingUMA, RankingPdfResult } from '../utils/rankingPdfParser';
import { obterTurnoColaborador } from '../utils/turnos';
import { salvarRankingRealtime, salvarHistoricoImportacao, limparRankingRealtime } from '../services/firebase';
import * as XLSX from 'xlsx';
import { exportarRankingParaSheets, importarRankingDeSheets } from '../services/googleSheets';

interface DataImportExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  operators?: OperatorSummary[];
  periodPreset?: PeriodPreset;
  onSelectPeriodPreset?: (preset: PeriodPreset) => void;
  onImportCustomData: (newOperators: OperatorSummary[], label: string) => void;
}

export const DataImportExportModal: React.FC<DataImportExportModalProps> = ({
  isOpen,
  onClose,
  operators = [],
  onImportCustomData
}) => {
  const [activeTab, setActiveTab] = useState<'SHEETS'>('SHEETS');
  const [pasteText, setPasteText] = useState('');
  const [importStatus, setImportStatus] = useState<string | null>(null);
  const [isLoadingPdf, setIsLoadingPdf] = useState(false);
  const [pdfResult, setPdfResult] = useState<RankingPdfResult | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ID fixo fornecido da planilha
  const defaultSpreadsheetId = '1synVKAYxOm4dRUXEuw65u0Lv1erLF7-9PXeAUtSd-QA';
  const [spreadsheetUrl, setSpreadsheetUrl] = useState(defaultSpreadsheetId);
  const [isProcessingSheets, setIsProcessingSheets] = useState(false);
  const [createdSheetUrl, setCreatedSheetUrl] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setSpreadsheetUrl(defaultSpreadsheetId);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleImportFromSheetsAuto = async () => {
    setIsProcessingSheets(true);
    setImportStatus("A sincronizar dados diretamente da planilha padrão...");
    try {
      const parsed = await importarRankingDeSheets(defaultSpreadsheetId);
      const label = `sincronizado via Google Sheets em ${new Date().toLocaleDateString('pt-BR')}`;
      onImportCustomData(parsed, label);
      await salvarRankingRealtime(parsed, label, "02/01/2026", "20/09/2026");
      setImportStatus(`Sucesso! ${parsed.length} colaboradores atualizados e sincronizados.`);
      setTimeout(() => onClose(), 1500);
    } catch (err: any) {
      console.error(err);
      setImportStatus(`Erro ao sincronizar: ${err.message || err}`);
    } finally {
      setIsProcessingSheets(false);
    }
  };

  const handleExportToSheets = async () => {
    if (!operators || operators.length === 0) {
      setImportStatus("Não há dados para exportar.");
      return;
    }
    setIsProcessingSheets(true);
    setImportStatus("Exportando dados...");
    try {
      const title = `SAGA - Ranking (${new Date().toLocaleDateString('pt-BR')})`;
      const spreadsheetId = await exportarRankingParaSheets(title, operators);
      setCreatedSheetUrl(`https://docs.google.com/spreadsheets/d/${spreadsheetId}`);
      setImportStatus("Exportação concluída com sucesso!");
    } catch (err: any) {
      setImportStatus(`Erro ao exportar: ${err.message || err}`);
    } finally {
      setIsProcessingSheets(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-slate-950/70 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-3xl rounded-[32px] bg-white border border-slate-200 shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        <div className="px-8 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500 text-white flex items-center justify-center shadow-md shadow-amber-500/30">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-xl font-black text-slate-900 font-heading">
                Gestão de Dados & Relatórios SAGA
              </h3>
              <p className="text-xs font-medium text-slate-500">
                SAGA Tecnologia • 3 Corações Sta Luzia • Site: 3 COR - BH
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 hover:text-slate-900 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="px-8 pt-4 flex gap-2 border-b border-slate-100 bg-slate-50/70">
          <button
            type="button"
            onClick={() => { setActiveTab('SHEETS'); setImportStatus(null); }}
            className="pb-3 px-4 text-xs font-bold border-b-2 border-amber-500 text-amber-600 font-black flex items-center gap-2 cursor-pointer transition-colors"
          >
            <Database className="w-4 h-4" />
            Google Sheets & Firebase (Nuvem)
          </button>
        </div>

        <div className="p-8 overflow-y-auto flex-1">
          <div className="space-y-6">
            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-900 space-y-1">
              <div className="flex items-center gap-2 font-black text-emerald-800 text-sm">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                Sincronização Automática Ativa
              </div>
              <p className="font-medium text-slate-700">
                O painel está configurado com a planilha oficial e ligado ao Firebase em tempo real.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-5 border border-slate-150 rounded-2xl bg-white space-y-3 flex flex-col justify-between">
                <div className="space-y-3">
                  <h4 className="text-sm font-black text-slate-900 flex items-center gap-2">
                    <UploadCloud className="w-4 h-4 text-amber-500" />
                    Sincronizar Planilha Padrão
                  </h4>
                  <p className="text-xs text-slate-500 font-medium leading-relaxed">
                    Clique abaixo para puxar os dados atualizados da planilha configurada.
                  </p>
                </div>
                <div className="space-y-2 pt-1">
                  <input
                    type="text"
                    value={spreadsheetUrl}
                    readOnly
                    className="w-full p-2.5 text-xs rounded-xl border border-slate-200 bg-slate-100 text-slate-600 font-mono"
                  />
                  <button
                    type="button"
                    onClick={handleImportFromSheetsAuto}
                    disabled={isProcessingSheets}
                    className="w-full py-2.5 bg-amber-500 hover:bg-amber-600 disabled:bg-slate-200 text-white disabled:text-slate-400 rounded-xl text-xs font-bold shadow-sm flex items-center justify-center gap-2 transition-colors cursor-pointer"
                  >
                    {isProcessingSheets ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Database className="w-3.5 h-3.5" />}
                    Atualizar Agora
                  </button>
                </div>
              </div>

              <div className="p-5 border border-slate-150 rounded-2xl bg-white space-y-3 flex flex-col justify-between">
                <div className="space-y-3">
                  <h4 className="text-sm font-black text-slate-900 flex items-center gap-2">
                    <FileSpreadsheet className="w-4 h-4 text-emerald-500" />
                    Exportar para Planilha
                  </h4>
                  <p className="text-xs text-slate-500 font-medium leading-relaxed">
                    Cria instantaneamente uma nova planilha Google Sheets com os dados atuais do ranking.
                  </p>
                </div>
                <div className="space-y-2 pt-2">
                  <button
                    type="button"
                    onClick={handleExportToSheets}
                    disabled={isProcessingSheets || !operators || operators.length === 0}
                    className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-200 text-white disabled:text-slate-400 rounded-xl text-xs font-bold shadow-sm flex items-center justify-center gap-2 transition-colors cursor-pointer"
                  >
                    {isProcessingSheets ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <FileSpreadsheet className="w-3.5 h-3.5" />}
                    Exportar Ranking Atual
                  </button>
                  
                  {createdSheetUrl && (
                    <a
                      href={createdSheetUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="block text-center py-2.5 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-bold transition-all"
                    >
                      Ver Planilha no Google Drive ↗
                    </a>
                  )}
                </div>
              </div>
            </div>

            {importStatus && (
              <div className="p-3 rounded-xl bg-slate-100 text-xs font-medium text-slate-700 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                <span>{importStatus}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};