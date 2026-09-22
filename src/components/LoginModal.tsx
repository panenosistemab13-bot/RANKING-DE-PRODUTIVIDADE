import React, { useState } from 'react';
import { googleSignIn } from '../services/googleAuth';
import { ShieldCheck, LogIn, AlertCircle } from 'lucide-react';

interface LoginModalProps {
  onLoginSuccess: (user: any) => void;
}

// Lista de e-mails autorizados a entrar no sistema
const EMAILS_PERMITIDOS = [
  "panenosistemab13@gmail.com",
  // Adicione aqui os e-mails dos colaboradores autorizados
];

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
        
        // Verifica se o email tem permissão no sistema
        if (EMAILS_PERMITIDOS.includes(emailUser) || emailUser.endsWith("@3coracoes.com.br")) {
          onLoginSuccess(res.user);
        } else {
          setErro("Acesso negado. Este e-mail não possui permissão no sistema SAGA.");
        }
      }
    } catch (err: any) {
      setErro("Erro ao autenticar com o Google: " + (err.message || err));
    } finally {
      setCarregando(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-slate-950/80 backdrop-blur-md">
      <div className="w-full max-w-md rounded-[32px] bg-white border border-slate-200 shadow-2xl p-8 flex flex-col items-center text-center space-y-6">
        <div className="w-16 h-16 rounded-2xl bg-amber-500 text-white flex items-center justify-center shadow-lg shadow-amber-500/30">
          <ShieldCheck className="w-8 h-8" />
        </div>
        
        <div className="space-y-2">
          <h2 className="text-2xl font-black text-slate-900 font-heading">SAGA • Autenticação</h2>
          <p className="text-xs text-slate-500 font-medium">
            Faça login com sua conta Google autorizada para aceder ao painel de produtividade em tempo real.
          </p>
        </div>

        <button
          type="button"
          onClick={handleLoginGoogle}
          disabled={carregando}
          className="w-full py-3.5 px-6 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl text-xs font-bold shadow-md flex items-center justify-center gap-3 transition-all cursor-pointer"
        >
          <svg className="w-4 h-4 shrink-0" viewBox="0 0 48 48">
            <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path>
            <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"></path>
            <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"></path>
            <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path>
          </svg>
          {carregando ? "A validar acesso..." : "Entrar com Conta Google"}
        </button>

        {erro && (
          <div className="w-full p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{erro}</span>
          </div>
        )}
      </div>
    </div>
  );
};
