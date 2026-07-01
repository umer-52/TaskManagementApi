import { Injectable } from '@nestjs/common';
import { BaseRepository } from '../../common/repositories/base.repositories';
import { DatabaseService } from '../../database/database.service';

import { Token, TokenType } from '../interfaces/Itoken.interface';

@Injectable()
export class TokensRepository extends BaseRepository<Token> {
  protected tableName = 'tokens';

  protected primaryKey = 'token_id';

  protected fillable = [
    'user_id',
    'token_type',
    'token_jti',
    'token_hash',
    'expires_at',
  ];

  protected useSoftDelete = false;

  constructor(protected readonly databaseService: DatabaseService) {
    super(databaseService);
  }

  async findActiveByJti(jti: string, type: TokenType): Promise<Token | null> {
    const result = await this.databaseService.query(
      `
      SELECT *
      FROM tokens
      WHERE token_jti = $1
      AND token_type = $2
      AND revoked_at IS NULL
      AND used_at IS NULL
      AND expires_at > NOW()
      LIMIT 1
      `,
      [jti, type],
    );

    return result.rows[0] || null;
  }

  async revokeByJti(jti: string, type: TokenType): Promise<Token | null> {
    const result = await this.databaseService.query(
      `
      UPDATE tokens
      SET revoked_at = NOW()
      WHERE token_jti = $1
      AND token_type = $2
      AND revoked_at IS NULL
      RETURNING *
      `,
      [jti, type],
    );

    return result.rows[0] || null;
  }

  async revokeAllForUser(userId: number, type?: TokenType): Promise<void> {
    if (type) {
      await this.databaseService.query(
        `
        UPDATE tokens
        SET revoked_at = NOW()
        WHERE user_id = $1
        AND token_type = $2
        AND revoked_at IS NULL
        `,
        [userId, type],
      );

      return;
    }

    await this.databaseService.query(
      `
      UPDATE tokens
      SET revoked_at = NOW()
      WHERE user_id = $1
      AND revoked_at IS NULL
      `,
      [userId],
    );
  }

  async markAsUsed(jti: string, type: TokenType): Promise<Token | null> {
    const result = await this.databaseService.query(
      `
      UPDATE tokens
      SET used_at = NOW()
      WHERE token_jti = $1
      AND token_type = $2
      AND used_at IS NULL
      RETURNING *
      `,
      [jti, type],
    );

    return result.rows[0] || null;
  }

  async deleteExpiredTokens(): Promise<void> {
    await this.databaseService.query(
      `
      DELETE FROM tokens
      WHERE expires_at < NOW()
      `,
    );
  }
}
