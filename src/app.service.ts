import { Injectable } from '@nestjs/common';
import { DatabaseService } from './database/database.service';

@Injectable()
export class AppService {
  constructor(private readonly databaseService: DatabaseService) {}

  getHello(): string {
    return 'Hello World!';
  }

  async dbHealth() {
    const result = await this.databaseService.query(`
      SELECT
        current_database() AS database_name,
        current_user AS username
    `);

    return {
      connected: true,
      result: result.rows,
    };
  }
}
