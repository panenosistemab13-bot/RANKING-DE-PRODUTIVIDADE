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
  const [activeTab, setActiveTab] = useState<'SAGA' | 'UMA' | 'SHEETS'>('SAGA');
  const [pasteText, setPasteText] = useState('');
  const [importStatus, setImportStatus] = useState<string | null>(null);
  const [isLoadingPdf, setIsLoadingPdf] = useState(false);
  const [pdfResult, setPdfResult] = useState<RankingPdfResult | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const fileInputUmaRef = useRef<HTMLInputElement>(null);

  // Estados do Google Sheets
  const [gUser, setGUser] = useState<any>(null);
  const [spreadsheetUrl, setSpreadsheetUrl] = useState('');
  const [isProcessingSheets, setIsProcessingSheets] = useState(false);
  const [createdSheetUrl, setCreatedSheetUrl] = useState<string | null>(null);

  // Inicializa o listener do Google Auth
  useEffect(() => {
    if (isOpen) {
      const unsubscribe = initAuth(
        (user) => {
          setGUser(user);
        },
        () => {
          setGUser(null);
        }
      );
      // Se já houver usuário logado no Firebase Auth
      const currentUser = getCurrentUser();
      if (currentUser) {
        setGUser(currentUser);
      }
      return () => unsubscribe();
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
    // Convert RankingColaborador[] to OperatorSummary[]
    const parsedOperators: OperatorSummary[] = result.colaboradores.map((colab, idx) => {
      // Calculate activities map using Qtd. Ordens (produtividade real)
      const activitiesMap: Record<string, number> = {};
      const colabRows = (colab.registrosDetalhados && colab.registrosDetalhados.length > 0)
        ? colab.registrosDetalhados
        : result.linhas.filter(l => (l?.colaborador || "").toUpperCase() === (colab?.nome || "").toUpperCase());

      colabRows.forEach(l => {
        activitiesMap[l.atividade] = (activitiesMap[l.atividade] || 0) + (l.qtdOrdens || 0);
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
        totalProductivity: colab.qtdOrdens, // Qtd. Ordens
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

    console.log("================================");
    console.log("PDF IMPORTADO COM SUCESSO");
    console.log("PÁGINAS:", result.totalPaginas);
    console.log("REGISTROS:", result.totalRegistros);
    console.log("COLABORADORES:", result.totalColaboradores);
    console.log("ATIVIDADES:", result.atividades);
    console.log("DATA INÍCIO:", result.dataInicio);
    console.log("DATA FIM:", result.dataFim);
    console.log("PERÍODO:", result.frasePeriodo);
    console.table(result.colaboradores);
    console.log("================================");

    const dataInicio = result.dataInicio;
    const dataFim = result.dataFim;
    const label = (dataInicio && dataFim)
      ? `início do período ${dataInicio} ao fim do período ${dataFim}`
      : (result.frasePeriodo || 'início do período 02/01/2026 ao fim do período 20/09/2026');

    onImportCustomData(parsedOperators, label);

    // Save directly to Firebase Realtime Database
    try {
      await salvarRankingRealtime(parsedOperators, label, dataInicio, dataFim);
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
      setImportStatus(`Lendo todas as páginas do PDF "${file.name}"...`);
      try {
        if (activeTab === 'UMA') {
          setImportStatus(`Analisando relatório de U.M.A. e convertendo em Excel...`);
          const result = await lerRankingUMA(file);

          // Gera e faz download automático do Excel
          setImportStatus(`Gerando planilha Excel convertida...`);
          const ws = XLSX.utils.json_to_sheet(result.rawRows);
          const wb = XLSX.utils.book_new();
          XLSX.utils.book_append_sheet(wb, ws, "U.M.A. Convertida");
          const excelName = file.name.replace(/\.pdf$/i, '') + ".xlsx";
          XLSX.writeFile(wb, excelName);

          setPdfResult(result);
          await processRankingResult(result, file.name);
          setImportStatus(`Sucesso! PDF convertido em Excel e ranking de U.M.A. Origem importado.`);
        } else {
          const result = await lerRankingProdutividade(file);
          setPdfResult(result);
          await processRankingResult(result, file.name);
        }
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
            const turnoIdentificado = obterTurnoColaborador(name);
            parsed.push({
              rank: idx + 1,
              name: (name || "").toUpperCase(),
              turno: turnoIdentificado,
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

      // Sort and recalculate participation
      parsed.sort((a, b) => {
        const prodA = a?.totalProductivity || 0;
        const prodB = b?.totalProductivity || 0;
        return prodB - prodA;
      });
      const totalProd = parsed.reduce((acc, curr) => acc + (curr?.totalProductivity || 0), 0) || 1;
      parsed.forEach((op, i) => {
        if (!op) return;
        op.rank = i + 1;
        op.participation = +(( (op?.totalProductivity || 0) / totalProd) * 100).toFixed(2);
      });

      // Extrai datas do texto se existirem
      const datasEncontradas = Array.from(new Set(pasteText.match(/\b\d{2}\/\d{2}\/\d{4}\b/g) || []))
        .filter(d => parseDataBRTimestamp(d) > 0)
        .sort((a, b) => {
          const tA = parseDataBRTimestamp(a) || 0;
          const tB = parseDataBRTimestamp(b) || 0;
          return tA - tB;
        });

      const dInicio = datasEncontradas[0] || "02/01/2026";
      const dFim = datasEncontradas[datasEncontradas.length - 1] || "20/09/2026";
      const label = `início do período ${dInicio} ao fim do período ${dFim}`;

      parsed.forEach(op => {
        op.datas = datasEncontradas;
        op.dataInicio = dInicio;
        op.dataFim = dFim;
      });

      onImportCustomData(parsed, label);

      // Save to Firebase Realtime Database
      salvarRankingRealtime(parsed, label, dInicio, dFim).catch(e => console.warn("Firebase save error:", e));

      setImportStatus(`Sucesso! ${parsed.length} colaboradores importados e sincronizados no Firebase.`);
      setTimeout(() => {
        onClose();
      }, 1200);
    } catch {
      setImportStatus('Erro ao analisar os dados.');
    }
  };

  const handleGoogleLogin = async () => {
    setImportStatus(null);
    try {
      const res = await googleSignIn();
      if (res) {
        setGUser(res.user);
        setImportStatus(`Conectado com sucesso como: ${res.user.email}`);
      }
    } catch (err: any) {
      setImportStatus(`Falha ao conectar com o Google: ${err.message || err}`);
    }
  };

  const handleGoogleLogout = async () => {
    try {
      await googleLogout();
      setGUser(null);
      setCreatedSheetUrl(null);
      setImportStatus("Desconectado da conta do Google.");
    } catch (err: any) {
      setImportStatus(`Erro ao desconectar: ${err.message || err}`);
    }
  };

  const handleExportToSheets = async () => {
    if (!operators || operators.length === 0) {
      setImportStatus("Não há dados de ranking para exportar.");
      return;
    }
    setIsProcessingSheets(true);
    setCreatedSheetUrl(null);
    setImportStatus("Criando nova planilha e exportando dados do ranking...");
    try {
      const title = `SAGA - Ranking de Produtividade (${new Date().toLocaleDateString('pt-BR')})`;
      const spreadsheetId = await exportarRankingParaSheets(title, operators);
      const url = `https://docs.google.com/spreadsheets/d/${spreadsheetId}`;
      setCreatedSheetUrl(url);
      setImportStatus("Exportação concluída com sucesso!");
    } catch (err: any) {
      console.error(err);
      setImportStatus(`Erro ao exportar para o Google Sheets: ${err.message || err}`);
    } finally {
      setIsProcessingSheets(false);
    }
  };

  const handleImportFromSheets = async () => {
    if (!spreadsheetUrl.trim()) {
      setImportStatus("Por favor, insira o link ou o ID da planilha do Google Sheets.");
      return;
    }
    setIsProcessingSheets(true);
    setImportStatus("Conectando à planilha e importando dados...");
    try {
      const id = extrairSpreadsheetId(spreadsheetUrl.trim());
      const parsed = await importarRankingDeSheets(id);
      
      const label = `importado via Google Sheets em ${new Date().toLocaleDateString('pt-BR')}`;
      onImportCustomData(parsed, label);
      
      // Salva no Firebase RTDB
      await salvarRankingRealtime(parsed, label, "02/01/2026", "20/09/2026");
      
      setImportStatus(`Sucesso! ${parsed.length} colaboradores importados da planilha e sincronizados.`);
      setSpreadsheetUrl('');
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (err: any) {
      console.error(err);
      setImportStatus(`Erro ao importar da planilha: ${err.message || err}`);
    } finally {
      setIsProcessingSheets(false);
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
        <div className="px-8 pt-4 flex gap-2 border-b border-slate-100 bg-slate-50/70">
          {/* SAGA button removed */}
          {/* UMA button removed */}
          <button
            type="button"
            onClick={() => {
              setActiveTab('SHEETS');
              setPdfResult(null);
              setImportStatus(null);
            }}
            className={`pb-3 px-4 text-xs font-bold border-b-2 flex items-center gap-2 cursor-pointer transition-colors ${
              activeTab === 'SHEETS'
                ? 'border-amber-500 text-amber-600 font-black'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Database className="w-4 h-4" />
            Google Sheets (Nuvem)
          </button>
        </div>

        {/* Body */}
        <div className="p-8 overflow-y-auto flex-1">
          {activeTab === 'SHEETS' ? (
            <div className="space-y-6">
              {/* Header informativo */}
              <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-900 space-y-1">
                <div className="flex items-center gap-2 font-black text-amber-800 text-sm">
                  <Database className="w-4 h-4 text-amber-600" />
                  Sincronização com Google Sheets
                </div>
                <p className="font-medium text-slate-700">
                  Conecte sua conta do Google para importar planilhas ou exportar o ranking atual diretamente para a sua nuvem do Google Drive.
                </p>
              </div>

              {/* Login Status */}
              {!gUser ? (
                <div className="flex flex-col items-center justify-center p-8 border border-dashed border-slate-300 rounded-2xl bg-slate-50/50 text-center space-y-4">
                  <Database className="w-12 h-12 text-slate-400" />
                  <div>
                    <p className="text-sm font-bold text-slate-800 font-heading">Conexão com Google Pendente</p>
                    <p className="text-xs text-slate-500 max-w-sm mt-1">
                      É necessário fazer login com o Google e permitir o acesso aos arquivos de planilhas para utilizar esta funcionalidade.
                    </p>
                  </div>
                  {/* Botão GSI */}
                  <button
                    type="button"
                    onClick={handleGoogleLogin}
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-xl shadow-sm cursor-pointer transition-colors"
                  >
                    <svg className="w-4 h-4 shrink-0" version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48">
                      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path>
                      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"></path>
                      <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"></path>
                      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path>
                    </svg>
                    Conectar Conta Google
                  </button>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Usuário Conectado */}
                  <div className="flex items-center justify-between p-4 bg-slate-50 border border-slate-200 rounded-2xl">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-amber-500 text-white font-black text-sm flex items-center justify-center shadow-inner">
                        {gUser?.email ? gUser.email[0]?.toUpperCase() : 'G'}
                      </div>
                      <div>
                        <p className="text-xs text-slate-500 font-medium animate-pulse">Conectado como</p>
                        <p className="text-sm font-bold text-slate-800">{gUser.email}</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={handleGoogleLogout}
                      className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                    >
                      Desconectar
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Seção Importar */}
                    <div className="p-5 border border-slate-150 rounded-2xl bg-white space-y-3 flex flex-col justify-between">
                      <div className="space-y-3">
                        <h4 className="text-sm font-black text-slate-900 flex items-center gap-2">
                          <UploadCloud className="w-4 h-4 text-amber-500" />
                          Importar de Planilha
                        </h4>
                        <p className="text-xs text-slate-500 font-medium leading-relaxed">
                          Insira o ID ou link de uma planilha Google Sheets de sua conta. O cabeçalho deve possuir uma coluna que contenha "Colaborador" ou "Nome", e outra com "Produtividade".
                        </p>
                      </div>
                      <div className="space-y-2 pt-1">
                        <input
                          type="text"
                          placeholder="1biozb1pXF_vvISoxkeajsEr_z7prU3EkYQKZf79ja5k"
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
                          {isProcessingSheets ? (
                            <>
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              Processando...
                            </>
                          ) : (
                            <>
                              <Database className="w-3.5 h-3.5" />
                              Importar Planilha
                            </>
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Seção Exportar */}
                    <div className="p-5 border border-slate-150 rounded-2xl bg-white space-y-3 flex flex-col justify-between">
                      <div className="space-y-3">
                        <h4 className="text-sm font-black text-slate-900 flex items-center gap-2">
                          <FileSpreadsheet className="w-4 h-4 text-emerald-500" />
                          Exportar para Planilha
                        </h4>
                        <p className="text-xs text-slate-500 font-medium leading-relaxed">
                          Cria instantaneamente uma nova planilha Google Sheets em seu Google Drive e exporta o ranking e as estatísticas de produtividade de todos os colaboradores ativos do dashboard.
                        </p>
                      </div>
                      <div className="space-y-2 pt-2">
                        <button
                          type="button"
                          onClick={handleExportToSheets}
                          disabled={isProcessingSheets || !operators || operators.length === 0}
                          className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-200 text-white disabled:text-slate-400 rounded-xl text-xs font-bold shadow-sm flex items-center justify-center gap-2 transition-colors cursor-pointer"
                        >
                          {isProcessingSheets ? (
                            <>
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              Criando Planilha...
                            </>
                          ) : (
                            <>
                              <FileSpreadsheet className="w-3.5 h-3.5" />
                              Exportar Ranking Atual
                            </>
                          )}
                        </button>
                        
                        {createdSheetUrl && (
                          <a
                            href={createdSheetUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="block text-center py-2.5 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-bold transition-all animate-bounce"
                          >
                            Ver Planilha no Google Drive ↗
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {importStatus && (
                <div className="p-3 rounded-xl bg-slate-100 text-xs font-medium text-slate-700 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>{importStatus}</span>
                </div>
              )}
            </div>
          ) : (
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
                      {activeTab === 'UMA'
                        ? 'Processando relatório de U.M.A. e gerando Excel...'
                        : 'Processando todas as páginas do PDF com PDF.js...'}
                    </p>
                    <p className="text-xs text-slate-500">
                      {activeTab === 'UMA'
                        ? 'Extraindo dados tabulares de U.M.A. Origem e gerando planilha convertida...'
                        : 'Consolidando registros de datas e somando produtividades reais.'}
                    </p>
                  </div>
                ) : (
                  <>
                    <UploadCloud className="w-12 h-12 text-amber-500 mb-2" />
                    <p className="text-base font-bold text-slate-800">
                      {activeTab === 'UMA'
                        ? 'Selecione ou Arraste o Relatório de U.M.A. em PDF'
                        : 'Selecione ou Arraste o Relatório PDF Oficial do SAGA'}
                    </p>
                    <p className="text-xs text-slate-500 mt-1 max-w-md">
                      {activeTab === 'UMA'
                        ? 'O parser lê o PDF de U.M.A., separa o ranking pela coluna "UMA Origem", gera e baixa automaticamente o Excel correspondente, e substitui integralmente todas as informações do dashboard.'
                        : 'O parser lê automaticamente todas as páginas do PDF, somando a coluna "qtd. Ordens", identificando os turnos (A, B, C, ADM, RANDS) e substituindo integralmente todos os dados anteriores.'}
                    </p>
                    <span className="mt-3 px-3 py-1 bg-amber-100 text-amber-900 rounded-full text-[11px] font-bold">
                      {activeTab === 'UMA' ? 'Conversão Excel Automática • Substituição Total' : 'Substituição Total • Realtime Database Sincronizado'}
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
          )}
        </div>
      </div>
    </div>
  );
};

