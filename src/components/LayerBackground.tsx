import React from 'react';

export const LayerBackground: React.FC = () => {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden z-0 select-none">
      {/* 3D Office Environment Render (Window, Sky, Sunlight, Office architecture) */}
      <img
        src="/assets/images/office_bg.jpg"
        alt="Ambiente Cinematográfico"
        referrerPolicy="no-referrer"
        className="absolute inset-0 w-full h-full object-cover object-center opacity-85 scale-[1.02] filter brightness-[1.03] contrast-[1.02]"
      />

      {/* Atmospheric Lighting Gradients */}
      <div className="absolute inset-0 bg-gradient-to-t from-white/70 via-transparent to-white/30 mix-blend-overlay" />
      <div className="absolute top-0 right-0 w-[800px] h-[600px] bg-gradient-to-b from-amber-100/40 via-amber-50/15 to-transparent blur-3xl pointer-events-none" />
      <div className="absolute top-1/4 left-1/4 w-[600px] h-[500px] bg-sky-100/30 rounded-full blur-3xl mix-blend-soft-light" />

      {/* Polished Marble Counter Foreground Layer */}
      <div className="absolute bottom-0 left-0 right-0 h-[480px] bg-gradient-to-t from-white/90 via-white/50 to-transparent pointer-events-none">
        {/* Subtle marble reflection line */}
        <div className="w-full h-px bg-gradient-to-r from-transparent via-white/80 to-transparent absolute top-20" />
      </div>

      {/* Soft Vignette around borders for focus */}
      <div className="absolute inset-0 ring-1 ring-inset ring-black/5 pointer-events-none" />
    </div>
  );
};
