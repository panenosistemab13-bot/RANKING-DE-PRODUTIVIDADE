import { ref, get, set } from 'firebase/database';
import { rtdb } from './firebase';

export interface AutorizedUser {
  email: string;
  name: string;
  password?: string;
}

// Lista padrão de usuários iniciais caso o banco esteja vazio
const DEFAULT_AUTHORIZED_USERS: Record<string, AutorizedUser> = {
  "admin": {
    "email": "panenosistemab13@gmail.com",
    "name": "Administrador SAGA",
    "password": "trescafe2029"
  },
  "operacoes": {
    "email": "operacoes@3coracoes.com.br",
    "name": "Operações SAGA",
    "password": "ranking3c26"
  }
};

let cachedUserEmail: string | null = null;
let cachedUserName: string | null = null;

// Callbacks do listener
let authSuccessListener: ((user: { email: string; displayName?: string }, token: string) => void) | null = null;
let authFailureListener: (() => void) | null = null;

/**
 * Inicializa a lista de usuários no banco de dados se estiver vazia
 */
export const garantirUsuariosIniciais = async () => {
  try {
    const dbRef = ref(rtdb, 'usuarios_autorizados');
    const snapshot = await get(dbRef);
    if (!snapshot.exists()) {
      await set(dbRef, DEFAULT_AUTHORIZED_USERS);
      console.log('[Auth] Usuários padrão de inicialização criados no Firebase!');
    } else {
      // Força a atualização da senha de operacoes no banco para garantir que a alteração seja aplicada imediatamente
      const opPassRef = ref(rtdb, 'usuarios_autorizados/operacoes/password');
      await set(opPassRef, 'ranking3c26');
      
      // Também atualiza o e-mail e nome se necessário
      const opEmailRef = ref(rtdb, 'usuarios_autorizados/operacoes/email');
      await set(opEmailRef, 'operacoes@3coracoes.com.br');
    }
  } catch (err) {
    console.error('[Auth] Erro ao garantir usuários iniciais:', err);
  }
};

/**
 * Inicializa o listener de autenticação simulada baseada em credenciais salvas no SessionStorage/LocalStorage
 */
export const initAuth = (
  onAuthSuccess?: (user: { email: string; displayName?: string }, token: string) => void,
  onAuthFailure?: () => void
) => {
  authSuccessListener = onAuthSuccess || null;
  authFailureListener = onAuthFailure || null;

  // Garante a criação inicial dos usuários de forma assíncrona
  garantirUsuariosIniciais();

  // Verifica se há credenciais salvas no localStorage
  const savedEmail = localStorage.getItem('saga_logged_user_email');
  const savedName = localStorage.getItem('saga_logged_user_name');
  
  if (savedEmail && savedName) {
    cachedUserEmail = savedEmail;
    cachedUserName = savedName;
    if (onAuthSuccess) {
      onAuthSuccess({ email: savedEmail, displayName: savedName }, 'local-auth-token-saga');
    }
  } else {
    if (onAuthFailure) onAuthFailure();
  }

  // Retorna uma função de unsubscribe fictícia
  return () => {
    authSuccessListener = null;
    authFailureListener = null;
  };
};

/**
 * Valida as credenciais digitadas contra as cadastradas no Firebase Realtime Database
 */
export const realizarLoginComCredenciais = async (emailInput: string, passwordInput: string): Promise<{ email: string; name: string }> => {
  await garantirUsuariosIniciais();
  
  const emailLower = emailInput.trim().toLowerCase();
  const password = passwordInput.trim();

  try {
    const dbRef = ref(rtdb, 'usuarios_autorizados');
    const snapshot = await get(dbRef);
    
    if (snapshot.exists()) {
      const usersData = snapshot.val();
      const usersList: AutorizedUser[] = Object.values(usersData);
      
      const matchedUser = usersList.find(
        (u) => u.email.trim().toLowerCase() === emailLower && u.password === password
      );

      if (matchedUser) {
        cachedUserEmail = matchedUser.email;
        cachedUserName = matchedUser.name;
        
        localStorage.setItem('saga_logged_user_email', matchedUser.email);
        localStorage.setItem('saga_logged_user_name', matchedUser.name);
        sessionStorage.setItem('saga_oauth_access_token', 'local-auth-token-saga');

        if (authSuccessListener) {
          authSuccessListener({ email: matchedUser.email, displayName: matchedUser.name }, 'local-auth-token-saga');
        }
        
        return { email: matchedUser.email, name: matchedUser.name };
      }
    }
    
    throw new Error('E-mail ou senha incorretos. Por favor, verifique suas credenciais de acesso.');
  } catch (err: any) {
    console.error('[Auth] Erro ao validar credenciais:', err);
    throw err;
  }
};

/**
 * Mantemos a assinatura googleSignIn para compatibilidade de fluxo no frontend
 */
export const googleSignIn = async (): Promise<any> => {
  throw new Error('Google OAuth desativado. Por favor, utilize o login por e-mail e senha.');
};

/**
 * Obtém o token de acesso em cache (fictício para satisfazer o googleSheets)
 */
export const getAccessToken = async (): Promise<string | null> => {
  return sessionStorage.getItem('saga_oauth_access_token');
};

/**
 * Define o token de acesso manualmente
 */
export const setAccessToken = (token: string | null) => {
  if (token) {
    sessionStorage.setItem('saga_oauth_access_token', token);
  } else {
    sessionStorage.removeItem('saga_oauth_access_token');
  }
};

/**
 * Realiza o logout (Sign out)
 */
export const logoutGoogle = async () => {
  cachedUserEmail = null;
  cachedUserName = null;
  localStorage.removeItem('saga_logged_user_email');
  localStorage.removeItem('saga_logged_user_name');
  sessionStorage.removeItem('saga_oauth_access_token');
  if (authFailureListener) authFailureListener();
};

/**
 * Aliases de compatibilidade para o Gmail Send e outros componentes
 */
export const googleSignOut = logoutGoogle;
export const initGoogleAuth = initAuth;

