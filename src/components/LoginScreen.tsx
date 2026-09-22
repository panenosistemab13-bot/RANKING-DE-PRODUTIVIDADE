import React, { useState } from 'react';
import { Shield, MapPin, BarChart2, Target, ArrowRight, ShieldAlert } from 'lucide-react';
import bgImage from '../assets/images/saga_login_bg_1790075329836.jpg';
import { googleSignIn } from '../services/googleAuth';

interface LoginScreenProps {
  onLogin: (email: string) => void;
  defaultEmail?: string;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({
  onLogin,
  defaultEmail = 'panenosistemab13@gmail.com'
}) => {
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleGoogleLogin = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const result = await googleSignIn();
      if (result && result.user && result.user.email) {
        onLogin(result.user.email);
      } else {
        throw new Error('E-mail não retornado pela conta Google.');
      }
    } catch (err: any) {
      console.error('Erro de login:', err);
      setErrorMsg(err.message || 'Erro de autenticação Google. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] w-screen h-screen overflow-hidden select-none bg-[#05091B] flex items-center justify-center font-sans">
      {/* 1. CINEMATIC BACKGROUND IMAGE */}
      <div className="absolute inset-0 w-full h-full overflow-hidden">
        <img
          src={bgImage}
          alt="SAGA Cinematic Background"
          referrerPolicy="no-referrer"
          className="w-full h-full object-cover object-center filter brightness-95 contrast-105"
        />
        {/* Cinematic Atmospheric Color Overlays */}
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950/75 via-slate-950/20 to-slate-950/65 pointer-events-none" />
        <div className="absolute inset-0 bg-gradient-to-b from-slate-950/50 via-transparent to-slate-950/85 pointer-events-none" />
        {/* Sunset Warm Radial Glow */}
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[600px] h-[380px] bg-amber-500/15 rounded-full blur-[100px] pointer-events-none" />
        {/* Blue Tech Glow */}
        <div className="absolute bottom-10 right-10 w-[500px] h-[320px] bg-cyan-500/20 rounded-full blur-[90px] pointer-events-none" />
      </div>

      {/* 2. TOP RIGHT HUD INDICATORS */}
      <div className="absolute top-5 right-6 flex flex-col items-end gap-2 text-white/90 z-20 font-sans tracking-widest text-[10px] font-black uppercase drop-shadow-md select-none">
        <div className="flex items-center gap-2 bg-slate-950/60 backdrop-blur-md px-3 py-1 rounded-lg border border-white/10 shadow-lg">
          <span className="text-slate-100">SEGURANÇA</span>
          <Shield className="w-3.5 h-3.5 text-cyan-400 fill-cyan-400/20" />
        </div>
        <div className="flex items-center gap-2 bg-slate-950/60 backdrop-blur-md px-3 py-1 rounded-lg border border-white/10 shadow-lg">
          <span className="text-slate-100">MONITORAMENTO</span>
          <MapPin className="w-3.5 h-3.5 text-cyan-400 fill-cyan-400/20" />
        </div>
        <div className="flex items-center gap-2 bg-slate-950/60 backdrop-blur-md px-3 py-1 rounded-lg border border-white/10 shadow-lg">
          <span className="text-slate-100">EFICIÊNCIA</span>
          <BarChart2 className="w-3.5 h-3.5 text-cyan-400 fill-cyan-400/20" />
        </div>
        <div className="flex items-center gap-2 bg-slate-950/60 backdrop-blur-md px-3 py-1 rounded-lg border border-white/10 shadow-lg">
          <span className="text-slate-100">RESULTADOS</span>
          <Target className="w-3.5 h-3.5 text-cyan-400 fill-cyan-400/20" />
        </div>
      </div>

      {/* 3. BOTTOM RIGHT BRAZIL HOLOGRAPHIC TECH MAP GRID */}
      <div className="absolute bottom-2 right-4 w-80 h-52 z-20 pointer-events-none opacity-80 hidden md:block">
        <svg viewBox="0 0 300 200" className="w-full h-full text-cyan-400">
          <defs>
            <radialGradient id="holoGrad" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#00A8FF" stopOpacity="0.6" />
              <stop offset="100%" stopColor="#00A8FF" stopOpacity="0" />
            </radialGradient>
          </defs>
          <ellipse cx="150" cy="120" rx="120" ry="50" fill="url(#holoGrad)" />
          {/* Brazil Map Stylized Contour */}
          <path
            d="M130,80 Q150,60 170,70 T190,90 T180,120 T150,150 T120,130 T110,100 Z"
            fill="none"
            stroke="#29C7FF"
            strokeWidth="1.5"
            strokeDasharray="4 2"
            className="animate-pulse"
          />
          {/* Glowing Grid Lines */}
          <line x1="50" y1="120" x2="250" y2="120" stroke="#00A8FF" strokeWidth="0.8" strokeOpacity="0.5" />
          <line x1="150" y1="50" x2="150" y2="180" stroke="#00A8FF" strokeWidth="0.8" strokeOpacity="0.5" />
          {/* Tech Nodes */}
          <circle cx="150" cy="90" r="3" fill="#FFB000" className="animate-ping" />
          <circle cx="150" cy="90" r="2" fill="#FFFFFF" />
          <circle cx="170" cy="110" r="2.5" fill="#00A8FF" />
          <circle cx="130" cy="120" r="2.5" fill="#00A8FF" />
        </svg>
      </div>

      {/* 4. CENTRAL GLASSMORPHISM CARD */}
      <div className="relative z-30 w-full max-w-[480px] mx-4 transform scale-90 sm:scale-95 md:scale-100 transition-transform">
        {/* Golden Reflection Below Card onto Pavement */}
        <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 w-4/5 h-20 bg-amber-500/30 blur-2xl rounded-full pointer-events-none" />

        <div className="w-full rounded-[28px] bg-[#061329]/85 backdrop-blur-2xl border border-[#1c3866] p-6 md:p-8 relative text-center text-white shadow-[0_25px_60px_rgba(0,0,0,0.9),0_0_50px_rgba(0,168,255,0.22)] overflow-visible">
          {/* Cyan/Blue Inner Contour Glow */}
          <div className="absolute inset-0 rounded-[28px] border border-cyan-400/30 pointer-events-none shadow-[inset_0_0_20px_rgba(0,168,255,0.2)]" />

          {/* 5. FLOATING GOLDEN SHIELD BADGE */}
          <div className="absolute -top-9 left-1/2 -translate-x-1/2 z-40">
            <div className="w-18 h-18 rounded-[20px] bg-gradient-to-br from-[#FFD000] via-[#FF9000] to-[#E67300] p-0.5 shadow-[0_0_35px_rgba(255,168,0,0.95),0_8px_20px_rgba(0,0,0,0.6)] border-2 border-white/80 flex items-center justify-center relative group">
              <div className="w-full h-full rounded-[18px] bg-gradient-to-br from-[#FFA800] to-[#D96200] flex items-center justify-center">
                <svg viewBox="0 0 24 24" className="w-9 h-9 text-white fill-white drop-shadow-[0_2px_6px_rgba(0,0,0,0.4)]">
                  <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm-2 16l-4-4 1.41-1.41L10 14.17l6.59-6.59L18 9l-8 8z"/>
                </svg>
              </div>
            </div>
          </div>

          {/* 6. TITLE */}
          <div className="mt-4 mb-1.5">
            <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight flex items-center justify-center gap-2">
              <span className="font-extrabold tracking-normal">SAGA</span>
              <span className="text-amber-400 text-xl drop-shadow-[0_0_10px_rgba(255,176,0,0.9)]">•</span>
              <span className="font-light text-slate-100">Autenticação</span>
            </h1>
          </div>

          {/* 7. SUBTITLE */}
          <p className="text-slate-300/90 text-xs md:text-sm font-normal leading-relaxed max-w-[400px] mx-auto mb-6 font-sans">
            Faça login com sua conta Google autorizada para acessar<br className="hidden sm:inline" />
            o painel de produtividade em tempo real.
          </p>

          {errorMsg && (
            <div className="w-full max-w-[400px] mx-auto mb-5 p-3 rounded-2xl bg-red-500/15 border border-red-500/30 text-xs text-red-200 flex items-center gap-2 text-left">
              <ShieldAlert className="w-4 h-4 text-red-400 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* 8. GOOGLE LOGIN BUTTON */}
          <button
            onClick={handleGoogleLogin}
            disabled={loading}
            className="w-full max-w-[400px] mx-auto py-3 px-5 rounded-full bg-[#081830]/90 hover:bg-[#0c2244] border-2 border-[#00a8ff] shadow-[0_0_25px_rgba(0,168,255,0.7),inset_0_0_12px_rgba(0,168,255,0.35)] hover:shadow-[0_0_35px_rgba(0,168,255,0.95),inset_0_0_20px_rgba(0,168,255,0.5)] transition-all duration-300 cursor-pointer flex items-center justify-between group relative overflow-hidden active:scale-98"
          >
            {/* Left Google Official Colored G Icon */}
            <div className="w-7 h-7 rounded-full bg-white flex items-center justify-center shrink-0 shadow-md">
              <svg viewBox="0 0 24 24" className="w-4 h-4">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
              </svg>
            </div>

            {/* Center Label */}
            <span className="text-white font-semibold text-sm md:text-base tracking-wide font-sans text-center flex-1 px-2">
              {loading ? 'Autenticando...' : 'Entrar com Conta Google'}
            </span>

            {/* Right Glowing Arrow Circle */}
            <div className="w-7 h-7 rounded-full border border-cyan-400/60 bg-cyan-500/20 flex items-center justify-center text-cyan-300 group-hover:bg-cyan-500 group-hover:text-slate-950 transition-all shrink-0">
              <ArrowRight className="w-3.5 h-3.5 stroke-[2.5]" />
            </div>
          </button>

          {/* 9. FOOTER UNDER BUTTON */}
          <div className="mt-6 text-[10px] font-black text-slate-300/80 uppercase tracking-[0.25em] flex items-center justify-center gap-1.5">
            <Shield className="w-3 h-3 text-cyan-400 fill-cyan-400/20" />
            <span>SEGURO  •  RÁPIDO  •  CONFIÁVEL</span>
          </div>
        </div>
      </div>
    </div>
  );
};
