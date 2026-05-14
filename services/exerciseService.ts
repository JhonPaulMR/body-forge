import { db } from '@/database/schema';

export interface Exercise {
  id: string;
  name: string;
  muscle_group: string;
  equipment: string;
  instructions: string | null;
  image_uri: string | null;
  is_custom: number;
}

export const getExerciseById = (id: string): Exercise | null => {
  try {
    return db.getFirstSync<Exercise>('SELECT * FROM exercises WHERE id = ?', [id]);
  } catch (error) {
    console.error('Error loading exercise:', error);
    return null;
  }
};
