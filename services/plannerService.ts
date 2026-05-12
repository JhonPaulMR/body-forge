import { Alert } from 'react-native';
import { db } from '@/database/schema';

// ---- Types ----

export interface RoutineDay {
  id: string;
  day_name: string;
  order_index: number;
}

export interface DayExercise {
  id: string;
  exercise_id: string;
  order_index: number;
  superset_id: string | null;
  target_sets: number;
  target_reps: string;
  rest_time_seconds: number;
  name: string;
  muscle_group: string;
  image_uri: string | null;
}

export interface RenderItem {
  type: 'exercise' | 'superset';
  key: string;
  exercise?: DayExercise;
  supersetId?: string;
  exercises?: DayExercise[];
}

// ---- Routine CRUD ----

export function loadRoutineData(routineId: string) {
  try {
    const routine = db.getFirstSync<{ name: string; description: string | null; cover_image_uri: string | null }>(
      'SELECT name, description, cover_image_uri FROM routines WHERE id = ?', [routineId]
    );
    return routine;
  } catch (error) {
    console.error('Error loading routine:', error);
    return null;
  }
}

export function saveRoutine(routineId: string | null, planName: string, description: string, coverImageUri: string | null): string | null {
  if (!planName.trim()) {
    Alert.alert('Erro', 'Insira um nome para o plano.');
    return null;
  }
  try {
    if (routineId) {
      db.runSync('UPDATE routines SET name = ?, description = ?, cover_image_uri = ? WHERE id = ?',
        [planName.trim(), description.trim() || null, coverImageUri, routineId]);
      return routineId;
    }
    const id = 'routine_' + Date.now();
    db.runSync('INSERT INTO routines (id, user_id, name, description, cover_image_uri, is_builtin) VALUES (?, ?, ?, ?, ?, 0)',
      [id, 'user_1', planName.trim(), description.trim() || null, coverImageUri]);
    return id;
  } catch (error) {
    console.error('Error saving routine:', error);
    return null;
  }
}

// ---- Days & Exercises Loading ----

export function loadDaysAndExercises(routineId: string): { days: RoutineDay[]; exerciseMap: Record<string, DayExercise[]> } {
  try {
    const daysResult = db.getAllSync<RoutineDay>(
      'SELECT * FROM routine_days WHERE routine_id = ? ORDER BY order_index', [routineId]
    );
    const exMap: Record<string, DayExercise[]> = {};
    for (const day of daysResult) {
      exMap[day.id] = db.getAllSync<DayExercise>(
        `SELECT re.id, re.exercise_id, re.order_index, re.superset_id,
                re.target_sets, re.target_reps, re.rest_time_seconds,
                e.name, e.muscle_group, e.image_uri
         FROM routine_exercises re JOIN exercises e ON re.exercise_id = e.id
         WHERE re.routine_day_id = ? ORDER BY re.order_index`,
        [day.id]
      );
    }
    return { days: daysResult, exerciseMap: exMap };
  } catch (error) {
    console.error('Error loading days:', error);
    return { days: [], exerciseMap: {} };
  }
}

// ---- Day Operations ----

export function addDay(routineId: string): void {
  try {
    const maxIdx = db.getFirstSync<{ max_idx: number }>(
      'SELECT COALESCE(MAX(order_index), 0) as max_idx FROM routine_days WHERE routine_id = ?', [routineId]
    );
    const dayId = 'rd_' + Date.now();
    db.runSync('INSERT INTO routine_days (id, routine_id, day_name, order_index) VALUES (?, ?, ?, ?)',
      [dayId, routineId, `Dia ${(maxIdx?.max_idx || 0) + 1}`, (maxIdx?.max_idx || 0) + 1]);
  } catch (error) {
    console.error('Error adding day:', error);
  }
}

