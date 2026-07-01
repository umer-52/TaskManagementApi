import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../../database/database.service';

export type PasswordResetToken = {
  password_reset_token_id: number;
  user_id: number;
  token_hash: string;
  expires_at: Date;
  used_at: Date | null;
  created_at: Date;
};

@Injectable()
export class PasswordResetTokenRepository {
  constructor(private readonly databaseService: DatabaseService) {}

  async create(
    userId: number,
    tokenHash: string,
    expiresAt: Date,
  ): Promise<PasswordResetToken> {
    const query = `
      INSERT INTO password_reset_tokens (
        user_id,
        token_hash,
        expires_at
      )
      VALUES ($1, $2, $3)
      RETURNING *
    `;

    const result = await this.databaseService.query(query, [
      userId,
      tokenHash,
      expiresAt,
    ]);

    return result.rows[0];
  }

  async findValidByTokenHash(
    tokenHash: string,
  ): Promise<PasswordResetToken | null> {
    const query = `
      SELECT *
      FROM password_reset_tokens
      WHERE token_hash = $1
        AND used_at IS NULL
        AND expires_at > NOW()
      LIMIT 1
    `;

    const result = await this.databaseService.query(query, [tokenHash]);

    return result.rows[0] ?? null;
  }

  async markAsUsed(passwordResetTokenId: number): Promise<void> {
    const query = `
      UPDATE password_reset_tokens
      SET used_at = NOW()
      WHERE password_reset_token_id = $1
    `;

    await this.databaseService.query(query, [passwordResetTokenId]);
  }

  async invalidateActiveTokensForUser(userId: number): Promise<void> {
    const query = `
      UPDATE password_reset_tokens
      SET used_at = NOW()
      WHERE user_id = $1
        AND used_at IS NULL
    `;

    await this.databaseService.query(query, [userId]);
  }
}
