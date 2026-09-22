import React, { useState, useRef, useEffect } from 'react';
import { X, UploadCloud, AlertCircle, FileSpreadsheet, RefreshCw, CheckCircle2, FileText, Loader2, Database } from 'lucide-react';
import { OperatorSummary, PeriodPreset } from '../types';
import { lerRankingProdutividade, lerRankingUMA, RankingPdfResult, parseDataBRTimestamp } from '../utils/rankingPdfParser';
import { obterTurnoColaborador } from '../utils/turnos';
import { salvarRankingRealtime, salvarHistoricoImportacao, limparRankingRealtime } from '../services/firebase';
import * as XLSX from 'xlsx';
import { googleSignIn, logout as googleLogout, initAuth, getCurrentUser } from '../services/googleAuth';
import { exportarRankingParaSheets, importarRankingDeSheets, extrairSpreadsheetId } from '../services/googleSheets';

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
  const [activeTab, setActiveTab] = useState<'SAGA' | 'UMA' | 'SHEETS'>('SHEETS');
  const [pasteText, setPasteText] = useState('');
  const [importStatus, setImportStatus] = useState<string | null>(null);
  const [isLoadingPdf, setIsLoadingPdf] = useState(false);
  const [pdfResult, setPdfResult] = useState<RankingPdfResult | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const fileInputUmaRef = useRef<HTMLInputElement>(null);

  // Estados do Google Sheets / Firebase
  const [gUser, setGUser] = useState<any>({ email: 'Sincronizado via Firebase Realtime' });
  const [spreadsheetUrl, setSpreadsheetUrl] = useState('');
  const [isProcessingSheets, setIsProcessingSheets] = useState(false);
  const [createdSheetUrl, setCreatedSheetUrl] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      // Simula utilizador autenticado automaticamente para evitar o pedido de login manual
      setGUser({ email: 'sincronizacao.automatica@firebase.com' });
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleClearAllData = async () => {
    try {
      await limparRankingRealtime();
      onImportCustomData([], "Nenhum dado importado");
      setImportStatus("Dados limpos com sucesso.");
    } catch (e) {
      setImportStatus("Erro ao limpar dados.");
    }
  };

  const processRankingResult = async (result: RankingPdfResult, fileName: string) => {
    const parsedOperators: OperatorSummary[] = result.colaboradores.map((colab, idx) => {
      const activitiesMap: Record<string, number> = {};
      const colabRows = (colab.registrosDetalhados && colab.registrosDetalhados.length > 0)
        ? colab.registrosDetalhados
        : result.linhas.filter(l => (l?.colaborador || "").toUpperCase() === (colab?.nome || "").toUpperCase());

      colabRows.forEach(l => {
        activitiesMap[l.atividade] = (activitiesMap[l.atividade] || 0) + (l.qtdOrdens || 0);
      });

      let topAct = "APANHA";
      let topActCount = 0;
      Object.entries(activitiesMap).forEach(([act, count]) => {
        if (count > topActCount) {
          topActCount = count;
          topAct = act;
        }
      });

      let sparkline: number[] = [];
      if (colabRows.length >= 3) {
        sparkline = colabRows.map(r => r.qtdOrdens || r.qtdServ || 1);
      } else {
        const base = colab.qtdOrdens || colab.qtdServ || 10;
        sparkline = [
          Math.round(base * 0.12),
          Math.round(base * 0.14),
          Math.round(base * 0.13),
          Math.round(base * 0.18),
          Math.round(base * 0.17),
          Math.round(base * 0.22),
          Math.round(base * 0.24)
        ];
      }

      const totalMov = (colab.qtdServ || 0) + (colab.qtdPecas || 0) + (colab.qtdLotes || 0);

      return {
        rank: idx + 1,
        name: colab.nome,
        turno: colab.turno || obterTurnoColaborador(colab.nome),
        totalProductivity: colab.qtdOrdens,
        movements: totalMov > 0 ? totalMov : (colab.qtdServ || colab.registros || 1),
        participation: +colab.percentual.toFixed(2),
        trendGrowth: +(7.5 + (idx < 5 ? 2.4 : -1.2)).toFixed(1),
        sparkline,
        topActivity: topAct,
        activitiesCount: Object.keys(activitiesMap).length > 0 ? activitiesMap : { [topAct]: colab.qtdOrdens },
        datas: colab.datas,
        dataInicio: result.dataInicio,
        dataFim: result.dataFim,
        qtdOrdens: colab.qtdOrdens,
        qtdPecas: colab.qtdPecas,
        qtdLotes: colab.qtdLotes,
        qtdServ: colab.qtdServ,
        qtdItens: colab.qtdItens,
        qtdEnd: colab.qtdEnd,
        registros: colab.registros,
        registrosDetalhados: colabRows,
      };
    });

    const dataInicio = result.dataInicio;
    const dataFim = result.dataFim;
    const label = (dataInicio && dataFim)
      ? `início do período ${dataInicio} ao fim do período ${dataFim}`
      : (result.frasePeriodo || 'início do período 02/01/2026 ao fim do período 20/09/2026');

    onImportCustomData(parsedOperators, label);

    try {
      await salvarRankingRealtime(parsedOperators, label, dataInicio, dataFim);
      await salvarHistoricoImportacao(
        fileName,
        result.totalPaginas,
        result.totalRegistros,
        result.totalColaboradores,
        result.colaboradores
      );
      setImportStatus(`Sucesso! ${result.totalColaboradores} colaboradores salvos no Firebase.`);
    } catch (e: any) {
      setImportStatus(`Importado localmente (${result.totalColaboradores} colaboradores).`);
    }
    
    setTimeout(() => {
      onClose();
    }, 1500);
  };

  const handleFile = async (file: File) => {
    if (file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')) {
      setIsLoadingPdf(true);
      setImportStatus(`A ler o PDF "${file.name}"...`);
      try {
        if (activeTab === 'UMA') {
          const result = await lerRankingUMA(file);
          const ws = XLSX.utils.json_to_sheet(result.rawRows);
          const wb = XLSX.utils.book_new();
          XLSX.utils.book_append_sheet(wb, ws, "U.M.A. Convertida");
          const excelName = file.name.replace(/\.pdf$/i, '') + ".xlsx";
          XLSX.writeFile(wb, excelName);

          setPdfResult(result);
          await processRankingResult(result, file.name);
          setImportStatus(`Sucesso! PDF convertido e importado.`);
        } else {
          const result = await lerRankingProdutividade(file);
          setPdfResult(result);
          await processRankingResult(result, file.name);
        }
      } catch (err: any) {
        setImportStatus(`Erro ao processar PDF: ${err.message || 'Falha na leitura'}`);
      } finally {
        setIsLoadingPdf(false);
      }
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        setPasteText(content);
        setImportStatus(`Arquivo "${file.name}" carregado.`);
      }
    };
    reader.readAsText(file);
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  };

  const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); setIsDragging(true); };
  const handleDragLeave = (e: React.DragEvent) => { e.preventDefault(); setIsDragging(false); };
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  };

  const handleProcessImport = () => {
    if (!pasteText.trim()) {
      setImportStatus('Por favor, cole os dados antes de importar.');
      return;
    }
    try {
      const lines = pasteText.trim().split('\n');
      const parsed: OperatorSummary[] = [];

      lines.forEach((line, idx) => {
        const parts = line.split(/[;\t,|]/).map(s => s.trim().replace(/^"/, '').replace(/"$/, ''));
        if (parts.length >= 2) {
          const name = parts[0];
          const prod = parseInt(parts[1].replace(/\./g, '').replace(/,/g, ''), 10);
          if (name && !isNaN(prod)) {
            const mov = parts[2] ? parseInt(parts[2], 10) : Math.round(prod / 110);
            parsed.push({
              rank: idx + 1,
              name: (name || "").toUpperCase(),
              turno: obterTurnoColaborador(name),
              totalProductivity: prod,
              movements: mov || 20,
              participation: 0,
              trendGrowth: +(Math.random() * 8 + 2).toFixed(1),
              sparkline: [prod * 0.7, prod * 0.8, prod * 0.75, prod * 0.85, prod * 0.9, prod],
              topActivity: "APANHA",
              activitiesCount: { APANHA: mov || 20 }
            });
          }
        }
      });

      if (parsed.length === 0) {
        setImportStatus('Formato não reconhecido.');
        return;
      }

      parsed.sort((a, b) => (b?.totalProductivity || 0) - (a?.totalProductivity || 0));
      const totalProd = parsed.reduce((acc, curr) => acc + (curr?.totalProductivity || 0), 0) || 1;
      parsed.forEach((op, i) => {
        if (!op) return;
        op.rank = i + 1;
        op.participation = +(((op?.totalProductivity || 0) / totalProd) * 100).toFixed(2);
      });

      const label = "Sincronizado automaticamente via Firebase";
      onImportCustomData(parsed, label);
      salvarRankingRealtime(parsed, label, "02/01/2026", "20/09/2026").catch(() => {});
      setImportStatus(`Sucesso! ${parsed.length} colaboradores importados.`);
      setTimeout(() => onClose(), 1200);
    } catch {
      setImportStatus('Erro ao analisar os dados.');
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

  const handleImportFromSheets = async () => {
    if (!spreadsheetUrl.trim()) {
      setImportStatus("Insira o link ou ID da planilha.");
      return;
    }
    setIsProcessingSheets(true);
    setImportStatus("A importar dados da planilha...");
    try {
      const id = extrairSpreadsheetId(spreadsheetUrl.trim());
      const parsed = await importarRankingDeSheets(id);
      const label = `importado via Google Sheets em ${new Date().toLocaleDateString('pt-BR')}`;
      onImportCustomData(parsed, label);
      await salvarRankingRealtime(parsed, label, "02/01/2026", "20/09/2026");
      setImportStatus(`Sucesso! ${parsed.length} colaboradores importados.`);
      setSpreadsheetUrl('');
      setTimeout(() => onClose(), 1500);
    } catch (err: any) {
      setImportStatus(`Erro ao importar: ${err.message || err}`);
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
            onClick={() => { setActiveTab('SHEETS'); setPdfResult(null); setImportStatus(null); }}
            className={`pb-3 px-4 text-xs font-bold border-b-2 flex items-center gap-2 cursor-pointer transition-colors ${
              activeTab === 'SHEETS' ? 'border-amber-500 text-amber-600 font-black' : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Database className="w-4 h-4" />
            Google Sheets & Firebase (Nuvem)
          </button>
        </div>

        <div className="p-8 overflow-y-auto flex-1">
          {activeTab === 'SHEETS' ? (
            <div className="space-y-6">
              <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-900 space-y-1">
                <div className="flex items-center gap-2 font-black text-emerald-800 text-sm">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  Sincronização Automática Ativa
                </div>
                <p className="font-medium text-slate-700">
                  O painel está conectado diretamente ao Firebase em tempo real, dispensando qualquer login manual na inicialização.
                </p>
              </div>

              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-5 border border-slate-150 rounded-2xl bg-white space-y-3 flex flex-col justify-between">
                    <div className="space-y-3">
                      <h4 className="text-sm font-black text-slate-900 flex items-center gap-2">
                        <UploadCloud className="w-4 h-4 text-amber-500" />
                        Importar de Planilha
                      </h4>
                      <p className="text-xs text-slate-500 font-medium leading-relaxed">
                        Insira o ID ou link da planilha para sincronizar os dados.
                      </p>
                    </div>
                    <div className="space-y-2 pt-1">
                      <input
                        type="text"
                        placeholder="Insira o Link ou ID da Planilha"
                        value={spreadsheetUrl}
                        onChange={(e) => setSpreadsheetUrl(e.target.value)}
                        disabled={isProcessingSheets}
                        className="w-full p-2.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500 text-slate-800 bg-white"
                      />
                      <button
                        type="button"
                        onClick={handleImportFromSheets}
                        disabled={isProcessingSheets}
                        className="w-full py-2.5 bg-amber-500 hover:bg-amber-600 disabled:bg-slate-200 text-white disabled:text-slate-400 rounded-xl text-xs font-bold shadow-sm flex items-center justify-center gap-2 transition-colors cursor-pointer"
                      >
                        {isProcessingSheets ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Database className="w-3.5 h-3.5" />}
                        Importar Planilha
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
              </div>

              {importStatus && (
                <div className="p-3 rounded-xl bg-slate-100 text-xs font-medium text-slate-700 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>{importStatus}</span>
                </div>
              )}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
};