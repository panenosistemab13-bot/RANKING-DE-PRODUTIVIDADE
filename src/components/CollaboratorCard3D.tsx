import React from 'react';
import confetti from 'canvas-confetti';
import { OperatorSummary } from '../types';

interface CollaboratorCard3DProps {
  operator: OperatorSummary;
  rank: number; // 1 to 69
  size?: 'normal' | 'large' | 'compact';
  isHighlighted?: boolean;
  onClick?: () => void;
  showConfettiOnClick?: boolean;
}

export const CollaboratorCard3D: React.FC<CollaboratorCard3DProps> = ({
  operator,
  rank,
  size = 'normal',
  isHighlighted = false,
  onClick,
  showConfettiOnClick = true
}) => {
  const formatNumber = (val?: number) => {
    if (val === undefined || val === null) return '0';
    return val.toLocaleString('pt-BR');
  };

  const triggerConfetti = (tier: string) => {
    if (!showConfettiOnClick) return;
    const colors =
      tier === 'gold'
        ? ['#ffd700', '#ffae00', '#ffffff', '#e6a100']
        : tier === 'silver'
        ? ['#c0c0c0', '#e2e8f0', '#ffffff', '#94a3b8']
        : tier === 'bronze'
        ? ['#cd7f32', '#d97706', '#ffffff', '#b45309']
        : ['#f59e0b', '#3b82f6', '#10b981', '#ffffff'];

    confetti({
      particleCount: 50,
      spread: 60,
      origin: { y: 0.5 },
      colors
    });
  };

  // Determine styling theme based on rank (1º = Ouro, 2º = Prata, 3º = Bronze, 4-10 = Platina, 11-30 = Titânio, 31-69 = Aço Nobre)
  const getTheme = () => {
    if (rank === 1) {
      return {
        type: 'gold',
        bgImage: '/assets/images/podium_gold.jpg',
        background: 'linear-gradient(170deg, #ffeaa7 0%, #ffd043 25%, #e19700 55%, #fbb034 85%, #b77900 100%)',
        boxShadow: '0 30px 75px -12px rgba(180, 110, 0, 0.45), inset 0 2px 4px rgba(255, 255, 255, 0.95), inset 0 -4px 10px rgba(120, 70, 0, 0.5)',
        border: 'border-2 border-amber-200/90',
        textColor: 'text-amber-950',
        subTextColor: 'text-amber-950/80',
        badgeBg: 'bg-gradient-to-b from-white via-amber-100 to-amber-300 ring-2 ring-amber-500/40 text-amber-950',
        crownColor: 'text-amber-100 fill-amber-300 stroke-amber-800',
        pillBg: 'bg-black/15 border-white/70 text-amber-950',
        heartColor: 'fill-amber-900',
        tagText: 'CAMPEÃO GERAL SAGA'
      };
    }
    if (rank === 2) {
      return {
        type: 'silver',
        bgImage: '/assets/images/podium_silver.jpg',
        background: 'linear-gradient(175deg, rgba(235, 240, 250, 0.98) 0%, rgba(190, 205, 225, 0.94) 100%)',
        boxShadow: '0 25px 60px -12px rgba(20, 35, 60, 0.35), inset 0 2px 3px rgba(255, 255, 255, 0.9), inset 0 -4px 8px rgba(100, 120, 150, 0.4)',
        border: 'border-2 border-white/95',
        textColor: 'text-slate-900',
        subTextColor: 'text-slate-700',
        badgeBg: 'bg-gradient-to-br from-white via-slate-200 to-slate-400 text-slate-800 ring-2 ring-slate-400/40',
        crownColor: 'text-slate-300 fill-slate-300 stroke-slate-500',
        pillBg: 'bg-slate-900/15 border-white/60 text-slate-900',
        heartColor: 'fill-slate-700',
        tagText: 'VICE-CAMPEÃO SAGA'
      };
    }
    if (rank === 3) {
      return {
        type: 'bronze',
        bgImage: '/assets/images/podium_bronze.jpg',
        background: 'linear-gradient(175deg, #fad2b5 0%, #e29054 30%, #c4682c 60%, #9e4b1a 100%)',
        boxShadow: '0 25px 60px -12px rgba(120, 50, 10, 0.35), inset 0 2px 3px rgba(255, 255, 255, 0.85), inset 0 -4px 8px rgba(70, 25, 5, 0.4)',
        border: 'border-2 border-orange-200/80',
        textColor: 'text-amber-950',
        subTextColor: 'text-amber-950/80',
        badgeBg: 'bg-gradient-to-br from-white via-orange-100 to-orange-300 text-amber-950 ring-2 ring-orange-500/40',
        crownColor: 'text-orange-200 fill-orange-300 stroke-orange-800',
        pillBg: 'bg-black/15 border-white/60 text-amber-950',
        heartColor: 'fill-amber-950',
        tagText: '3º LUGAR NO PÓDIO'
      };
    }
    if (rank <= 10) {
      return {
        type: 'platinum',
        bgImage: '/assets/images/podium_silver_3d_1789801618423.jpg',
        background: 'linear-gradient(175deg, #e0f2fe 0%, #bae6fd 25%, #7dd3fc 60%, #0284c7 100%)',
        boxShadow: '0 25px 60px -12px rgba(2, 132, 199, 0.35), inset 0 2px 3px rgba(255, 255, 255, 0.9), inset 0 -4px 8px rgba(3, 105, 161, 0.4)',
        border: 'border-2 border-sky-200/90',
        textColor: 'text-sky-950',
        subTextColor: 'text-sky-900/80',
        badgeBg: 'bg-gradient-to-br from-white via-sky-100 to-sky-300 text-sky-950 ring-2 ring-sky-500/40',
        crownColor: 'text-sky-200 fill-sky-300 stroke-sky-800',
        pillBg: 'bg-black/15 border-white/70 text-sky-950',
        heartColor: 'fill-sky-900',
        tagText: 'TOP 10 ELITE SAGA'
      };
    }
    if (rank <= 30) {
      return {
        type: 'titanium',
        bgImage: '/assets/images/podium_gold_3d_1789801603923.jpg',
        background: 'linear-gradient(175deg, #fef3c7 0%, #fde68a 25%, #f59e0b 65%, #b45309 100%)',
        boxShadow: '0 25px 60px -12px rgba(180, 83, 9, 0.35), inset 0 2px 3px rgba(255, 255, 255, 0.9), inset 0 -4px 8px rgba(146, 64, 14, 0.4)',
        border: 'border-2 border-amber-200/90',
        textColor: 'text-amber-950',
        subTextColor: 'text-amber-900/80',
        badgeBg: 'bg-gradient-to-br from-white via-amber-100 to-amber-300 text-amber-950 ring-2 ring-amber-500/40',
        crownColor: 'text-amber-200 fill-amber-300 stroke-amber-800',
        pillBg: 'bg-black/15 border-white/70 text-amber-950',
        heartColor: 'fill-amber-900',
        tagText: 'ALTA PERFORMANCE SAGA'
      };
    }
    return {
      type: 'steel',
      bgImage: '/assets/images/podium_bronze_3d_1789801631719.jpg',
      background: 'linear-gradient(175deg, #f1f5f9 0%, #cbd5e1 30%, #94a3b8 70%, #64748b 100%)',
      boxShadow: '0 25px 60px -12px rgba(51, 65, 85, 0.35), inset 0 2px 3px rgba(255, 255, 255, 0.9), inset 0 -4px 8px rgba(71, 85, 105, 0.4)',
      border: 'border-2 border-slate-200/90',
      textColor: 'text-slate-900',
      subTextColor: 'text-slate-800/80',
      badgeBg: 'bg-gradient-to-br from-white via-slate-200 to-slate-400 text-slate-900 ring-2 ring-slate-500/40',
      crownColor: 'text-slate-300 fill-slate-300 stroke-slate-600',
      pillBg: 'bg-black/15 border-white/70 text-slate-900',
      heartColor: 'fill-slate-800',
      tagText: 'EQUIPE OPERACIONAL SAGA'
    };
  };

  const theme = getTheme();

  // Dimensions based on size
  const dimensions =
    size === 'large'
      ? { w: 'w-[310px]', h: 'h-[440px]', crownW: 'w-14 h-10', badge: 'w-14 h-14 text-2xl', prodText: 'text-[48px]', nameText: 'text-[17px]' }
      : size === 'compact'
      ? { w: 'w-[200px]', h: 'h-[290px]', crownW: 'w-8 h-6', badge: 'w-9 h-9 text-base', prodText: 'text-[32px]', nameText: 'text-[12px]' }
      : { w: 'w-[252px]', h: 'h-[378px]', crownW: 'w-12 h-8', badge: 'w-12 h-12 text-xl', prodText: 'text-[42px]', nameText: 'text-[15px]' };

  return (
    <div
      onClick={() => {
        onClick?.();
        triggerConfetti(theme.type);
      }}
      className={`group cursor-pointer relative ${dimensions.w} ${dimensions.h} rounded-[36px] overflow-hidden transition-all duration-300 select-none hover:-translate-y-2.5 ${
        isHighlighted
          ? 'ring-4 ring-amber-400 scale-[1.03] shadow-2xl'
          : 'hover:shadow-2xl'
      }`}
      style={{
        background: theme.background,
        boxShadow: theme.boxShadow
      }}
    >
      {/* 3D Texture background image */}
      <img
        src={theme.bgImage}
        alt={`Podium rank ${rank}`}
        referrerPolicy="no-referrer"
        className="absolute inset-0 w-full h-full object-cover opacity-28 mix-blend-multiply scale-110 pointer-events-none"
      />

      {/* Polished Metallic Bevel & Reflections */}
      <div className={`absolute inset-0 ${theme.border} rounded-[36px] pointer-events-none`} />
      <div className="absolute top-0 left-0 right-0 h-36 bg-gradient-to-b from-white/90 via-white/20 to-transparent pointer-events-none" />
      <div className="absolute -left-16 top-0 bottom-0 w-28 bg-gradient-to-r from-transparent via-white/60 to-transparent -skew-x-12 pointer-events-none group-hover:translate-x-96 transition-transform duration-1000" />

      {/* Content Overlays */}
      <div className="relative z-10 flex flex-col items-center justify-between h-full px-4 pt-4 pb-4.5 text-center">
        {/* Top Crown & Rank Badge */}
        <div className="flex flex-col items-center">
          {/* Crown SVG */}
          <div className={`${dimensions.crownW} mb-0.5 filter drop-shadow-md`}>
            <svg viewBox="0 0 24 24" className={`w-full h-full ${theme.crownColor} stroke-[1.5]`}>
              <path d="M5 16L3 5l5.5 5L12 4l3.5 6L21 5l-2 11H5m14 3c0 .6-.4 1-1 1H6c-.6 0-1-.4-1-1v-1h14v1z" />
            </svg>
          </div>

          {/* Position Badge (1º, 2º, 3º, 4º...) */}
          <div className={`${dimensions.badge} rounded-full border-2 border-white shadow-lg flex items-center justify-center font-black tracking-tight ${theme.badgeBg}`}>
            {rank}º
          </div>
        </div>

        {/* Operator Name & Large Productivity Number */}
        <div className="w-full my-auto flex flex-col items-center">
          <span className={`${dimensions.nameText} font-black tracking-wide uppercase line-clamp-2 max-w-[230px] drop-shadow-xs ${theme.textColor}`}>
            {operator.name}
          </span>
          <div className={`${dimensions.prodText} font-black tracking-tight leading-none mt-1 font-heading drop-shadow-sm ${theme.textColor}`}>
            {formatNumber(operator.totalProductivity)}
          </div>
          <span className={`text-[11px] font-extrabold uppercase tracking-wider mt-1 ${theme.subTextColor}`}>
            Total de Produtividade
          </span>
        </div>

        {/* Bottom Movements Pill Badge */}
        <div className={`flex items-center gap-2 px-3.5 py-1.5 rounded-full backdrop-blur-md border shadow-inner ${theme.pillBg}`}>
          <div className="w-4.5 h-4.5 rounded-full bg-black/20 text-white flex items-center justify-center">
            <span className="text-[10px] font-bold">{rank}</span>
          </div>
          <span className="text-[12px] font-extrabold tracking-tight">
            {formatNumber(operator.movements)} Movimentações
          </span>
        </div>

        {/* Heart Logo Engraved Base Badge */}
        <div className="w-6.5 h-6.5 rounded-full bg-black/15 flex items-center justify-center mt-1">
          <svg viewBox="0 0 24 24" className={`w-3.5 h-3.5 ${theme.heartColor}`}>
            <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
          </svg>
        </div>
      </div>
    </div>
  );
};
