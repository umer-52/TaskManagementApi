import { DatabaseService } from 'src/database/database.service';
export abstract class BaseRepository<T> {
  protected abstract tableName: string;
  protected abstract primaryKey: string;
  protected abstract fillable: string[];
  protected useSoftDelete: boolean = true;
  constructor(protected readonly databaseService: DatabaseService) {}

  async findAll(): Promise<T[]> {
    let query = `SELECT * FROM ${this.tableName}`;
    if (this.useSoftDelete) {
      query += ` WHERE is_deleted = false`;
    }
    const result = await this.databaseService.query(query);
    return result.rows;
  }

  async findById(id: number): Promise<T | null> {
    let query = `
      SELECT *
      FROM ${this.tableName}
      WHERE ${this.primaryKey} = $1
    `;

    if (this.useSoftDelete) {
      query += `
        AND is_deleted = false
      `;
    }

    query += `
      LIMIT 1
    `;

    const result = await this.databaseService.query(query, [id]);

    return result.rows[0] || null;
  }

  async create(data: Partial<T>): Promise<T> {
    const filteredData = Object.fromEntries(
      Object.entries(data).filter(([key]) => this.fillable.includes(key)),
    );

    const columns = Object.keys(filteredData);

    const values = Object.values(filteredData);

    const placeholders = columns.map((_, index) => `$${index + 1}`).join(', ');

    const query = `
      INSERT INTO ${this.tableName}
      (${columns.join(', ')})
      VALUES (${placeholders})
      RETURNING *
    `;

    const result = await this.databaseService.query(query, values);

    return result.rows[0];
  }

  async update(id: number, data: Partial<T>): Promise<T | null> {
    const columns = Object.keys(data);

    const values = Object.values(data);

    const setClause = columns
      .map((column, index) => `${column} = $${index + 1}`)
      .join(', ');

    let query = `
      UPDATE ${this.tableName}
      SET ${setClause}
      WHERE ${this.primaryKey} = $${columns.length + 1}
    `;

    if (this.useSoftDelete) {
      query += `
        AND is_deleted = false
      `;
    }

    query += `
      RETURNING *
    `;

    const result = await this.databaseService.query(query, [...values, id]);

    return result.rows[0] || null;
  }

  async delete(id: number): Promise<T | null> {
    if (this.useSoftDelete) {
      const query = `
        UPDATE ${this.tableName}
        SET is_deleted = true
        WHERE ${this.primaryKey} = $1
        RETURNING *
      `;

      const result = await this.databaseService.query(query, [id]);

      return result.rows[0] || null;
    }

    const query = `
      DELETE
      FROM ${this.tableName}
      WHERE ${this.primaryKey} = $1
      RETURNING *
    `;

    const result = await this.databaseService.query(query, [id]);

    return result.rows[0] || null;
  }
}
