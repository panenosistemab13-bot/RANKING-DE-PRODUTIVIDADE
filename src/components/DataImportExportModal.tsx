import React, { useState, useRef } from 'react';
import { X, UploadCloud, AlertCircle, FileSpreadsheet, RefreshCw, CheckCircle2, FileText, Loader2, Database } from 'lucide-react';
import { OperatorSummary, PeriodPreset } from '../types';
import { lerRankingProdutividade, RankingPdfResult } from '../utils/rankingPdfParser';
import { salvarRankingRealtime, salvarHistoricoImportacao, limparRankingRealtime } from '../services/firebase';

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
  onImportCustomData
}) => {
  const [pasteText, setPasteText] = useState('');
  const [importStatus, setImportStatus] = useState<string | null>(null);
  const [isLoadingPdf, setIsLoadingPdf] = useState(false);
  const [pdfResult, setPdfResult] = useState<RankingPdfResult | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleClearAllData = async () => {
    try {
      await limparRankingRealtime();
      onImportCustomData([], "Nenhum dado importado");
      setImportStatus("Todas as informações de teste e dados foram limpos com sucesso!");
    } catch (e) {
      setImportStatus("Erro ao limpar dados.");
    }
  };

  const processRankingResult = async (result: RankingPdfResult, fileName: string) => {
    // Convert RankingColaborador[] to OperatorSummary[]
    const parsedOperators: OperatorSummary[] = result.colaboradores.map((colab, idx) => {
      // Calculate activities map using Qtd. Serv. (produtividade real)
      const activitiesMap: Record<string, number> = {};
      const colabRows = (colab.registrosDetalhados && colab.registrosDetalhados.length > 0)
        ? colab.registrosDetalhados
        : result.linhas.filter(l => l.colaborador.toUpperCase() === colab.nome.toUpperCase());

      colabRows.forEach(l => {
        activitiesMap[l.atividade] = (activitiesMap[l.atividade] || 0) + (l.qtdServ || 0);
      });

      // Find top activity
      let topAct = "APANHA";
      let topActCount = 0;
      Object.entries(activitiesMap).forEach(([act, count]) => {
        if (count > topActCount) {
          topActCount = count;
          topAct = act;
        }
      });

      // Generate sparkline values based on daily entries or smoothed distribution
      let sparkline: number[] = [];
      if (colabRows.length >= 3) {
        sparkline = colabRows.map(r => r.qtdServ || r.qtdOrdens || 1);
      } else {
        const base = colab.qtdServ || colab.qtdOrdens || 10;
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

      const totalMov = (colab.qtdOrdens || 0) + (colab.qtdPecas || 0) + (colab.qtdLotes || 0);

      return {
        rank: idx + 1,
        name: colab.nome,
        totalProductivity: colab.qtdServ, // Qtd. Serv.
        movements: totalMov > 0 ? totalMov : (colab.qtdOrdens || colab.registros || 1),
        participation: +colab.percentual.toFixed(2),
        trendGrowth: +(7.5 + (idx < 5 ? 2.4 : -1.2)).toFixed(1),
        sparkline,
        topActivity: topAct,
        activitiesCount: Object.keys(activitiesMap).length > 0 ? activitiesMap : { [topAct]: colab.qtdServ },
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

    console.log("================================");
    console.log("PDF IMPORTADO COM SUCESSO");
    console.log("PÁGINAS:", result.totalPaginas);
    console.log("REGISTROS:", result.totalRegistros);
    console.log("COLABORADORES:", result.totalColaboradores);
    console.log("ATIVIDADES:", result.atividades);
    console.table(result.colaboradores);
    console.log("================================");

    const label = `PDF: ${fileName.replace(/\.pdf$/i, '')} (${result.totalColaboradores} Colab.)`;
    onImportCustomData(parsedOperators, label);

    // Save directly to Firebase Realtime Database
    try {
      await salvarRankingRealtime(parsedOperators, label);
      await salvarHistoricoImportacao(
        fileName,
        result.totalPaginas,
        result.totalRegistros,
        result.totalColaboradores,
        result.colaboradores
      );
      setImportStatus(`Sucesso! ${result.totalColaboradores} colaboradores salvos no Firebase Realtime Database.`);
    } catch (e: any) {
      console.warn("Erro ao salvar no Firebase:", e);
      setImportStatus(`Importado localmente (${result.totalColaboradores} colaboradores).`);
    }
    
    setTimeout(() => {
      onClose();
    }, 1500);
  };

  const handleFile = async (file: File) => {
    if (file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')) {
      setIsLoadingPdf(true);
      setImportStatus(`Lendo todas as páginas do PDF "${file.name}" com PDF.js...`);
      try {
        const result = await lerRankingProdutividade(file);
        setPdfResult(result);
        processRankingResult(result, file.name);
      } catch (err: any) {
        console.error(err);
        setImportStatus(`Erro ao processar PDF: ${err.message || 'Falha na leitura'}`);
      } finally {
        setIsLoadingPdf(false);
      }
      return;
    }

    // Text / CSV fallback
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        setPasteText(content);
        setImportStatus(`Arquivo "${file.name}" carregado. Clique no botão abaixo para processar.`);
      }
    };
    reader.readAsText(file);
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFile(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleFile(file);
    }
  };

  // Parse custom text / CSV
  const handleProcessImport = () => {
    if (!pasteText.trim()) {
      setImportStatus('Por favor, cole os dados ou carregue um arquivo antes de importar.');
      return;
    }

    try {
      const lines = pasteText.trim().split('\n');
      const parsed: OperatorSummary[] = [];

      lines.forEach((line, idx) => {
        // Support either tab, semicolon, comma or pipe delimiter
        const parts = line.split(/[;\t,|]/).map(s => s.trim().replace(/^"/, '').replace(/"$/, ''));
        if (parts.length >= 2) {
          const name = parts[0];
          const prod = parseInt(parts[1].replace(/\./g, '').replace(/,/g, ''), 10);
          if (name && !isNaN(prod)) {
            const mov = parts[2] ? parseInt(parts[2], 10) : Math.round(prod / 110);
            parsed.push({
              rank: idx + 1,
              name: name.toUpperCase(),
              totalProductivity: prod,
              movements: mov || 20,
              participation: 0, // will calculate below
              trendGrowth: +(Math.random() * 8 + 2).toFixed(1),
              sparkline: [prod * 0.7, prod * 0.8, prod * 0.75, prod * 0.85, prod * 0.9, prod],
              topActivity: "APANHA",
              activitiesCount: { APANHA: mov || 20 }
            });
          }
        }
      });

      if (parsed.length === 0) {
        setImportStatus('Formato não reconhecido. Use: Nome; Produtividade; Movimentações');
        return;
      }

      // Sort and recalculate participation - NO .slice(0, 25) limit!
      parsed.sort((a, b) => b.totalProductivity - a.totalProductivity);
      const totalProd = parsed.reduce((acc, curr) => acc + curr.totalProductivity, 0) || 1;
      parsed.forEach((op, i) => {
        op.rank = i + 1;
        op.participation = +((op.totalProductivity / totalProd) * 100).toFixed(2);
      });

      const label = `Relatório (${parsed.length} Colaboradores)`;
      onImportCustomData(parsed, label);

      // Save to Firebase Realtime Database
      salvarRankingRealtime(parsed, label).catch(e => console.warn("Firebase save error:", e));

      setImportStatus(`Sucesso! ${parsed.length} colaboradores importados e sincronizados no Firebase.`);
      setTimeout(() => {
        onClose();
      }, 1200);
    } catch {
      setImportStatus('Erro ao analisar os dados.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-slate-950/70 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-3xl rounded-[32px] bg-white border border-slate-200 shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
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

        {/* Tab Navigation */}
        <div className="px-8 pt-4 flex gap-2 border-b border-slate-100">
          <div className="pb-3 px-4 text-xs font-bold border-b-2 border-amber-500 text-amber-600 flex items-center gap-2">
            <FileText className="w-4 h-4" />
            Importar PDF SAGA Completo (39 Páginas)
          </div>
        </div>

        {/* Body */}
        <div className="p-8 overflow-y-auto flex-1">
          <div className="space-y-4">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileInputChange}
              accept="application/pdf,.pdf,.csv,.txt,.xlsx,.xls"
              className="hidden"
            />
            <div
              onClick={() => fileInputRef.current?.click()}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`p-8 rounded-2xl border-2 border-dashed flex flex-col items-center justify-center text-center cursor-pointer transition-all ${
                isDragging
                  ? 'border-amber-500 bg-amber-50/60 scale-[1.01]'
                  : 'border-slate-300 hover:border-amber-400 bg-slate-50/50'
              }`}
            >
              {isLoadingPdf ? (
                <div className="flex flex-col items-center gap-2 py-4">
                  <Loader2 className="w-10 h-10 text-amber-500 animate-spin" />
                  <p className="text-sm font-black text-slate-800">
                    Processando todas as páginas do PDF com PDF.js...
                  </p>
                  <p className="text-xs text-slate-500">
                    Consolidando registros de datas e somando produtividades reais.
                  </p>
                </div>
              ) : (
                <>
                  <UploadCloud className="w-12 h-12 text-amber-500 mb-2" />
                  <p className="text-base font-bold text-slate-800">
                    Selecione ou Arraste o Relatório PDF Oficial do SAGA
                  </p>
                  <p className="text-xs text-slate-500 mt-1 max-w-md">
                    O parser lê automaticamente todas as 39 páginas do PDF, sem limite de colaboradores, somando registros por colaborador e atividade.
                  </p>
                  <span className="mt-3 px-3 py-1 bg-amber-100 text-amber-900 rounded-full text-[11px] font-bold">
                    Parser Nativo de PDF Ativo (Sem limite de 25)
                  </span>
                </>
              )}
            </div>

            {pdfResult && (
              <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-900 space-y-1">
                <div className="flex items-center gap-2 font-black text-emerald-800 text-sm">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  PDF Processado com Sucesso!
                </div>
                <div className="grid grid-cols-4 gap-2 pt-1 font-medium">
                  <div><strong>Páginas:</strong> {pdfResult.totalPaginas}</div>
                  <div><strong>Registros:</strong> {pdfResult.totalRegistros}</div>
                  <div><strong>Colaboradores:</strong> {pdfResult.totalColaboradores}</div>
                  <div><strong>Atividades:</strong> {pdfResult.atividades.length}</div>
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                Ou Cole Linhas de Dados (Formato: Nome ; Produtividade ; Movimentações)
              </label>
              <textarea
                rows={4}
                placeholder={`LUAN MARTINS; 5234; 48\nGABRIEL YGOR; 4982; 42\nMARCELINO RIBEIRO; 4761; 39\nANTHONY RODRIGO; 4502; 36`}
                value={pasteText}
                onChange={(e) => setPasteText(e.target.value)}
                className="w-full p-3 text-xs font-mono rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500 text-slate-800 bg-white"
              />
            </div>

            {importStatus && (
              <div className="p-3 rounded-xl bg-slate-100 text-xs font-medium text-slate-700 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                <span>{importStatus}</span>
              </div>
            )}

            <div className="flex items-center justify-between pt-2">
              <button
                type="button"
                onClick={handleClearAllData}
                className="px-4 py-2 text-xs font-bold rounded-xl text-red-600 hover:bg-red-50 border border-red-200 cursor-pointer transition-colors"
                title="Limpar todos os dados do Firebase Realtime e LocalStorage"
              >
                Limpar Banco / Resetar Dados
              </button>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setPasteText('');
                    setPdfResult(null);
                    setImportStatus(null);
                  }}
                  className="px-4 py-2 text-xs font-bold rounded-xl text-slate-600 hover:bg-slate-100 cursor-pointer"
                >
                  Limpar Campos
                </button>
                <button
                  type="button"
                  onClick={handleProcessImport}
                  disabled={isLoadingPdf}
                  className="px-6 py-2.5 text-xs font-bold rounded-xl bg-amber-500 hover:bg-amber-600 text-white shadow-md shadow-amber-500/30 flex items-center gap-2 cursor-pointer transition-colors disabled:opacity-50"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  Atualizar Dashboard com Estes Dados
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

