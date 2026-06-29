import { Injectable } from '@nestjs/common';
import { BaseRepository } from '../common/repositories/base.repositories';
import { DatabaseService } from '../database/database.service';
import { IUser } from './interfaces/user.interface';

@Injectable()
export class UsersRepository extends BaseRepository<IUser> {
  protected tableName = 'users';

  protected primaryKey = 'user_id';

  protected fillable = ['full_name', 'email', 'password_hash'];

  constructor(protected readonly databaseService: DatabaseService) {
    super(databaseService);
  }

  async findByEmail(email: string): Promise<IUser | null> {
    const result = await this.databaseService.query(
      `
        SELECT *
        FROM users
        WHERE email = $1
        AND is_deleted = false
        LIMIT 1
        `,
      [email],
    );

    return result.rows[0] || null;
  }
  async updatePassword(userId: number, passwordHash: string): Promise<void> {
    const query = `
    UPDATE users
    SET password_hash = $1
    WHERE user_id = $2
      AND is_deleted = false
  `;

    await this.databaseService.query(query, [passwordHash, userId]);
  }
}
