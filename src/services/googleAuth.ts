import { getAuth, signInWithPopup, GoogleAuthProvider, signOut, onAuthStateChanged, User } from 'firebase/auth';
import { app } from './firebase';

export const auth = getAuth(app);
const provider = new GoogleAuthProvider();

// Adiciona os escopos necessários
provider.addScope('https://www.googleapis.com/auth/userinfo.email');
provider.addScope('https://www.googleapis.com/auth/userinfo.profile');
provider.addScope('openid');
provider.addScope('https://www.googleapis.com/auth/spreadsheets');

let cachedAccessToken: string | null = null;
let isSigningIn = false;

/**
 * Inicializa o listener de estado de autenticação
 */
export const initAuth = (
  onAuthSuccess?: (user: User, token: string) => void,
  onAuthFailure?: () => void
) => {
  return onAuthStateChanged(auth, async (user: User | null) => {
    if (user) {
      // Tenta recuperar do sessionStorage para manter a sessão ao recarregar a página
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
    } else {
      cachedAccessToken = null;
      sessionStorage.removeItem('saga_oauth_access_token');
      if (onAuthFailure) onAuthFailure();
    }
  });
};

/**
 * Realiza o login com o popup do Google
 */
export const googleSignIn = async (): Promise<{ user: User; accessToken: string } | null> => {
  try {
    isSigningIn = true;
    
    // Configura o prompt para forçar a escolha da conta Google, resolvendo o bug
    // de mostrar sempre o mesmo e-mail sem dar a opção de trocar ou autenticar novamente!
    provider.setCustomParameters({
      prompt: 'select_account'
    });

    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (!credential?.accessToken) {
      throw new Error('Não foi possível obter o token de acesso do Google.');
    }

    cachedAccessToken = credential.accessToken;
    // Salva temporariamente no sessionStorage para resiliência a recarregamentos da aba
    sessionStorage.setItem('saga_oauth_access_token', cachedAccessToken);
    
    return { user: result.user, accessToken: cachedAccessToken };
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
