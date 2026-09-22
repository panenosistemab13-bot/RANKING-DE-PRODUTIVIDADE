import { getAuth, signInWithPopup, GoogleAuthProvider, signOut, onAuthStateChanged, User } from 'firebase/auth';
import { ref, get, set } from 'firebase/database';
import { app, rtdb } from './firebase';

export const auth = getAuth(app);
const provider = new GoogleAuthProvider();

// Adiciona os escopos necessários
provider.addScope('https://www.googleapis.com/auth/userinfo.email');
provider.addScope('https://www.googleapis.com/auth/userinfo.profile');
provider.addScope('openid');
provider.addScope('https://www.googleapis.com/auth/spreadsheets');

// Lista padrão de emails de fallback/inicialização
const HARDCODED_ALLOWED_EMAILS = [
  'panenosistemab13@gmail.com'
];

let cachedAccessToken: string | null = null;
let isSigningIn = false;

/**
 * Obtém a lista de e-mails autorizados do Firebase Realtime Database
 */
export const obterEmailsPermitidos = async (): Promise<string[]> => {
  try {
    const dbRef = ref(rtdb, 'emails_permitidos');
    const snapshot = await get(dbRef);
    if (snapshot.exists()) {
      const data = snapshot.val();
      if (Array.isArray(data)) {
        return data.filter(Boolean).map(email => String(email).trim().toLowerCase());
      } else if (typeof data === 'object') {
        return Object.values(data).filter(Boolean).map(email => String(email).trim().toLowerCase());
      }
    }
    
    // Se não existir, inicializa a lista no Firebase com o administrador padrão
    await set(dbRef, HARDCODED_ALLOWED_EMAILS);
    return HARDCODED_ALLOWED_EMAILS.map(email => email.toLowerCase());
  } catch (err) {
    console.warn('[Google Auth] Erro ao carregar emails_permitidos, usando fallback:', err);
    return HARDCODED_ALLOWED_EMAILS.map(email => email.toLowerCase());
  }
};

/**
 * Inicializa o listener de estado de autenticação com validação estrita de lista
 */
export const initAuth = (
  onAuthSuccess?: (user: User, token: string) => void,
  onAuthFailure?: () => void
) => {
  return onAuthStateChanged(auth, async (user: User | null) => {
    if (user) {
      try {
        const email = user.email?.trim().toLowerCase();
        const permitidos = await obterEmailsPermitidos();
        
        if (!email || !permitidos.includes(email)) {
          console.warn(`[Google Auth] Tentativa de login negada: o e-mail ${user.email} não está autorizado.`);
          await signOut(auth);
          cachedAccessToken = null;
          sessionStorage.removeItem('saga_oauth_access_token');
          if (onAuthFailure) onAuthFailure();
          return;
        }

        const savedToken = sessionStorage.getItem('saga_oauth_access_token');
        if (savedToken) {
          cachedAccessToken = savedToken;
        }
        
        if (cachedAccessToken) {
          if (onAuthSuccess) onAuthSuccess(user, cachedAccessToken);
        } else if (!isSigningIn) {
          cachedAccessToken = null;
          if (onAuthFailure) onAuthFailure();
        }
      } catch (err) {
        await signOut(auth);
        cachedAccessToken = null;
        sessionStorage.removeItem('saga_oauth_access_token');
        if (onAuthFailure) onAuthFailure();
      }
    } else {
      cachedAccessToken = null;
      sessionStorage.removeItem('saga_oauth_access_token');
      if (onAuthFailure) onAuthFailure();
    }
  });
};

/**
 * Realiza o login com o popup do Google e valida o e-mail contra a lista permitida
 */
export const googleSignIn = async (): Promise<{ user: User; accessToken: string } | null> => {
  try {
    isSigningIn = true;
    
    provider.setCustomParameters({
      prompt: 'select_account'
    });

    const result = await signInWithPopup(auth, provider);
    const user = result.user;
    const email = user.email?.trim().toLowerCase();
    
    // Validação estrita da lista de emails
    const permitidos = await obterEmailsPermitidos();
    if (!email || !permitidos.includes(email)) {
      await signOut(auth);
      cachedAccessToken = null;
      sessionStorage.removeItem('saga_oauth_access_token');
      throw new Error(`Acesso Negado: O e-mail "${user.email}" não está autorizado na lista de administradores do SAGA WMS.`);
    }

    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (!credential?.accessToken) {
      throw new Error('Não foi possível obter o token de acesso do Google.');
    }

    cachedAccessToken = credential.accessToken;
    sessionStorage.setItem('saga_oauth_access_token', cachedAccessToken);
    
    return { user, accessToken: cachedAccessToken };
  } catch (error: any) {
    console.error('Erro ao autenticar com o Google:', error);
    throw error;
  } finally {
    isSigningIn = false;
  }
};

/**
 * Obtém o token de acesso em cache
 */
export const getAccessToken = async (): Promise<string | null> => {
  if (!cachedAccessToken) {
    cachedAccessToken = sessionStorage.getItem('saga_oauth_access_token');
  }
  return cachedAccessToken;
};

/**
 * Define o token de acesso manualmente
 */
export const setAccessToken = (token: string | null) => {
  cachedAccessToken = token;
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
  await signOut(auth);
  cachedAccessToken = null;
  sessionStorage.removeItem('saga_oauth_access_token');
};
