export interface JwtPayload {
  sub: number;
  email: string;
  full_name: string;
  jti: string;
  type: 'access';
  iat?: number;
  exp?: number;
}
