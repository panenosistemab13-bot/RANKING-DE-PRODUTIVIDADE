import React, { useState, useEffect, useMemo } from 'react';
import { X, Clock, Check, Search, ShieldCheck, User, Sparkles, CheckCircle2 } from 'lucide-react';
import { OperatorSummary } from '../types';
import { obterTurnoColaborador, obterEstiloVisualTurno, TipoTurno } from '../utils/turnos';

interface ModalEditarTurnoProps {
  isOpen: boolean;
  onClose: () => void;
  operatorName: string | null;
  currentTurno?: string;
  allOperators?: OperatorSummary[];
  onSelectOperator?: (name: string) => void;
  onSaveTurno: (operatorName: string, newTurno: string) => void;
}

const OPCOES_TURNO: { id: TipoTurno; label: string; desc: string }[] = [
  { id: 'A', label: 'TURNO A', desc: 'Primeiro Turno Operacional' },
  { id: 'B', label: 'TURNO B', desc: 'Segundo Turno Operacional' },
  { id: 'C', label: 'TURNO C', desc: 'Terceiro Turno Operacional' },
  { id: 'ADM', label: 'TURNO ADM', desc: 'Administrativo / Liderança' },
  { id: 'RANDS', label: 'TURNO RANDS', desc: 'Equipe de Apoio / Rands' },
  { id: 'OUTROS', label: 'OUTROS / GERAL', desc: 'Sem turno fixo ou terceirizado' },
];

