import { db } from '@/database/schema';
import { Image } from 'expo-image';
import { Exercise } from '@/database/repositories/ExerciseRepository';

export class WorkoutPlanService {
  /**
   * Adiciona um exercício a um dia de treino (routine_day).
   * Faz o prefetch do GIF para cache em disco (offline-first).
   */
  static async addExerciseToRoutineDay(routineDayId: string, exercise: Exercise, orderIndex: number = 0) {
    try {
      const routineExerciseId = 're_' + Math.random().toString(36).substr(2, 9);
      
      db.runSync(`
        INSERT INTO routine_exercises (id, routine_day_id, exercise_id, order_index, target_sets, rest_time_seconds)
        VALUES (?, ?, ?, ?, ?, ?)
      `, [routineExerciseId, routineDayId, exercise.id, orderIndex, 3, 60]);

      // Cache Seletivo Inteligente:
      // Pede para o expo-image baixar a mídia e guardar no disco físico
      if (exercise.gif_url) {
        console.log('[Prefetch] Guardando GIF no cache de disco para treino offline:', exercise.gif_url);
        Image.prefetch(exercise.gif_url);
      }

      return routineExerciseId;
    } catch (e) {
      console.error('Erro ao adicionar exercício na rotina:', e);
      throw e;
    }
  }
}
