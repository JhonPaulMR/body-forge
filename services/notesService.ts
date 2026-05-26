import { db } from '@/database/schema';


export interface ExerciseNote {
  id: string;
  exercise_id: string;
  note_text: string;
  created_at: string;
}

export const getNotesForExercise = (exerciseId: string): ExerciseNote[] => {
  try {
    return db.getAllSync<ExerciseNote>(
      'SELECT * FROM exercise_notes WHERE exercise_id = ? ORDER BY created_at DESC',
      [exerciseId]
    );
  } catch (error) {
    console.error('Error fetching notes:', error);
    return [];
  }
};

export const addNote = (exerciseId: string, noteText: string): ExerciseNote | null => {
  try {
    const id = Math.random().toString(36).substring(2, 9) + Date.now().toString(36);
    const createdAt = new Date().toISOString();
    
    db.runSync(
      'INSERT INTO exercise_notes (id, exercise_id, note_text, created_at) VALUES (?, ?, ?, ?)',
      [id, exerciseId, noteText, createdAt]
    );
    
    return {
      id,
      exercise_id: exerciseId,
      note_text: noteText,
      created_at: createdAt
    };
  } catch (error) {
    console.error('Error adding note:', error);
    return null;
  }
};

export const updateNote = (id: string, noteText: string): boolean => {
  try {
    db.runSync('UPDATE exercise_notes SET note_text = ? WHERE id = ?', [noteText, id]);
    return true;
  } catch (error) {
    console.error('Error updating note:', error);
    return false;
  }
};

export const deleteNote = (id: string): boolean => {
  try {
    db.runSync('DELETE FROM exercise_notes WHERE id = ?', [id]);
    return true;
  } catch (error) {
    console.error('Error deleting note:', error);
    return false;
  }
};
