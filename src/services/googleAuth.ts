let cachedAccessToken: string | null = null;

/**
 * Obtém o token de acesso em cache
 */
export const getAccessToken = async (): Promise<string | null> => {
  return cachedAccessToken;
};

/**
 * Define o token de acesso
 */
export const setAccessToken = (token: string | null) => {
  cachedAccessToken = token;
};