export const ModalEditarTurno: React.FC<ModalEditarTurnoProps> = ({
  isOpen,
  onClose,
  operatorName,
  currentTurno,
  allOperators = [],
  onSelectOperator,
  onSaveTurno,
}) => {
  const [selectedName, setSelectedName] = useState<string>(operatorName || '');
  const [searchTerm, setSearchTerm] = useState('');
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    if (operatorName) {
      setSelectedName(operatorName);
      setSuccessMessage(null);
    }
  }, [operatorName, isOpen]);

  // Encontra dados do colaborador selecionado
  const currentOp = useMemo(() => {
    return allOperators.find((op) => (op?.name || "").toUpperCase() === (selectedName || "").toUpperCase());
  }, [allOperators, selectedName]);

  const activeTurno = useMemo(() => {
    if (currentOp?.turno) return currentOp.turno.toUpperCase();
    if (currentTurno && selectedName === operatorName) return (currentTurno || "").toUpperCase();
    return (obterTurnoColaborador(selectedName || "") || "").toUpperCase();
  }, [currentOp, currentTurno, selectedName, operatorName]);

  // Lista de colaboradores filtrada para busca rápida
  const filteredOperatorsList = useMemo(() => {
    if (!searchTerm.trim()) return allOperators.slice(0, 15);
    const term = searchTerm.toLowerCase();
    return allOperators
      .filter((op) => op.name.toLowerCase().includes(term))
      .slice(0, 15);
  }, [allOperators, searchTerm]);

  if (!isOpen) return null;

  const handleApplyTurno = (newTurno: string) => {
    if (!selectedName) return;
    onSaveTurno(selectedName, newTurno);
    setSuccessMessage(`Turno de ${selectedName} alterado com sucesso para Turno ${newTurno}!`);
    setTimeout(() => {
      setSuccessMessage(null);
    }, 2500);
  };

  const activeTurnoStyle = obterEstiloVisualTurno(activeTurno);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-md animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-xl rounded-[28px] bg-white border border-slate-200/90 shadow-2xl overflow-hidden flex flex-col max-h-[90vh] text-slate-800 animate-in zoom-in-95 duration-200"
      >
        {/* Header Superior */}
        <div className="px-6 py-4.5 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-slate-50 via-amber-50/40 to-slate-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500 text-slate-950 flex items-center justify-center shadow-md shadow-amber-500/30">
              <Clock className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900 uppercase tracking-tight flex items-center gap-2">
                Editar Turno do Colaborador
                <Sparkles className="w-4 h-4 text-amber-500" />
              </h3>
              <p className="text-[12px] text-slate-500 font-medium">
                Altere o turno de trabalho para atualizar os rankings e filtros em tempo real
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Corpo do Modal */}
        <div className="p-6 overflow-y-auto space-y-5">
          {/* Card do Colaborador Atual */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 shadow-xs flex items-center justify-between">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-full bg-slate-900 text-amber-400 font-black text-sm flex items-center justify-center shadow-sm shrink-0">
                {currentOp?.rank ? `${currentOp.rank}º` : <User className="w-5 h-5 text-amber-400" />}
              </div>
              <div className="min-w-0">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Colaborador Selecionado
                </span>
                <span className="text-sm font-black text-slate-900 uppercase truncate block">
                  {selectedName || 'NENHUM COLABORADOR'}
                </span>
                {currentOp && (
                  <span className="text-[11px] text-slate-500 font-semibold block mt-0.5">
                    Produtividade: <strong className="text-slate-800">{currentOp.totalProductivity.toLocaleString('pt-BR')}</strong> ordens
                  </span>
                )}
              </div>
            </div>

            <div className="text-right shrink-0">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                Turno Atual
              </span>
              <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider border shadow-xs ${activeTurnoStyle.badgeBg} ${activeTurnoStyle.badgeText} ${activeTurnoStyle.badgeBorder}`}>
                <span className={`w-2 h-2 rounded-full ${activeTurnoStyle.dotColor} animate-pulse`} />
                {activeTurnoStyle.tag}
              </span>
            </div>
          </div>

          {/* Notificação de Sucesso */}
          {successMessage && (
            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs font-bold flex items-center gap-2 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* Opções de Turno para Selecionar */}
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
              Selecione o Novo Turno:
            </label>
            <div className="grid grid-cols-2 gap-2.5">
              {OPCOES_TURNO.map((t) => {
                const style = obterEstiloVisualTurno(t.id);
                const isCurrent = (activeTurno || "").toUpperCase() === (t?.id || "").toUpperCase();

                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => handleApplyTurno(t.id)}
                    className={`p-3.5 rounded-2xl border text-left flex items-center justify-between transition-all cursor-pointer group hover:scale-[1.02] ${
                      isCurrent
                        ? 'border-amber-400 bg-amber-50/60 ring-2 ring-amber-400/40 shadow-md'
                        : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50 shadow-xs'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <span className={`w-3.5 h-3.5 rounded-full ${style.dotColor} shrink-0 shadow-xs`} />
                      <div>
                        <span className="block text-[13px] font-black text-slate-900 tracking-tight">
                          {t.label}
                        </span>
                        <span className="block text-[10.5px] text-slate-500 font-medium">
                          {t.desc}
                        </span>
                      </div>
                    </div>

                    {isCurrent ? (
                      <div className="w-6 h-6 rounded-full bg-amber-500 text-white flex items-center justify-center shadow-xs">
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                      </div>
                    ) : (
                      <div className="w-6 h-6 rounded-full border border-slate-200 group-hover:border-slate-400 transition-colors" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Alternar Colaborador (Busca Rápida) */}
          {allOperators.length > 1 && (
            <div className="pt-3 border-t border-slate-100">
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                Trocar Colaborador para Editar:
              </label>
              <div className="relative mb-2">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Pesquise outro colaborador por nome..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs font-semibold placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:bg-white"
                />
              </div>

              {filteredOperatorsList.length > 0 && (
                <div className="max-h-36 overflow-y-auto custom-scrollbar divide-y divide-slate-100 border border-slate-200 rounded-xl bg-slate-50/50">
                  {filteredOperatorsList.map((op) => {
                    const opTurno = op.turno || obterTurnoColaborador(op.name);
                    const opStyle = obterEstiloVisualTurno(opTurno);
                    const isSelected = (op?.name || "").toUpperCase() === (selectedName || "").toUpperCase();

                    return (
                      <button
                        key={op.name}
                        type="button"
                        onClick={() => {
                          setSelectedName(op.name);
                          onSelectOperator?.(op.name);
                          setSuccessMessage(null);
                        }}
                        className={`w-full px-3 py-1.5 text-left text-xs flex items-center justify-between hover:bg-white transition-colors cursor-pointer ${
                          isSelected ? 'bg-amber-100/70 font-black' : 'text-slate-700'
                        }`}
                      >
                        <span className="truncate pr-2 font-bold uppercase">{op.name}</span>
                        <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase shrink-0 ${opStyle.badgeBg} ${opStyle.badgeText}`}>
                          {opTurno}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-slate-100 bg-slate-50/70 flex items-center justify-between">
          <span className="text-[11px] text-slate-400 font-medium">
            As alterações são salvas e sincronizadas automaticamente.
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-black text-xs uppercase tracking-wider transition-colors cursor-pointer shadow-sm"
          >
            Concluir
          </button>
        </div>
      </div>
    </div>
  );
};
