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


  static async getAllPaginated(limit: number, offset: number): Promise<Exercise[]> {
    return db.getAllAsync<Exercise>(
      'SELECT * FROM exercises WHERE api_id IS NOT NULL ORDER BY name ASC LIMIT ? OFFSET ?',
      [limit, offset]
    );
  }

  static getAllExercisesForPicker(): Exercise[] {
    return db.getAllSync<Exercise>(
      'SELECT id, name, muscle_group, equipment, image_uri, gif_url FROM exercises ORDER BY muscle_group, name'
    );
  }

  static createCustomExercise(data: { id: string, name: string, muscleGroupData: string, category: string, instructions: string, imageUri: string | null }): void {
    db.runSync(
      `INSERT INTO exercises (id, name, muscle_group, equipment, instructions, image_uri, is_custom)
       VALUES (?, ?, ?, ?, ?, ?, 1)`,
      [data.id, data.name, data.muscleGroupData, data.category, data.instructions, data.imageUri]
    );
  }

  static async search(query: string, limit: number, offset: number): Promise<Exercise[]> {
    return db.getAllAsync<Exercise>(
      'SELECT * FROM exercises WHERE name LIKE ? OR target LIKE ? OR body_part LIKE ? ORDER BY name ASC LIMIT ? OFFSET ?',
      [`%${query}%`, `%${query}%`, `%${query}%`, limit, offset]
    );
  }

  static updateCustomExercise(id: string, data: { name: string, muscleGroupData: string, category: string, instructions: string, imageUri: string | null }): void {
    db.runSync(
      `UPDATE exercises SET name = ?, muscle_group = ?, equipment = ?, instructions = ?, image_uri = ? WHERE id = ? AND is_custom = 1`,
      [data.name, data.muscleGroupData, data.category, data.instructions, data.imageUri, id]
    );
  }

  static deleteCustomExercise(id: string): void {
    db.withTransactionSync(() => {
      // 1. Apagar mídia e notas
      db.runSync('DELETE FROM exercise_media WHERE exercise_id = ?', [id]);
      db.runSync('DELETE FROM exercise_notes WHERE exercise_id = ?', [id]);
      
      // 2. Apagar das rotinas (Planos)
      db.runSync('DELETE FROM routine_exercises WHERE exercise_id = ?', [id]);
      
      // 3. Apagar do histórico (Hard delete em cascata para evitar constraint error)
      db.runSync('DELETE FROM sets WHERE session_exercise_id IN (SELECT id FROM session_exercises WHERE exercise_id = ?)', [id]);
      db.runSync('DELETE FROM session_exercises WHERE exercise_id = ?', [id]);
      
      // 4. Apagar o exercício
      db.runSync('DELETE FROM exercises WHERE id = ? AND is_custom = 1', [id]);
    });
  }
}
