export interface UserContext {
  userId: string;
  scopes: string[];
}

export interface AuthorizationPayload {
  token: string;
}
