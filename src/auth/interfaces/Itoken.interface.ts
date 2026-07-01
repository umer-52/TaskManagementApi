export type TokenType = 'access' | 'refresh' | 'password_reset';

export interface Token {
  token_id: number;
  user_id: number;
  token_type: TokenType;
  token_jti: string;
  token_hash: string;
  expires_at: Date;
  revoked_at: Date | null;
  used_at: Date | null;
  created_at: Date;
}
