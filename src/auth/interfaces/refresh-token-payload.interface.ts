export interface RefreshTokenPayload {
  sub: number;
  jti: string;
  type: 'refresh';
  iat?: number;
  exp?: number;
}
