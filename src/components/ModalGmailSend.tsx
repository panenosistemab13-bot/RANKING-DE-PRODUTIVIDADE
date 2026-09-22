import React, { useState, useEffect } from 'react';
import {
  X,
  Mail,
  Send,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  User,
  LogOut,
  Coffee,
  Info,
  ChevronRight,
  ShieldAlert
} from 'lucide-react';
import { User as FirebaseUser } from 'firebase/auth';
import { googleSignIn, googleSignOut, getAccessToken, initGoogleAuth } from '../services/googleAuth';
import { OperatorSummary, DashboardKPIs } from '../types';

interface ModalGmailSendProps {
  isOpen: boolean;
  onClose: () => void;
  operators: OperatorSummary[];
  selectedActivity: string;
  periodLabel: string;
  kpis: DashboardKPIs;
}

export const ModalGmailSend: React.FC<ModalGmailSendProps> = ({
  isOpen,
  onClose,
  operators,
  selectedActivity,
  periodLabel,
  kpis
}) => {
  // Estados de Auth do Google
  const [googleUser, setGoogleUser] = useState<FirebaseUser | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  // Estados do Form de Envio
  const [toEmail, setToEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [customNotes, setCustomNotes] = useState('');
  
  // Estados de Envio
  const [isSending, setIsSending] = useState(false);
  const [sendSuccess, setSendSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Monitora estado de autenticação do Google
  useEffect(() => {
    if (!isOpen) return;
    
    const unsubscribe = initGoogleAuth(
      (user, token) => {
        setGoogleUser(user);
        setAccessToken(token);
      },
      () => {
        setGoogleUser(null);
        setAccessToken(null);
      }
    );

    // Pré-preenche o assunto do e-mail
    const formattedDate = new Date().toLocaleDateString('pt-BR');
    setSubject(`[3 Corações - SAGA WMS] Relatório de Produtividade - ${selectedActivity} - ${formattedDate}`);

    return () => unsubscribe();
  }, [isOpen, selectedActivity]);

  if (!isOpen) return null;

  // Login com Google
  const handleGoogleLogin = async () => {
    setIsAuthenticating(true);
    setErrorMessage(null);
    try {
      const result = await googleSignIn();
      if (result) {
        setGoogleUser(result.user);
        setAccessToken(result.accessToken);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Falha ao conectar com o Google.');
    } finally {
      setIsAuthenticating(false);
    }
  };

  // Logout do Google
  const handleGoogleLogout = async () => {
    try {
      await googleSignOut();
      setGoogleUser(null);
      setAccessToken(null);
      setSendSuccess(false);
    } catch (err: any) {
      setErrorMessage('Erro ao desconectar conta Google.');
    }
  };

  // Constrói e envia o e-mail via Gmail API
  const handleSendEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!toEmail.trim()) {
      setErrorMessage('Por favor, informe pelo menos um e-mail de destino.');
      return;
    }

    const token = accessToken || (await getAccessToken());
    if (!token) {
      setErrorMessage('Token de acesso expirado. Reconecte sua conta do Google.');
      return;
    }

    setIsSending(true);
    setErrorMessage(null);

    try {
      // Top 3 do pódio
      const top3 = operators.slice(0, 3);
      const top10 = operators.slice(0, 10);

      // Constrói o corpo do e-mail em HTML com estilização inline de alta qualidade
      const htmlBody = `
        <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 16px; overflow: hidden; background-color: #ffffff; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);">
          <!-- Header 3 Corações -->
          <div style="background: linear-gradient(135deg, #0f2444 0%, #1a365d 100%); padding: 24px; text-align: center; border-bottom: 4px solid #f59e0b;">
            <table width="100%" cellspacing="0" cellpadding="0">
              <tr>
                <td align="center" style="padding-bottom: 10px;">
                  <span style="font-size: 24px; font-weight: 900; color: #ffffff; letter-spacing: 1px;">3 CORAÇÕES</span>
                </td>
              </tr>
              <tr>
                <td align="center">
                  <span style="font-size: 11px; font-weight: bold; color: #f59e0b; letter-spacing: 2px; text-transform: uppercase;">SAGA WMS • CD BELO HORIZONTE</span>
                </td>
              </tr>
            </table>
          </div>

          <!-- Body -->
          <div style="padding: 24px; color: #1e293b;">
            <p style="font-size: 14px; line-height: 1.6; color: #475569; margin-top: 0;">
              Olá, segue o resumo oficial do <strong>Ranking de Produtividade SAGA WMS</strong>.
            </p>

            ${customNotes ? `
              <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 12px 16px; border-radius: 8px; margin-bottom: 20px; font-size: 13px; font-style: italic; color: #78350f;">
                "${customNotes}"
              </div>
            ` : ''}

            <!-- Resumo de Métricas -->
            <table width="100%" cellspacing="0" cellpadding="0" style="margin-bottom: 24px; border-collapse: collapse;">
              <tr>
                <td style="width: 50%; padding-right: 8px; padding-bottom: 16px;">
                  <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 12px; text-align: center;">
                    <div style="font-size: 11px; font-weight: bold; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px;">Atividade Filtro</div>
                    <div style="font-size: 14px; font-weight: 800; color: #0f2444; margin-top: 4px;">${selectedActivity}</div>
                  </div>
                </td>
                <td style="width: 50%; padding-left: 8px; padding-bottom: 16px;">
                  <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 12px; text-align: center;">
                    <div style="font-size: 11px; font-weight: bold; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px;">Colaboradores</div>
                    <div style="font-size: 18px; font-weight: 800; color: #0f2444; margin-top: 4px;">${kpis.totalOperators}</div>
                  </div>
                </td>
              </tr>
              <tr>
                <td style="width: 50%; padding-right: 8px;">
                  <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 12px; text-align: center;">
                    <div style="font-size: 11px; font-weight: bold; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px;">Total Produtividade</div>
                    <div style="font-size: 18px; font-weight: 800; color: #d97706; margin-top: 4px;">${kpis.totalProductivity.toLocaleString('pt-BR')} <span style="font-size: 10px; font-weight: bold; color: #92400e;">Ordens</span></div>
                  </div>
                </td>
                <td style="width: 50%; padding-left: 8px;">
                  <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 12px; text-align: center;">
                    <div style="font-size: 11px; font-weight: bold; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px;">Total Movimentações</div>
                    <div style="font-size: 18px; font-weight: 800; color: #0f2444; margin-top: 4px;">${kpis.totalMovements.toLocaleString('pt-BR')}</div>
                  </div>
                </td>
              </tr>
            </table>

            <!-- Pódio Top 3 -->
            <h4 style="font-size: 13px; font-weight: bold; color: #0f2444; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 2px solid #e2e8f0; padding-bottom: 8px; margin-top: 0; margin-bottom: 12px;">🏆 Pódio de Destaque</h4>
            <div style="margin-bottom: 24px;">
              ${top3.map((op, idx) => `
                <div style="display: flex; align-items: center; justify-content: space-between; padding: 10px 14px; margin-bottom: 8px; background-color: ${idx === 0 ? '#fef3c7' : idx === 1 ? '#f1f5f9' : '#ffedd5'}; border: 1px solid ${idx === 0 ? '#fde68a' : idx === 1 ? '#e2e8f0' : '#fed7aa'}; border-radius: 10px;">
                  <table width="100%" cellspacing="0" cellpadding="0">
                    <tr>
                      <td style="width: 40px; font-weight: bold; font-size: 14px; color: ${idx === 0 ? '#92400e' : idx === 1 ? '#475569' : '#c2410c'};">
                        ${idx === 0 ? '🥇 1º' : idx === 1 ? '🥈 2º' : '🥉 3º'}
                      </td>
                      <td style="font-weight: 800; font-size: 13px; color: #0f2444; text-transform: uppercase;">
                        ${op.name} <span style="font-size: 9px; font-weight: bold; color: #64748b; background-color: #ffffff; padding: 2px 6px; border-radius: 4px; margin-left: 6px; border: 1px solid #e2e8f0;">TURNO ${op.turno}</span>
                      </td>
                      <td align="right" style="font-weight: 900; font-size: 14px; color: #1e293b;">
                        ${op.totalProductivity.toLocaleString('pt-BR')} <span style="font-size: 9px; font-weight: normal; color: #64748b;">Ordens</span>
                      </td>
                    </tr>
                  </table>
                </div>
              `).join('')}
            </div>

            <!-- Tabela Completa (Top 10) -->
            <h4 style="font-size: 13px; font-weight: bold; color: #0f2444; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 2px solid #e2e8f0; padding-bottom: 8px; margin-top: 0; margin-bottom: 12px;">📊 Classificação (Top 10)</h4>
            <table width="100%" cellspacing="0" cellpadding="8" style="border-collapse: collapse; font-size: 12px; margin-bottom: 16px;">
              <thead>
                <tr style="background-color: #f1f5f9; text-align: left; color: #475569; font-weight: bold; border-bottom: 2px solid #cbd5e1;">
                  <th style="border-bottom: 1px solid #cbd5e1; width: 50px;">Pos</th>
                  <th style="border-bottom: 1px solid #cbd5e1;">Colaborador</th>
                  <th style="border-bottom: 1px solid #cbd5e1; text-align: center; width: 60px;">Turno</th>
                  <th style="border-bottom: 1px solid #cbd5e1; text-align: right; width: 100px;">Qtd. Ordens</th>
                  <th style="border-bottom: 1px solid #cbd5e1; text-align: right; width: 80px;">Part. %</th>
                </tr>
              </thead>
              <tbody>
                ${top10.map((op, index) => `
                  <tr style="border-bottom: 1px solid #e2e8f0; background-color: ${index % 2 === 0 ? '#ffffff' : '#f8fafc'};">
                    <td style="font-weight: bold; color: #64748b;">${index + 1}º</td>
                    <td style="font-weight: 800; color: #1e293b; text-transform: uppercase;">${op.name}</td>
                    <td align="center"><span style="font-weight: bold; color: #475569; background-color: #e2e8f0; padding: 2px 6px; border-radius: 4px; font-size: 10px;">${op.turno}</span></td>
                    <td align="right" style="font-weight: bold; color: #0f2444;">${op.totalProductivity.toLocaleString('pt-BR')}</td>
                    <td align="right" style="color: #64748b; font-weight: 600;">${op.participation.toFixed(2).replace('.', ',')}%</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
            
            <p style="font-size: 11px; color: #94a3b8; text-align: center; margin-top: 24px; margin-bottom: 0;">
              * Período correspondente: ${periodLabel}.
            </p>
          </div>

          <!-- Footer -->
          <div style="background-color: #f8fafc; padding: 16px 24px; text-align: center; border-top: 1px solid #e2e8f0;">
            <table width="100%" cellspacing="0" cellpadding="0">
              <tr>
                <td align="center">
                  <span style="font-size: 11px; color: #94a3b8; font-weight: bold;">GRUPO 3 CORAÇÕES • SISTEMA DE GESTÃO SAGA</span>
                </td>
              </tr>
              <tr>
                <td align="center" style="padding-top: 4px;">
                  <span style="font-size: 10px; color: #cbd5e1;">E-mail automático enviado com autorização via Google Workspace API</span>
                </td>
              </tr>
            </table>
          </div>
        </div>
      `;

      // Codifica no padrão RFC 822 / Base64URL exigido pelo Gmail
      const utf8Subject = `=?utf-8?B?${btoa(unescape(encodeURIComponent(subject)))}?=`;
      const emailLines = [
        `To: ${toEmail}`,
        `Subject: ${utf8Subject}`,
        'MIME-Version: 1.0',
        'Content-Type: text/html; charset=utf-8',
        'Content-Transfer-Encoding: 7bit',
        '',
        htmlBody
      ];
      const emailContent = emailLines.join('\r\n');
      const base64Safe = btoa(unescape(encodeURIComponent(emailContent)))
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');

      // Requisição à API do Gmail
      const response = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          raw: base64Safe
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error?.message || 'Falha ao enviar e-mail. Verifique os escopos concedidos.');
      }

      setSendSuccess(true);
      setCustomNotes('');
    } catch (err: any) {
      console.error('Erro ao enviar e-mail:', err);
      setErrorMessage(err.message || 'Erro inesperado ao realizar o envio do relatório.');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200 select-none">
      {/* Backdrop Click */}
      <div className="absolute inset-0" onClick={onClose} />

      {/* Container do Modal */}
      <div className="relative z-10 w-full max-w-[500px] bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3.5 border-b border-slate-800 bg-gradient-to-r from-amber-950/30 via-slate-900 to-slate-900">
          <div className="flex items-center gap-2.5">
            <div className="w-8.5 h-8.5 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-white shadow-lg shadow-amber-500/20 shrink-0">
              <Mail className="w-4.5 h-4.5" />
            </div>
            <div>
              <h3 className="text-[13.5px] font-black text-white tracking-tight uppercase font-heading leading-none">
                CENTRAL DE E-MAILS GMAIL
              </h3>
              <p className="text-[10px] text-slate-400 mt-1 leading-none">
                Envie relatórios oficiais de produtividade pelo Google Workspace
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-all cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Status de Conexão Google */}
        <div className="px-4 py-2 bg-slate-950/50 border-b border-slate-800 flex items-center justify-between text-xs">
          {googleUser ? (
            <div className="flex items-center gap-2 text-slate-300 w-full justify-between">
              <div className="flex items-center gap-1.5 min-w-0">
                {googleUser.photoURL ? (
                  <img
                    src={googleUser.photoURL}
                    alt={googleUser.displayName || ''}
                    className="w-5 h-5 rounded-full border border-amber-500/30"
                  />
                ) : (
                  <div className="w-5 h-5 rounded-full bg-slate-800 flex items-center justify-center text-amber-400 font-bold text-[10px]">
                    {googleUser.email?.charAt(0).toUpperCase()}
                  </div>
                )}
                <span className="font-semibold text-[11px] truncate text-slate-300">
                  Conectado como: <strong className="text-amber-400">{googleUser.email}</strong>
                </span>
              </div>
              <button
                onClick={handleGoogleLogout}
                className="flex items-center gap-1 text-[10px] text-rose-400 hover:text-rose-300 font-extrabold uppercase tracking-wider bg-rose-500/10 px-2 py-0.5 rounded border border-rose-500/20 transition-all cursor-pointer"
                title="Desconectar conta Google"
              >
                <LogOut className="w-2.5 h-2.5" />
                <span>Sair</span>
              </button>
            </div>
          ) : (
            <div className="flex items-center justify-between w-full">
              <span className="text-[10.5px] font-medium text-slate-400 flex items-center gap-1">
                <Info className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                Requer login com Google para enviar e-mails via Gmail.
              </span>
              <button
                onClick={handleGoogleLogin}
                disabled={isAuthenticating}
                className="flex items-center gap-1 px-2.5 py-1 rounded bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-950 text-[10.5px] font-black uppercase tracking-wider transition-all cursor-pointer"
              >
                {isAuthenticating ? (
                  <>
                    <Loader2 className="w-3 h-3 animate-spin" />
                    <span>Conectando...</span>
                  </>
                ) : (
                  <>
                    <Coffee className="w-3 h-3" />
                    <span>Conectar</span>
                  </>
                )}
              </button>
            </div>
          )}
        </div>

        {/* Corpo Principal */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
          
          {errorMessage && (
            <div className="p-3 rounded-xl bg-red-500/15 border border-red-500/30 text-xs font-bold text-red-300 flex items-start gap-2 animate-shake">
              <ShieldAlert className="w-4 h-4 shrink-0 text-red-400 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {sendSuccess ? (
            <div className="py-6 px-4 flex flex-col items-center text-center space-y-4">
              <div className="w-14 h-14 rounded-full bg-emerald-500/10 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shadow-xl shadow-emerald-500/10">
                <CheckCircle2 className="w-8 h-8 stroke-[2.2]" />
              </div>
              <div className="space-y-1.5">
                <h4 className="text-[14px] font-black text-white uppercase tracking-wider font-heading">
                  E-mail enviado com sucesso!
                </h4>
                <p className="text-[11.5px] text-slate-400 max-w-sm leading-relaxed">
                  O relatório oficial de produtividade SAGA WMS foi encaminhado ao destinatário com o template personalizado e layout executivo da 3 Corações.
                </p>
              </div>
              <button
                onClick={() => setSendSuccess(false)}
                className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold transition-all cursor-pointer"
              >
                Enviar Outro Relatório
              </button>
            </div>
          ) : !googleUser ? (
            /* Se não estiver autenticado, mostra o passo explicativo */
            <div className="py-5 px-3 flex flex-col items-center text-center space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-500/10 to-amber-600/10 border border-amber-500/20 flex items-center justify-center text-amber-400 shadow-sm">
                <Mail className="w-5.5 h-5.5" />
              </div>
              <div className="space-y-1.5 max-w-[340px]">
                <h4 className="text-[13px] font-black text-white uppercase tracking-wide font-heading">
                  Integração Gmail API Ativa
                </h4>
                <p className="text-[11px] text-slate-400 leading-snug">
                  Ao conectar sua conta corporativa ou pessoal do Google, você poderá enviar resumos de produtividade em tempo real para gerentes, supervisores ou líderes de turno diretamente do painel.
                </p>
              </div>

              <button
                onClick={handleGoogleLogin}
                disabled={isAuthenticating}
                className="w-full max-w-[280px] h-10 px-4 rounded-xl bg-gradient-to-r from-amber-500 via-amber-600 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-amber-500/25 transition-all hover:scale-[1.01] active:scale-[0.98] cursor-pointer"
              >
                {isAuthenticating ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>AUTENTICANDO NO GOOGLE...</span>
                  </>
                ) : (
                  <>
                    <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current">
                      <path d="M12.24 10.285V13.4h6.887c-.275 1.565-1.88 4.604-6.887 4.604-4.33 0-7.859-3.578-7.859-8s3.529-8 7.859-8c2.46 0 4.105 1.025 5.047 1.926l2.427-2.334C17.955 2.192 15.34 1 12.24 1 6.033 1 1 6.033 1 12.24s5.033 11.24 11.24 11.24c6.478 0 10.793-4.537 10.793-10.983 0-.74-.08-1.302-.178-1.86H12.24z" />
                    </svg>
                    <span>CONECTAR GOOGLE WORKSPACE</span>
                  </>
                )}
              </button>
            </div>
          ) : (
            /* Formulário de Envio */
            <form onSubmit={handleSendEmail} className="space-y-4">
              
              {/* Campo Destinatário */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-black uppercase text-slate-400 tracking-wider block">
                  Destinatários (E-mails separados por vírgula)
                </label>
                <input
                  type="text"
                  value={toEmail}
                  onChange={(e) => setToEmail(e.target.value)}
                  placeholder="ex: gerente@trescoracoes.com.br, supervisor@trescoracoes.com.br"
                  required
                  className="w-full h-10 px-3.5 bg-slate-950 border border-slate-700/80 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400/25 transition-all"
                />
              </div>

              {/* Campo Assunto */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-black uppercase text-slate-400 tracking-wider block">
                  Assunto do E-mail
                </label>
                <input
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="Assunto da mensagem"
                  required
                  className="w-full h-10 px-3.5 bg-slate-950 border border-slate-700/80 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400/25 transition-all"
                />
              </div>

              {/* Campo Nota Personalizada */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-black uppercase text-slate-400 tracking-wider block">
                  Mensagem Personalizada (Opcional - aparecerá no cabeçalho)
                </label>
                <textarea
                  value={customNotes}
                  onChange={(e) => setCustomNotes(e.target.value)}
                  placeholder="Digite observações adicionais que deseja incluir no e-mail..."
                  rows={3}
                  className="w-full p-3.5 bg-slate-950 border border-slate-700/80 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400/25 transition-all resize-none custom-scrollbar"
                />
              </div>

              {/* Dica da Planilha e Visualização */}
              <div className="p-3 rounded-xl bg-slate-800/50 border border-slate-700/60 flex items-start gap-2.5 text-[11px] text-slate-300">
                <Info className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <span className="font-bold text-white block">Template Premium Integrado</span>
                  <p className="text-slate-400 leading-snug">
                    O e-mail será formatado com o layout oficial da <strong className="text-amber-400">3 Corações</strong>, contendo o pódio dos 3 melhores colaboradores, tabela Top 10 e os indicadores de produtividade do SAGA.
                  </p>
                </div>
              </div>

              {/* Botão de Envio */}
              <button
                type="submit"
                disabled={isSending}
                className="w-full h-10 px-4 rounded-xl bg-gradient-to-r from-amber-500 via-amber-600 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-amber-500/25 transition-all hover:scale-[1.01] active:scale-[0.98] cursor-pointer disabled:opacity-50"
              >
                {isSending ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Realizando Envio via Gmail...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4 text-slate-950" />
                    <span>ENVIAR RELATÓRIO AGORA</span>
                  </>
                )}
              </button>

            </form>
          )}

        </div>

        {/* Footer */}
        <div className="px-4 py-2.5 bg-slate-950 border-t border-slate-800 flex items-center justify-between">
          <span className="text-[10px] text-slate-500">
            SAGA WMS • 3 Corações • Gmail API
          </span>
          <button
            onClick={onClose}
            className="px-3.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-[11px] font-bold transition-all cursor-pointer"
          >
            Fechar
          </button>
        </div>

      </div>
    </div>
  );
};
