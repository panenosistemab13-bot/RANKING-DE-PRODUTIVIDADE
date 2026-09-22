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

// 3D Laurel Wreath Medallion Component
const LaurelMedallion: React.FC<{
  rank: '1º' | '2º' | '3º';
  type: 'gold' | 'silver' | 'bronze';
}> = ({ rank, type }) => {
  const isGold = type === 'gold';
  const isSilver = type === 'silver';

  const strokeColor = isGold ? '#b45309' : isSilver ? '#475569' : '#7c2d12';
  const leafFill = isGold ? 'url(#goldLeafGrad)' : isSilver ? 'url(#silverLeafGrad)' : 'url(#bronzeLeafGrad)';
  const badgeBg = isGold
    ? 'bg-gradient-to-b from-amber-100 via-amber-200 to-amber-400 border-amber-300 text-amber-950 shadow-amber-500/40'
    : isSilver
    ? 'bg-gradient-to-b from-slate-100 via-slate-200 to-slate-400 border-slate-300 text-slate-900 shadow-slate-500/30'
    : 'bg-gradient-to-b from-orange-100 via-orange-200 to-amber-600 border-orange-300 text-amber-950 shadow-orange-600/30';

  return (
    <div className="relative flex items-center justify-center">
      {/* Laurel Wreath SVG */}
      <svg
        viewBox="0 0 100 80"
        className={`absolute pointer-events-none ${isGold ? 'w-24 h-20 -top-2' : 'w-20 h-18 -top-1.5'}`}
      >
        <defs>
          <linearGradient id="goldLeafGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#fef08a" />
            <stop offset="50%" stopColor="#f59e0b" />
            <stop offset="100%" stopColor="#b45309" />
          </linearGradient>
          <linearGradient id="silverLeafGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="50%" stopColor="#94a3b8" />
            <stop offset="100%" stopColor="#475569" />
          </linearGradient>
          <linearGradient id="bronzeLeafGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#fed7aa" />
            <stop offset="50%" stopColor="#ea580c" />
            <stop offset="100%" stopColor="#7c2d12" />
          </linearGradient>
        </defs>

        {/* Left Laurel Branch */}
        <g stroke={strokeColor} strokeWidth="1" strokeLinecap="round" fill={leafFill}>
          {/* Main Stem */}
          <path d="M 28 68 C 18 52, 16 32, 28 14" fill="none" strokeWidth="1.8" />
          {/* Leaves */}
          <path d="M 26 62 Q 16 60 20 54 Q 24 58 26 62 Z" />
          <path d="M 22 52 Q 10 48 16 42 Q 22 46 22 52 Z" />
          <path d="M 19 41 Q 8 36 15 30 Q 20 35 19 41 Z" />
          <path d="M 20 30 Q 11 23 18 18 Q 23 23 20 30 Z" />
          <path d="M 25 20 Q 20 12 28 8 Q 30 16 25 20 Z" />
          {/* Inner small leaves */}
          <path d="M 26 56 Q 32 50 28 44 Q 24 48 26 56 Z" />
          <path d="M 24 45 Q 30 38 27 33 Q 23 37 24 45 Z" />
          <path d="M 24 34 Q 31 27 28 22 Q 24 26 24 34 Z" />
        </g>

        {/* Right Laurel Branch */}
        <g stroke={strokeColor} strokeWidth="1" strokeLinecap="round" fill={leafFill}>
          {/* Main Stem */}
          <path d="M 72 68 C 82 52, 84 32, 72 14" fill="none" strokeWidth="1.8" />
          {/* Leaves */}
          <path d="M 74 62 Q 84 60 80 54 Q 76 58 74 62 Z" />
          <path d="M 78 52 Q 90 48 84 42 Q 78 46 78 52 Z" />
          <path d="M 81 41 Q 92 36 85 30 Q 80 35 81 41 Z" />
          <path d="M 80 30 Q 89 23 82 18 Q 77 23 80 30 Z" />
          <path d="M 75 20 Q 80 12 72 8 Q 70 16 75 20 Z" />
          {/* Inner small leaves */}
          <path d="M 74 56 Q 68 50 72 44 Q 76 48 74 56 Z" />
          <path d="M 76 45 Q 70 38 73 33 Q 77 37 76 45 Z" />
          <path d="M 76 34 Q 69 27 72 22 Q 76 26 76 34 Z" />
        </g>

        {/* Bottom Ribbon Bow */}
        <path
          d="M 44 68 C 47 65, 53 65, 56 68 C 53 71, 47 71, 44 68 Z"
          fill={leafFill}
          stroke={strokeColor}
          strokeWidth="1"
        />
      </svg>

      {/* Center Rank Circle */}
      <div
        className={`relative z-10 rounded-full border-2 shadow-lg flex items-center justify-center font-heading font-black ${badgeBg} ${
          isGold ? 'w-13 h-13 text-[22px]' : 'w-11 h-11 text-[19px]'
        }`}
      >
        <span>{rank}</span>
      </div>
    </div>
  );
};

