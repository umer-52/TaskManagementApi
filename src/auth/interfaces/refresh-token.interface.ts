export interface RefreshToken {
  refresh_token_id: number;
  user_id: number;
  token_jti: string;
  token_hash: string;
  expires_at: Date;
  revoked_at: Date | null;
  created_at: Date;
}
