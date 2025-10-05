export interface UserContext {
  userId: string;
  scopes: string[];
}

export interface AuthorizationPayload {
  token: string;
}

export interface IAuthService {
  validateToken(token: string | undefined | null): UserContext | null;
}