// 3D Crown Component
const Crown3D: React.FC<{ type: 'gold' | 'silver' | 'bronze' }> = ({ type }) => {
  const isGold = type === 'gold';
  const isSilver = type === 'silver';

  return (
    <div className={`relative ${isGold ? 'w-14 h-9 -mb-1' : 'w-11 h-7.5 -mb-0.5'} filter drop-shadow-md`}>
      <svg viewBox="0 0 48 32" className="w-full h-full">
        <defs>
          <linearGradient id={`crownGrad-${type}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={isGold ? '#fffbeb' : isSilver ? '#f8fafc' : '#ffedd5'} />
            <stop offset="40%" stopColor={isGold ? '#f59e0b' : isSilver ? '#94a3b8' : '#ea580c'} />
            <stop offset="100%" stopColor={isGold ? '#b45309' : isSilver ? '#475569' : '#9a3412'} />
          </linearGradient>
        </defs>

        {/* Crown Body with 5 Peaks */}
        <path
          d="M 6 26 L 4 10 L 14 18 L 24 5 L 34 18 L 44 10 L 42 26 Z"
          fill={`url(#crownGrad-${type})`}
          stroke={isGold ? '#92400e' : isSilver ? '#334155' : '#7c2d12'}
          strokeWidth="1.2"
          strokeLinejoin="round"
        />
        {/* Crown Base Rim */}
        <rect
          x="5"
          y="25"
          width="38"
          height="4"
          rx="2"
          fill={isGold ? '#fef08a' : isSilver ? '#e2e8f0' : '#fed7aa'}
          stroke={isGold ? '#92400e' : isSilver ? '#334155' : '#7c2d12'}
          strokeWidth="1"
        />
        {/* Pearls on peaks */}
        <circle cx="4" cy="9" r="2.2" fill="#ffffff" stroke={isGold ? '#b45309' : '#475569'} strokeWidth="0.8" />
        <circle cx="14" cy="17" r="2" fill="#ffffff" stroke={isGold ? '#b45309' : '#475569'} strokeWidth="0.8" />
        <circle cx="24" cy="4.5" r="2.8" fill="#ffffff" stroke={isGold ? '#b45309' : '#475569'} strokeWidth="0.8" />
        <circle cx="34" cy="17" r="2" fill="#ffffff" stroke={isGold ? '#b45309' : '#475569'} strokeWidth="0.8" />
        <circle cx="44" cy="9" r="2.2" fill="#ffffff" stroke={isGold ? '#b45309' : '#475569'} strokeWidth="0.8" />

        {/* Center Jewel */}
        <polygon
          points="24,14 27,20 24,24 21,20"
          fill={isGold ? '#ef4444' : isSilver ? '#38bdf8' : '#eab308'}
          stroke="#ffffff"
          strokeWidth="0.5"
        />
      </svg>
    </div>
  );
};

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
    <div className="relative w-full h-[395px] flex flex-col items-center justify-end px-2 select-none">
      {/* =========================================================================
          ILUMINAÇÃO DE DESTAQUE CENTRAL (SPOTLIGHT CINEMATOGRÁFICO)
         ========================================================================= */}
      {/* Conical light beam from ceiling shining directly down on the podium */}
      <div className="absolute -top-10 left-1/2 -translate-x-1/2 w-[580px] h-[340px] bg-gradient-to-b from-amber-400/20 via-amber-300/10 to-transparent blur-2xl pointer-events-none rounded-full" />

      {/* Golden halo glow behind the 1º place center card */}
      <div
        className="absolute top-8 left-1/2 -translate-x-1/2 w-88 h-88 bg-amber-400/25 rounded-full blur-3xl pointer-events-none animate-pulse"
        style={{ animationDuration: '4s' }}
      />

      {/* Circular Stage Pedestal Disk on Tabletop */}
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[820px] h-[36px] rounded-[100%] bg-gradient-to-r from-amber-200/20 via-amber-300/40 to-amber-200/20 blur-md pointer-events-none" />
      <div className="absolute bottom-1 left-1/2 -translate-x-1/2 w-[760px] h-[26px] rounded-[100%] border border-amber-300/60 bg-gradient-to-b from-white/60 to-amber-100/20 shadow-lg pointer-events-none" />

      {/* Podium Cards Container (Symmetric & Centered) */}
      <div className="flex items-end justify-center gap-4 relative z-10 w-full mb-1">
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
            background: 'linear-gradient(175deg, #f8fafc 0%, #e2e8f0 30%, #cbd5e1 70%, #94a3b8 100%)',
            boxShadow:
              '0 25px 60px -12px rgba(20, 35, 60, 0.35), inset 0 2px 3px rgba(255, 255, 255, 0.9), inset 0 -4px 8px rgba(100, 120, 150, 0.4)'
          }}
        >
          {/* Background 3D Render Texture (Subtle metallic depth) */}
          <img
            src="/assets/images/podium_silver.jpg"
            alt="3D Silver Podium"
            referrerPolicy="no-referrer"
            className="absolute inset-0 w-full h-full object-cover opacity-20 mix-blend-luminosity scale-110 pointer-events-none"
          />

          {/* Polished Metallic Bevel & Reflections */}
          <div className="absolute inset-0 border-2 border-white/90 rounded-[32px] pointer-events-none" />
          <div className="absolute top-0 left-0 right-0 h-28 bg-gradient-to-b from-white/80 via-white/25 to-transparent pointer-events-none" />
          <div className="absolute -left-12 top-0 bottom-0 w-24 bg-gradient-to-r from-transparent via-white/50 to-transparent -skew-x-12 pointer-events-none group-hover:translate-x-72 transition-transform duration-1000" />

          {/* Content Overlays */}
          <div className="relative z-10 flex flex-col items-center justify-between h-full px-4 pt-3 pb-3.5 text-center">
            {/* Crown + Laurel Medallion */}
            <div className="flex flex-col items-center">
              <Crown3D type="silver" />
              <LaurelMedallion rank="2º" type="silver" />
            </div>

            {/* Operator Info & Large Productivity Number */}
            <div className="w-full my-auto flex flex-col items-center">
              <span className="text-[13.5px] font-black text-slate-900 tracking-wide uppercase line-clamp-1 max-w-[200px] drop-shadow-xs">
                {secondPlace?.name || '—'}
              </span>
              <div className="text-[38px] font-black text-slate-950 tracking-tight leading-none mt-1 font-heading">
                {formatNumber(secondPlace?.totalProductivity ?? 0)}
              </div>
              <span className="text-[10.5px] font-bold text-slate-600 mt-1 uppercase tracking-wider">
                Total de Produtividade
              </span>
            </div>

            {/* Bottom Movements Pill Badge */}
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-900/15 backdrop-blur-md border border-white/60 shadow-inner">
              <span className="w-4 h-4 rounded-full bg-slate-700 text-white font-bold text-[9px] flex items-center justify-center">
                2
              </span>
              <span className="text-[11px] font-black text-slate-900 tracking-tight">
                {secondPlace?.movements ?? 0} Movimentações
              </span>
              <svg viewBox="0 0 24 24" className="w-3 h-3 fill-red-600 ml-0.5">
                <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
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
          className={`group cursor-pointer relative w-[252px] h-[375px] rounded-[36px] overflow-hidden transition-all duration-300 hover:-translate-y-3 ${
            selectedOperator === firstPlace?.name
              ? 'ring-4 ring-amber-400 shadow-2xl scale-[1.03]'
              : 'shadow-2xl shadow-amber-950/30'
          }`}
          style={{
            background:
              'linear-gradient(170deg, #fffbeb 0%, #fef08a 20%, #f59e0b 50%, #d97706 80%, #b45309 100%)',
            boxShadow:
              '0 30px 75px -12px rgba(180, 110, 0, 0.45), inset 0 2px 4px rgba(255, 255, 255, 0.95), inset 0 -4px 10px rgba(120, 70, 0, 0.5)'
          }}
        >
          {/* Background 3D Render Texture (Luxurious Gold metallic depth) */}
          <img
            src="/assets/images/podium_gold.jpg"
            alt="3D Gold Podium"
            referrerPolicy="no-referrer"
            className="absolute inset-0 w-full h-full object-cover opacity-25 mix-blend-multiply scale-110 pointer-events-none"
          />

          {/* Polished Gold Bevel & Reflections */}
          <div className="absolute inset-0 border-2 border-amber-200/90 rounded-[36px] pointer-events-none" />
          <div className="absolute top-0 left-0 right-0 h-36 bg-gradient-to-b from-white/90 via-amber-100/30 to-transparent pointer-events-none" />
          <div className="absolute -left-16 top-0 bottom-0 w-28 bg-gradient-to-r from-transparent via-white/60 to-transparent -skew-x-12 pointer-events-none group-hover:translate-x-80 transition-transform duration-1000" />

          {/* Content Overlays */}
          <div className="relative z-10 flex flex-col items-center justify-between h-full px-4 pt-3.5 pb-4 text-center">
            {/* Crown + Laurel Medallion 1º */}
            <div className="flex flex-col items-center">
              <Crown3D type="gold" />
              <LaurelMedallion rank="1º" type="gold" />
            </div>

            {/* Operator Info & Large Productivity Number */}
            <div className="w-full my-auto flex flex-col items-center">
              <span className="text-[15px] font-black text-amber-950 tracking-wide uppercase line-clamp-1 max-w-[220px] drop-shadow-xs">
                {firstPlace?.name || '—'}
              </span>
              <div className="text-[44px] font-black text-amber-950 tracking-tight leading-none mt-1 font-heading drop-shadow-xs">
                {formatNumber(firstPlace?.totalProductivity ?? 0)}
              </div>
              <span className="text-[11px] font-black text-amber-950/80 mt-1 uppercase tracking-wider">
                Total de Produtividade
              </span>
            </div>

            {/* Bottom Movements Pill Badge */}
            <div className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-black/15 backdrop-blur-md border border-white/70 shadow-inner">
              <span className="w-4 h-4 rounded-full bg-amber-900 text-amber-100 font-bold text-[9px] flex items-center justify-center">
                1
              </span>
              <span className="text-[12px] font-black text-amber-950 tracking-tight">
                {firstPlace?.movements ?? 0} Movimentações
              </span>
              <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 fill-red-600 ml-0.5">
                <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
              </svg>
            </div>
          </div>
        </div>

        {/* =========================================================================
            3º LUGAR — BRONZE
           ========================================================================= */}
        <div className="relative">
          <div
            onClick={() => {
              if (thirdPlace) {
                onSelectOperator?.(thirdPlace.name);
                triggerConfetti('bronze');
              }
            }}
            className={`group cursor-pointer relative w-[220px] h-[312px] rounded-[32px] overflow-hidden transition-all duration-300 hover:-translate-y-2.5 ${
              selectedOperator === thirdPlace?.name
                ? 'ring-4 ring-amber-700 shadow-2xl scale-[1.02]'
                : 'shadow-xl shadow-amber-950/20'
            }`}
            style={{
              background: 'linear-gradient(175deg, #ffedd5 0%, #fed7aa 25%, #ea580c 65%, #9a3412 100%)',
              boxShadow:
                '0 25px 60px -12px rgba(120, 50, 10, 0.35), inset 0 2px 3px rgba(255, 255, 255, 0.85), inset 0 -4px 8px rgba(70, 25, 5, 0.4)'
            }}
          >
            {/* Background 3D Render Texture (Bronze/Copper metallic depth) */}
            <img
              src="/assets/images/podium_bronze.jpg"
              alt="3D Bronze Podium"
              referrerPolicy="no-referrer"
              className="absolute inset-0 w-full h-full object-cover opacity-20 mix-blend-multiply scale-110 pointer-events-none"
            />

            {/* Polished Bronze Bevel & Reflections */}
            <div className="absolute inset-0 border-2 border-orange-200/80 rounded-[32px] pointer-events-none" />
            <div className="absolute top-0 left-0 right-0 h-28 bg-gradient-to-b from-white/75 via-orange-100/20 to-transparent pointer-events-none" />
            <div className="absolute -left-12 top-0 bottom-0 w-24 bg-gradient-to-r from-transparent via-white/50 to-transparent -skew-x-12 pointer-events-none group-hover:translate-x-72 transition-transform duration-1000" />

            {/* Content Overlays */}
            <div className="relative z-10 flex flex-col items-center justify-between h-full px-4 pt-3 pb-3 text-center">
              {/* Crown + Laurel Medallion 3º */}
              <div className="flex flex-col items-center">
                <Crown3D type="bronze" />
                <LaurelMedallion rank="3º" type="bronze" />
              </div>

              {/* Operator Info & Large Productivity Number */}
              <div className="w-full my-auto flex flex-col items-center">
                <span className="text-[13px] font-black text-amber-950 tracking-wide uppercase line-clamp-1 max-w-[190px] drop-shadow-xs">
                  {thirdPlace?.name || '—'}
                </span>
                <div className="text-[36px] font-black text-amber-950 tracking-tight leading-none mt-1 font-heading">
                  {formatNumber(thirdPlace?.totalProductivity ?? 0)}
                </div>
                <span className="text-[10px] font-bold text-amber-950/80 mt-1 uppercase tracking-wider">
                  Total de Produtividade
                </span>
              </div>

              {/* Bottom Movements Pill Badge */}
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/15 backdrop-blur-md border border-white/60 shadow-inner">
                <span className="w-4 h-4 rounded-full bg-amber-950 text-white font-bold text-[9px] flex items-center justify-center">
                  3
                </span>
                <span className="text-[11px] font-black text-amber-950 tracking-tight">
                  {thirdPlace?.movements ?? 0} Movimentações
                </span>
                <svg viewBox="0 0 24 24" className="w-3 h-3 fill-red-600 ml-0.5">
                  <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                </svg>
              </div>
            </div>
          </div>

          {/* 3 Corações Coffee Cup Sitting on the Pedestal (Right of Bronze Podium) */}
          <div className="absolute -right-16 bottom-0 flex flex-col items-center pointer-events-none drop-shadow-xl z-20">
            {/* Steam wisps */}
            <div className="relative w-8 h-8 -mb-2 opacity-60">
              <div className="absolute left-2 w-1.5 h-5 bg-gradient-to-t from-white to-transparent rounded-full animate-pulse blur-xs" />
              <div className="absolute left-4 w-1.5 h-6 bg-gradient-to-t from-white to-transparent rounded-full animate-pulse blur-xs delay-300" />
            </div>

            {/* Cup & Saucer */}
            <div className="relative flex flex-col items-center">
              {/* Cup */}
              <div className="relative w-12 h-10 rounded-b-2xl bg-gradient-to-b from-slate-900 via-slate-800 to-black border border-amber-500/40 shadow-md flex items-center justify-center overflow-hidden">
                {/* Gold rim */}
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-300 via-amber-100 to-amber-400" />
                {/* Red 3 Corações Heart */}
                <div className="w-5 h-5 rounded-full bg-red-600 flex items-center justify-center shadow-xs">
                  <svg viewBox="0 0 24 24" className="w-3 h-3 fill-white">
                    <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                  </svg>
                </div>
                {/* Handle */}
                <div className="absolute -right-2 top-2 w-3.5 h-6 rounded-r-full border-2 border-slate-700 bg-transparent" />
              </div>
              {/* Saucer */}
              <div className="w-16 h-2 rounded-full bg-gradient-to-r from-slate-800 via-slate-700 to-slate-900 border-t border-amber-400/40 -mt-0.5 shadow-md" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
