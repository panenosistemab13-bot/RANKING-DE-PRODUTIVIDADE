import React, { useState, useRef } from 'react';
import { X, UploadCloud, AlertCircle, FileSpreadsheet, RefreshCw } from 'lucide-react';
import { OperatorSummary, PeriodPreset } from '../types';

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
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFile = (file: File) => {
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

      // Sort and recalculate participation
      parsed.sort((a, b) => b.totalProductivity - a.totalProductivity);
      const totalProd = parsed.reduce((acc, curr) => acc + curr.totalProductivity, 0) || 1;
      parsed.forEach((op, i) => {
        op.rank = i + 1;
        op.participation = +((op.totalProductivity / totalProd) * 100).toFixed(2);
      });

      onImportCustomData(parsed, "Relatório Importado");
      setImportStatus(`Sucesso! ${parsed.length} colaboradores importados.`);
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

        {/* Tab Navigation with "Fonte de Dados SAGA" and "Exportar Ranking" hidden */}
        <div className="px-8 pt-4 flex gap-2 border-b border-slate-100">
          <div className="pb-3 px-4 text-xs font-bold border-b-2 border-amber-500 text-amber-600">
            Importar PDF / Excel
          </div>
        </div>

        {/* Body - Only Import Section is active */}
        <div className="p-8 overflow-y-auto flex-1">
          <div className="space-y-4">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileInputChange}
              accept=".csv,.txt,.xlsx,.xls,.pdf"
              className="hidden"
            />
            <div
              onClick={() => fileInputRef.current?.click()}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`p-6 rounded-2xl border-2 border-dashed flex flex-col items-center justify-center text-center cursor-pointer transition-all ${
                isDragging
                  ? 'border-amber-500 bg-amber-50/60 scale-[1.01]'
                  : 'border-slate-300 hover:border-amber-400 bg-slate-50/50'
              }`}
            >
              <UploadCloud className="w-10 h-10 text-amber-500 mb-2" />
              <p className="text-sm font-bold text-slate-800">
                Arraste e solte o novo PDF ou planilha Excel (.xlsx / .csv)
              </p>
              <p className="text-xs text-slate-400 mt-1">
                Clique para selecionar um arquivo ou cole o texto copiado do relatório SAGA no campo abaixo
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                Colar Linhas de Dados (Formato: Nome ; Produtividade ; Movimentações)
              </label>
              <textarea
                rows={6}
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

            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => {
                  setPasteText('');
                  setImportStatus(null);
                }}
                className="px-4 py-2 text-xs font-bold rounded-xl text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                Limpar
              </button>
              <button
                onClick={handleProcessImport}
                className="px-6 py-2 text-xs font-bold rounded-xl bg-amber-500 hover:bg-amber-600 text-white shadow-md shadow-amber-500/30 flex items-center gap-2 cursor-pointer transition-colors"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Atualizar Dashboard com Estes Dados
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
