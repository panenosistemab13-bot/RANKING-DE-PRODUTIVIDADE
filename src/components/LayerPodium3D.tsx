import React from 'react';
import confetti from 'canvas-confetti';
import { OperatorSummary } from '../types';

interface LayerPodium3DProps {
  firstPlace?: OperatorSummary;
  secondPlace?: OperatorSummary;
  thirdPlace?: OperatorSummary;
  onSelectOperator?: (name: string) => void;
  selectedOperator?: string | null;
}

export const LayerPodium3D: React.FC<LayerPodium3DProps> = ({
  firstPlace,
  secondPlace,
  thirdPlace,
  onSelectOperator,
  selectedOperator
}) => {
  const triggerConfetti = (colorType: 'gold' | 'silver' | 'bronze') => {
    const colors =
      colorType === 'gold'
        ? ['#ffd700', '#ffae00', '#ffffff', '#e6a100']
        : colorType === 'silver'
        ? ['#c0c0c0', '#e2e8f0', '#ffffff', '#94a3b8']
        : ['#cd7f32', '#d97706', '#ffffff', '#b45309'];

    confetti({
      particleCount: 50,
      spread: 60,
      origin: { y: 0.5 },
      colors
    });
  };

  const formatNumber = (val?: number) => {
    if (val === undefined || val === null) return '0';
    return val.toLocaleString('pt-BR');
  };

  return (
    <div className="relative w-full h-[410px] flex flex-col items-center justify-end px-2 select-none">
      {/* =========================================================================
          ILUMINAÇÃO DE DESTAQUE CENTRAL (SPOTLIGHT CINEMATOGRÁFICO)
         ========================================================================= */}
      {/* Conical light beam from ceiling shining directly down on the podium */}
      <div className="absolute -top-12 left-1/2 -translate-x-1/2 w-[540px] h-[340px] bg-gradient-to-b from-amber-400/25 via-amber-300/10 to-transparent blur-2xl pointer-events-none rounded-full" />
      
      {/* Golden halo glow behind the 1º place center card */}
      <div className="absolute top-10 left-1/2 -translate-x-1/2 w-80 h-80 bg-amber-400/20 rounded-full blur-3xl pointer-events-none animate-pulse" style={{ animationDuration: '4s' }} />

      {/* Top Banner Tag: PÓDIO DOS CAMPEÕES EM DESTAQUE */}
      <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 flex items-center gap-2 px-5 py-1.5 rounded-full bg-gradient-to-r from-amber-500 via-amber-400 to-amber-600 text-amber-950 font-black text-[11px] tracking-widest uppercase shadow-xl shadow-amber-500/35 border border-white/90 z-20">
        <span className="text-sm">👑</span>
        <span>PÓDIO DE LÍDERES • TOP 3 EM DESTAQUE</span>
        <span className="text-xs text-amber-900">✨</span>
      </div>

      {/* Reflective stage pedestal under the entire podium set */}
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[760px] h-[28px] bg-gradient-to-r from-transparent via-amber-400/30 to-transparent rounded-full blur-lg pointer-events-none" />
      <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-[700px] h-[32px] bg-slate-900/15 rounded-full blur-xl pointer-events-none" />

      {/* Podium Cards Container (Symmetric & Centered) */}
      <div className="flex items-end justify-center gap-4 relative z-10 w-full">
        {/* =========================================================================
            2º LUGAR — PRATA (SILVER)
           ========================================================================= */}
        <div
          onClick={() => {
            if (secondPlace) {
              onSelectOperator?.(secondPlace.name);
              triggerConfetti('silver');
            }
          }}
          className={`group cursor-pointer relative w-[228px] h-[328px] rounded-[32px] overflow-hidden transition-all duration-300 hover:-translate-y-2.5 ${
            selectedOperator === secondPlace?.name
              ? 'ring-4 ring-slate-400 shadow-2xl scale-[1.02]'
              : 'shadow-xl shadow-slate-900/20'
          }`}
          style={{
            background: 'linear-gradient(175deg, rgba(230, 235, 245, 0.96) 0%, rgba(180, 195, 215, 0.92) 100%)',
            boxShadow: '0 25px 60px -12px rgba(20, 35, 60, 0.35), inset 0 2px 3px rgba(255, 255, 255, 0.9), inset 0 -4px 8px rgba(100, 120, 150, 0.4)'
          }}
        >
          {/* Background 3D Render Texture (Subtle metallic depth) */}
          <img
            src="/assets/images/podium_silver.jpg"
            alt="3D Silver Podium"
            referrerPolicy="no-referrer"
            className="absolute inset-0 w-full h-full object-cover opacity-25 mix-blend-luminosity scale-110 pointer-events-none"
          />

          {/* Polished Metallic Bevel & Reflections */}
          <div className="absolute inset-0 border border-white/90 rounded-[32px] pointer-events-none" />
          <div className="absolute top-0 left-0 right-0 h-28 bg-gradient-to-b from-white/80 via-white/25 to-transparent pointer-events-none" />
          <div className="absolute -left-12 top-0 bottom-0 w-24 bg-gradient-to-r from-transparent via-white/50 to-transparent -skew-x-12 pointer-events-none group-hover:translate-x-72 transition-transform duration-1000" />

          {/* Content Overlays */}
          <div className="relative z-10 flex flex-col items-center justify-between h-full px-4 pt-4 pb-4.5 text-center">
            {/* Top Crown & Badge 2º */}
            <div className="flex flex-col items-center">
              {/* Crown Icon */}
              <div className="w-10 h-7 text-slate-300 mb-0.5 filter drop-shadow">
                <svg viewBox="0 0 24 24" className="w-full h-full fill-slate-300 stroke-slate-500 stroke-[1.5]">
                  <path d="M5 16L3 5l5.5 5L12 4l3.5 6L21 5l-2 11H5m14 3c0 .6-.4 1-1 1H6c-.6 0-1-.4-1-1v-1h14v1z" />
                </svg>
              </div>

              {/* 2º Circle Badge */}
              <div className="w-11 h-11 rounded-full bg-gradient-to-br from-white via-slate-200 to-slate-400 border-2 border-white shadow-md flex items-center justify-center">
                <span className="text-xl font-black text-slate-800 tracking-tight">2º</span>
              </div>
            </div>

            {/* Operator Info & Large Productivity Number */}
            <div className="w-full my-auto flex flex-col items-center">
              <span className="text-[14px] font-extrabold text-slate-900 tracking-wide uppercase line-clamp-1 max-w-[200px] drop-shadow-xs">
                {secondPlace?.name || 'GABRIEL YGOR'}
              </span>
              <div className="text-[38px] font-black text-slate-950 tracking-tight leading-none mt-1 font-heading">
                {formatNumber(secondPlace?.totalProductivity ?? 4982)}
              </div>
              <span className="text-[11px] font-semibold text-slate-700 mt-1 uppercase tracking-wider">
                Total de Produtividade
              </span>
            </div>

            {/* Bottom Movements Pill Badge */}
            <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-900/15 backdrop-blur-md border border-white/60 shadow-inner">
              <div className="w-4 h-4 rounded-full bg-slate-700 text-white flex items-center justify-center">
                <span className="text-[9px] font-bold">2</span>
              </div>
              <span className="text-[11.5px] font-bold text-slate-900 tracking-tight">
                {secondPlace?.movements ?? 42} Movimentações
              </span>
            </div>

            {/* Heart Logo Engraved Base Badge */}
            <div className="w-6 h-6 rounded-full bg-slate-800/20 flex items-center justify-center mt-1">
              <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 fill-slate-700">
                <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
              </svg>
            </div>
          </div>
        </div>

        {/* =========================================================================
            1º LUGAR — OURO (GOLD) — ELEVATED & LARGER
           ========================================================================= */}
        <div
          onClick={() => {
            if (firstPlace) {
              onSelectOperator?.(firstPlace.name);
              triggerConfetti('gold');
            }
          }}
          className={`group cursor-pointer relative w-[252px] h-[378px] rounded-[36px] overflow-hidden transition-all duration-300 hover:-translate-y-3 ${
            selectedOperator === firstPlace?.name
              ? 'ring-4 ring-amber-400 shadow-2xl scale-[1.03]'
              : 'shadow-2xl shadow-amber-950/30'
          }`}
          style={{
            background: 'linear-gradient(170deg, #ffeaa7 0%, #ffd043 25%, #e19700 55%, #fbb034 85%, #b77900 100%)',
            boxShadow: '0 30px 75px -12px rgba(180, 110, 0, 0.45), inset 0 2px 4px rgba(255, 255, 255, 0.95), inset 0 -4px 10px rgba(120, 70, 0, 0.5)'
          }}
        >
          {/* Background 3D Render Texture (Luxurious Gold metallic depth) */}
          <img
            src="/assets/images/podium_gold.jpg"
            alt="3D Gold Podium"
            referrerPolicy="no-referrer"
            className="absolute inset-0 w-full h-full object-cover opacity-30 mix-blend-multiply scale-110 pointer-events-none"
          />

          {/* Polished Gold Bevel & Reflections */}
          <div className="absolute inset-0 border-2 border-amber-200/90 rounded-[36px] pointer-events-none" />
          <div className="absolute top-0 left-0 right-0 h-36 bg-gradient-to-b from-white/90 via-amber-100/30 to-transparent pointer-events-none" />
          <div className="absolute -left-16 top-0 bottom-0 w-28 bg-gradient-to-r from-transparent via-white/60 to-transparent -skew-x-12 pointer-events-none group-hover:translate-x-80 transition-transform duration-1000" />

          {/* Content Overlays */}
          <div className="relative z-10 flex flex-col items-center justify-between h-full px-4 pt-4.5 pb-5 text-center">
            {/* Top Crown & Golden Badge 1º */}
            <div className="flex flex-col items-center">
              {/* Royal Golden Crown */}
              <div className="w-13 h-9 text-amber-100 mb-0.5 filter drop-shadow-md">
                <svg viewBox="0 0 24 24" className="w-full h-full fill-amber-300 stroke-amber-800 stroke-[1.5]">
                  <path d="M5 16L3 5l5.5 5L12 4l3.5 6L21 5l-2 11H5m14 3c0 .6-.4 1-1 1H6c-.6 0-1-.4-1-1v-1h14v1z" />
                </svg>
              </div>

              {/* 1º Circular Badge with Laurel feeling */}
              <div className="w-13 h-13 rounded-full bg-gradient-to-b from-white via-amber-100 to-amber-300 border-2 border-white shadow-lg flex items-center justify-center ring-2 ring-amber-500/40">
                <span className="text-2xl font-black text-amber-950 tracking-tight">1º</span>
              </div>
            </div>

            {/* Operator Info & Large Productivity Number */}
            <div className="w-full my-auto flex flex-col items-center">
              <span className="text-[15.5px] font-black text-amber-950 tracking-wide uppercase line-clamp-1 max-w-[220px] drop-shadow-xs">
                {firstPlace?.name || 'LUAN MARTINS'}
              </span>
              <div className="text-[44px] font-black text-amber-950 tracking-tight leading-none mt-1 font-heading drop-shadow-sm">
                {formatNumber(firstPlace?.totalProductivity ?? 5234)}
              </div>
              <span className="text-[11.5px] font-extrabold text-amber-950/80 mt-1 uppercase tracking-wider">
                Total de Produtividade
              </span>
            </div>

            {/* Bottom Movements Pill Badge */}
            <div className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-black/15 backdrop-blur-md border border-white/70 shadow-inner">
              <div className="w-4 h-4 rounded-full bg-amber-900 text-amber-100 flex items-center justify-center">
                <span className="text-[9px] font-bold">1</span>
              </div>
              <span className="text-[12px] font-extrabold text-amber-950 tracking-tight">
                {firstPlace?.movements ?? 48} Movimentações
              </span>
            </div>

            {/* Heart Logo Engraved Base Badge */}
            <div className="w-7 h-7 rounded-full bg-amber-900/20 flex items-center justify-center mt-1">
              <svg viewBox="0 0 24 24" className="w-4 h-4 fill-amber-900">
                <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
              </svg>
            </div>
          </div>
        </div>

        {/* =========================================================================
            3º LUGAR — BRONZE
           ========================================================================= */}
        <div
          onClick={() => {
            if (thirdPlace) {
              onSelectOperator?.(thirdPlace.name);
              triggerConfetti('bronze');
            }
          }}
          className={`group cursor-pointer relative w-[220px] h-[308px] rounded-[32px] overflow-hidden transition-all duration-300 hover:-translate-y-2.5 ${
            selectedOperator === thirdPlace?.name
              ? 'ring-4 ring-amber-700 shadow-2xl scale-[1.02]'
              : 'shadow-xl shadow-amber-950/20'
          }`}
          style={{
            background: 'linear-gradient(175deg, #fad2b5 0%, #e29054 30%, #c4682c 60%, #9e4b1a 100%)',
            boxShadow: '0 25px 60px -12px rgba(120, 50, 10, 0.35), inset 0 2px 3px rgba(255, 255, 255, 0.85), inset 0 -4px 8px rgba(70, 25, 5, 0.4)'
          }}
        >
          {/* Background 3D Render Texture (Bronze/Copper metallic depth) */}
          <img
            src="/assets/images/podium_bronze.jpg"
            alt="3D Bronze Podium"
            referrerPolicy="no-referrer"
            className="absolute inset-0 w-full h-full object-cover opacity-25 mix-blend-multiply scale-110 pointer-events-none"
          />

          {/* Polished Bronze Bevel & Reflections */}
          <div className="absolute inset-0 border border-orange-200/80 rounded-[32px] pointer-events-none" />
          <div className="absolute top-0 left-0 right-0 h-28 bg-gradient-to-b from-white/75 via-orange-100/20 to-transparent pointer-events-none" />
          <div className="absolute -left-12 top-0 bottom-0 w-24 bg-gradient-to-r from-transparent via-white/50 to-transparent -skew-x-12 pointer-events-none group-hover:translate-x-72 transition-transform duration-1000" />

          {/* Content Overlays */}
          <div className="relative z-10 flex flex-col items-center justify-between h-full px-4 pt-3.5 pb-4 text-center">
            {/* Top Crown & Badge 3º */}
            <div className="flex flex-col items-center">
              {/* Crown Icon */}
              <div className="w-9 h-6.5 text-orange-200 mb-0.5 filter drop-shadow">
                <svg viewBox="0 0 24 24" className="w-full h-full fill-orange-300 stroke-orange-800 stroke-[1.5]">
                  <path d="M5 16L3 5l5.5 5L12 4l3.5 6L21 5l-2 11H5m14 3c0 .6-.4 1-1 1H6c-.6 0-1-.4-1-1v-1h14v1z" />
                </svg>
              </div>

              {/* 3º Circle Badge */}
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-white via-orange-100 to-orange-300 border-2 border-white shadow-md flex items-center justify-center">
                <span className="text-lg font-black text-amber-950 tracking-tight">3º</span>
              </div>
            </div>

            {/* Operator Info & Large Productivity Number */}
            <div className="w-full my-auto flex flex-col items-center">
              <span className="text-[13.5px] font-extrabold text-amber-950 tracking-wide uppercase line-clamp-1 max-w-[190px] drop-shadow-xs">
                {thirdPlace?.name || 'MARCELINO RIBEIRO'}
              </span>
              <div className="text-[36px] font-black text-amber-950 tracking-tight leading-none mt-1 font-heading">
                {formatNumber(thirdPlace?.totalProductivity ?? 4761)}
              </div>
              <span className="text-[10.5px] font-semibold text-amber-950/80 mt-1 uppercase tracking-wider">
                Total de Produtividade
              </span>
            </div>

            {/* Bottom Movements Pill Badge */}
            <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-black/15 backdrop-blur-md border border-white/60 shadow-inner">
              <div className="w-4 h-4 rounded-full bg-amber-950 text-white flex items-center justify-center">
                <span className="text-[9px] font-bold">3</span>
              </div>
              <span className="text-[11.5px] font-bold text-amber-950 tracking-tight">
                {thirdPlace?.movements ?? 39} Movimentações
              </span>
            </div>

            {/* Heart Logo Engraved Base Badge */}
            <div className="w-6 h-6 rounded-full bg-amber-950/20 flex items-center justify-center mt-1">
              <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 fill-amber-950">
                <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
              </svg>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
