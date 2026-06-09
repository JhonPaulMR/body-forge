import { db } from '../schema';

export interface Exercise {
  id: string;
  api_id?: string;
  name: string;
  muscle_group?: string;
  body_part?: string;
  equipment?: string;
  target?: string;
  instructions?: string;
  image_uri?: string;
  gif_url?: string;
  is_custom: number;
}

export class ExerciseRepository {
  static up() {
    db.execSync(`
      CREATE TABLE IF NOT EXISTS exercises (
          id TEXT PRIMARY KEY,
          api_id TEXT UNIQUE,
          name TEXT NOT NULL,
          muscle_group TEXT,
          body_part TEXT,
          equipment TEXT,
          target TEXT,
          instructions TEXT,
          image_uri TEXT,
          gif_url TEXT,
          is_custom INTEGER DEFAULT 0,
          user_id TEXT,
          FOREIGN KEY(user_id) REFERENCES users(id)
      );
    `);
    
    // Migrations to add new columns if the table already existed
    try { db.runSync('ALTER TABLE exercises ADD COLUMN api_id TEXT UNIQUE'); } catch (_) {}
    try { db.runSync('ALTER TABLE exercises ADD COLUMN body_part TEXT'); } catch (_) {}
    try { db.runSync('ALTER TABLE exercises ADD COLUMN target TEXT'); } catch (_) {}
    try { db.runSync('ALTER TABLE exercises ADD COLUMN gif_url TEXT'); } catch (_) {}
  }

  static async seed() {
    const count = db.getFirstSync<{ c: number }>('SELECT count(*) as c FROM exercises WHERE api_id IS NOT NULL');
    if (count && count.c > 0) return; // Already seeded

    try {
      const data = require('../../assets/data/exercises_seed.json');
      if (!data || data.length === 0) return;

      console.log('Seeding exercises...');
      
      db.withTransactionSync(() => {
        // Insert in batches of 100
        const batchSize = 100;
        for (let i = 0; i < data.length; i += batchSize) {
          const batch = data.slice(i, i + batchSize);
          const placeholders = batch.map(() => '(?, ?, ?, ?, ?, ?, ?, ?)').join(',');
          const values = batch.flatMap((ex: any) => [
            'ex_' + ex.api_id,
            ex.api_id,
            ex.name,
            ex.body_part,
            ex.equipment,
            ex.target,
            ex.instructions || '',
            ex.gif_url
          ]);

          db.runSync(`
            INSERT OR IGNORE INTO exercises (id, api_id, name, body_part, equipment, target, instructions, gif_url)
            VALUES ${placeholders}
          `, values);
        }
      });
      console.log('Seeding completed.');
    } catch (e) {
      console.log('Seed file not found or error:', e);
    }
  }

  static async getAllPaginated(limit: number, offset: number): Promise<Exercise[]> {
    return db.getAllAsync<Exercise>(
      'SELECT * FROM exercises WHERE api_id IS NOT NULL ORDER BY name ASC LIMIT ? OFFSET ?',
      [limit, offset]
    );
  }

  static async search(query: string, limit: number, offset: number): Promise<Exercise[]> {
    return db.getAllAsync<Exercise>(
      'SELECT * FROM exercises WHERE name LIKE ? OR target LIKE ? OR body_part LIKE ? ORDER BY name ASC LIMIT ? OFFSET ?',
      [`%${query}%`, `%${query}%`, `%${query}%`, limit, offset]
    );
  }
}
