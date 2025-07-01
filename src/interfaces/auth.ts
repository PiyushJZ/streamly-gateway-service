export interface CookiesData {
  accessToken: string | undefined;
  refreshToken: string | undefined;
  sessionId: string | undefined;
}

export interface AccessTokenPayload {
  id: string;
  email: string;
  username: string;
  refreshToken: string;
}

export interface RefreshTokenPayload {
  id: string;
}

export interface SessionCacheData {
  id: string;
  user_agent: string;
  ipaddress: string;
  location: string;
  userId: string;
}
