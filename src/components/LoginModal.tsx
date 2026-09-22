import React, { useState } from 'react';
import { googleSignIn } from '../services/googleAuth';
import { ShieldCheck, ArrowRight, Shield, Activity, TrendingUp, Target } from 'lucide-react';

interface LoginModalProps {
  onLoginSuccess: (user: any) => void;
}

const EMAILS_PERMITIDOS = ["panenosistemab13@gmail.com"];

export const LoginModal: React.FC<LoginModalProps> = ({ onLoginSuccess }) => {
  const [erro, setErro] = useState<string | null>(null);
  const [carregando, setCarregando] = useState(false);

  const handleLoginGoogle = async () => {
    setCarregando(true);
    setErro(null);
    try {
      const res = await googleSignIn();
      if (res && res.user && res.user.email) {
        const emailUser = res.user.email.toLowerCase();
        if (EMAILS_PERMITIDOS.includes(emailUser) || emailUser.endsWith("@3coracoes.com.br")) {
          onLoginSuccess(res.user);
        } else {
          setErro("Acesso negado. E-mail sem permissão.");
        }
      }
    } catch (err: any) {
      setErro("Erro ao autenticar.");
    } finally {
      setCarregando(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-0 bg-[#05091B] overflow-hidden">
      {/* Cinematic Background Scene */}
      <div className="absolute inset-0 z-0 bg-[url('https://images.unsplash.com/photo-1590523277543-a94d2e4eb00b?q=80&w=2000&auto=format&fit=crop')] bg-cover bg-center">
        <div className="absolute inset-0 bg-gradient-to-tr from-[#05091B]/90 via-[#05091B]/60 to-transparent" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-amber-500/10 via-transparent to-transparent" />
      </div>

      {/* Main Container */}
      <div className="relative z-10 w-full max-w-5xl flex items-center justify-between px-12">
        {/* Left Side: Corporate Branding */}
        <div className="hidden lg:flex flex-col gap-6">
          <div className="text-white">
            <h1 className="text-4xl font-black tracking-tight">TRÊS CORAÇÕES</h1>
            <p className="text-[#AAB8CC] text-sm mt-2">Logística & Produtividade SAGA</p>
          </div>
        </div>

        {/* Center: Auth Card */}
        <div className="relative w-full max-w-md bg-[#071B38]/60 backdrop-blur-xl border border-white/10 rounded-[32px] p-10 shadow-2xl flex flex-col items-center text-center">
          <div className="absolute inset-0 rounded-[32px] border border-white/20 bg-gradient-to-b from-white/5 to-transparent pointer-events-none" />
          
          <div className="relative mb-6">
            <div className="absolute inset-0 bg-amber-500 blur-2xl opacity-20" />
            <div className="relative w-20 h-20 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center shadow-lg shadow-amber-500/20">
              <ShieldCheck className="w-10 h-10 text-white" />
            </div>
          </div>
          
          <div className="space-y-3 mb-8">
            <h2 className="text-3xl font-black text-white tracking-tight">SAGA <span className="text-amber-500">•</span> Autenticação</h2>
            <p className="text-xs text-[#AAB8CC] leading-relaxed max-w-xs">
              Faça login com sua conta Google autorizada para acessar o painel de produtividade em tempo real.
            </p>
          </div>

          <button
            type="button"
            onClick={handleLoginGoogle}
            disabled={carregando}
            className="w-full py-4 px-6 bg-gradient-to-r from-blue-600/20 to-blue-500/10 hover:from-blue-600/40 hover:to-blue-500/20 border border-blue-500/30 text-white rounded-2xl text-sm font-bold shadow-lg shadow-blue-900/20 flex items-center justify-center gap-3 transition-all cursor-pointer backdrop-blur-sm"
          >
            <svg className="w-5 h-5" viewBox="0 0 48 48"><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/><path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/></svg>
            {carregando ? "Autenticando..." : "Entrar com Conta Google"}
            <ArrowRight className="w-4 h-4" />
          </button>

          <div className="mt-8 flex items-center justify-center gap-6 text-[#AAB8CC] text-[10px] font-bold uppercase tracking-widest">
            <span className="flex items-center gap-1.5"><Shield className="w-3 h-3" /> Seguro</span>
            <span className="flex items-center gap-1.5">Rápido</span>
            <span className="flex items-center gap-1.5">Confiável</span>
          </div>
        </div>

        {/* Right Side: HUD Info */}
        <div className="hidden lg:flex flex-col gap-6 text-white text-right">
          {[
            { icon: Shield, label: "SEGURANÇA" },
            { icon: Target, label: "MONITORAMENTO" },
            { icon: Activity, label: "EFICIÊNCIA" },
            { icon: TrendingUp, label: "RESULTADOS" },
          ].map((item, i) => (
            <div key={i} className="flex items-center justify-end gap-3 opacity-70 hover:opacity-100 transition-opacity">
              <span className="text-[10px] font-bold tracking-widest">{item.label}</span>
              <item.icon className="w-4 h-4 text-[#00A8FF]" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