export function duplicateDay(day: RoutineDay, routineId: string, dayExercises: DayExercise[]): void {
  try {
    const maxIdx = db.getFirstSync<{ max_idx: number }>('SELECT COALESCE(MAX(order_index), 0) as max_idx FROM routine_days WHERE routine_id = ?', [routineId]);
    const newDayId = 'rd_dup_' + Date.now();
    db.runSync('INSERT INTO routine_days (id, routine_id, day_name, order_index) VALUES (?, ?, ?, ?)',
      [newDayId, routineId, day.day_name + ' (cópia)', (maxIdx?.max_idx || 0) + 1]);
    for (const ex of dayExercises) {
      db.runSync(`INSERT INTO routine_exercises (id, routine_day_id, exercise_id, order_index, superset_id, target_sets, target_reps, rest_time_seconds) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        ['re_dup_' + Date.now() + '_' + ex.order_index, newDayId, ex.exercise_id, ex.order_index, null, ex.target_sets, ex.target_reps, ex.rest_time_seconds]);
    }
  } catch (e) {
    console.error('Error duplicating day:', e);
  }
}

export function deleteDay(dayId: string): void {
  try {
    db.runSync('DELETE FROM routine_exercises WHERE routine_day_id = ?', [dayId]);
    db.runSync('DELETE FROM routine_days WHERE id = ?', [dayId]);
  } catch (e) {
    console.error('Error deleting day:', e);
  }
}

// ---- Exercise Operations ----

export function duplicateExercise(ex: DayExercise, dayId: string): void {
  try {
    const maxIdx = db.getFirstSync<{ max_idx: number }>(
      'SELECT COALESCE(MAX(order_index), 0) as max_idx FROM routine_exercises WHERE routine_day_id = ?', [dayId]
    );
    db.runSync(
      `INSERT INTO routine_exercises (id, routine_day_id, exercise_id, order_index, superset_id, target_sets, target_reps, rest_time_seconds) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      ['re_dup_' + Date.now(), dayId, ex.exercise_id, (maxIdx?.max_idx || 0) + 1, null, ex.target_sets, ex.target_reps, ex.rest_time_seconds]
    );
  } catch (e) {
    console.error('Error duplicating exercise:', e);
  }
}

export function deleteExercise(reId: string): void {
  try {
    db.runSync('DELETE FROM routine_exercises WHERE id = ?', [reId]);
  } catch (e) {
    console.error('Error deleting exercise:', e);
  }
}

export function removeFromSuperset(exerciseId: string): void {
  try {
    db.runSync('UPDATE routine_exercises SET superset_id = NULL WHERE id = ?', [exerciseId]);
  } catch (e) {
    console.error('Error removing from superset:', e);
  }
}

// ---- Superset Operations ----

export function createSuperset(dayId: string, selections: string[], dayExercises: DayExercise[]): void {
  if (selections.length < 2) return;
  try {
    const ssId = 'ss_' + Date.now();
    const ssReIds = new Set<string>();
    for (const exId of selections) {
      const re = dayExercises.find((e) => e.id === exId);
      if (re) {
        ssReIds.add(re.id);
        db.runSync('UPDATE routine_exercises SET superset_id = ? WHERE id = ?', [ssId, re.id]);
      }
    }
    const ssExs = selections.map((exId) => dayExercises.find((e) => e.id === exId)).filter(Boolean) as DayExercise[];
    const reordered: DayExercise[] = [];
    let inserted = false;
    for (const e of dayExercises) {
      if (ssReIds.has(e.id)) {
        if (!inserted) { reordered.push(...ssExs); inserted = true; }
      } else {
        reordered.push(e);
      }
    }
    let orderIdx = 1;
    for (const e of reordered) {
      db.runSync('UPDATE routine_exercises SET order_index = ? WHERE id = ?', [orderIdx, e.id]);
      orderIdx++;
    }
  } catch (e) {
    console.error('Error creating superset:', e);
  }
}

export function dissolveSuperset(supersetId: string): void {
  try {
    db.runSync('UPDATE routine_exercises SET superset_id = NULL WHERE superset_id = ?', [supersetId]);
  } catch (e) {
    console.error('Error dissolving superset:', e);
  }
}

export function deleteSupersetExercises(supersetId: string): void {
  try {
    db.runSync('DELETE FROM routine_exercises WHERE superset_id = ?', [supersetId]);
  } catch (e) {
    console.error('Error deleting superset:', e);
  }
}

// ---- Reorder ----

export function reorderExercises(data: RenderItem[]): void {
  try {
    let orderIdx = 1;
    for (const item of data) {
      if (item.type === 'superset' && item.exercises) {
        for (const ex of item.exercises) {
          db.runSync('UPDATE routine_exercises SET order_index = ? WHERE id = ?', [orderIdx, ex.id]);
          orderIdx++;
        }
      } else if (item.exercise) {
        db.runSync('UPDATE routine_exercises SET order_index = ? WHERE id = ?', [orderIdx, item.exercise.id]);
        orderIdx++;
      }
    }
  } catch (e) {
    console.error('Error reordering:', e);
  }
}
