import { db } from '../schema';

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
  set_configs?: string | null;
}

export interface RenderItem {
  type: 'exercise' | 'superset';
  key: string;
  exercise?: DayExercise;
  supersetId?: string;
  exercises?: DayExercise[];
}

export class RoutineRepository {
  static loadRoutineData(routineId: string) {
    return db.getFirstSync<{ name: string; description: string | null; cover_image_uri: string | null; is_builtin: number }>(
      'SELECT name, description, cover_image_uri, is_builtin FROM routines WHERE id = ?', [routineId]
    );
  }

  static saveRoutine(routineId: string | null, planName: string, description: string, coverImageUri: string | null): string | null {
    if (routineId) {
      db.runSync('UPDATE routines SET name = ?, description = ?, cover_image_uri = ? WHERE id = ?',
        [planName, description || null, coverImageUri, routineId]);
      return routineId;
    }
    const id = 'routine_' + Date.now();
    db.runSync('INSERT INTO routines (id, user_id, name, description, cover_image_uri, is_builtin) VALUES (?, ?, ?, ?, ?, 0)',
      [id, 'user_1', planName, description || null, coverImageUri]);
    return id;
  }

  static loadDaysAndExercises(routineId: string): { days: RoutineDay[]; exerciseMap: Record<string, DayExercise[]> } {
    const daysResult = db.getAllSync<RoutineDay>(
      'SELECT * FROM routine_days WHERE routine_id = ? ORDER BY order_index', [routineId]
    );
    const exMap: Record<string, DayExercise[]> = {};
    for (const day of daysResult) {
      exMap[day.id] = db.getAllSync<DayExercise>(
        `SELECT re.id, re.exercise_id, re.order_index, re.superset_id,
                re.target_sets, re.target_reps, re.rest_time_seconds, re.set_configs,
                e.name, e.muscle_group, COALESCE(e.gif_url, e.image_uri) as image_uri
         FROM routine_exercises re JOIN exercises e ON re.exercise_id = e.id
         WHERE re.routine_day_id = ? ORDER BY re.order_index`,
        [day.id]
      );
    }
    return { days: daysResult, exerciseMap: exMap };
  }

  static addDay(routineId: string): void {
    const maxIdx = db.getFirstSync<{ max_idx: number }>(
      'SELECT COALESCE(MAX(order_index), 0) as max_idx FROM routine_days WHERE routine_id = ?', [routineId]
    );
    const dayId = 'rd_' + Date.now();
    db.runSync('INSERT INTO routine_days (id, routine_id, day_name, order_index) VALUES (?, ?, ?, ?)',
      [dayId, routineId, `Dia ${(maxIdx?.max_idx || 0) + 1}`, (maxIdx?.max_idx || 0) + 1]);
  }

  static updateDayName(dayId: string, name: string): void {
    db.runSync('UPDATE routine_days SET day_name = ? WHERE id = ?', [name, dayId]);
  }

  static duplicateDay(day: RoutineDay, routineId: string, dayExercises: DayExercise[]): void {
    const maxIdx = db.getFirstSync<{ max_idx: number }>('SELECT COALESCE(MAX(order_index), 0) as max_idx FROM routine_days WHERE routine_id = ?', [routineId]);
    const newDayId = 'rd_dup_' + Date.now();
    db.runSync('INSERT INTO routine_days (id, routine_id, day_name, order_index) VALUES (?, ?, ?, ?)',
      [newDayId, routineId, day.day_name + ' (cópia)', (maxIdx?.max_idx || 0) + 1]);
    for (const ex of dayExercises) {
      db.runSync(`INSERT INTO routine_exercises (id, routine_day_id, exercise_id, order_index, superset_id, target_sets, target_reps, rest_time_seconds) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        ['re_dup_' + Date.now() + '_' + ex.order_index, newDayId, ex.exercise_id, ex.order_index, null, ex.target_sets, ex.target_reps, ex.rest_time_seconds]);
    }
  }

  static deleteDay(dayId: string): void {
    db.runSync('DELETE FROM routine_exercises WHERE routine_day_id = ?', [dayId]);
    db.runSync('DELETE FROM routine_days WHERE id = ?', [dayId]);
  }

  static duplicateRoutine(routineId: string): string {
    const routine = db.getFirstSync<{ name: string; description: string | null; cover_image_uri: string | null }>(
      'SELECT name, description, cover_image_uri FROM routines WHERE id = ?', [routineId]
    );
    if (!routine) throw new Error('Routine not found');

    const newRoutineId = 'routine_' + Date.now();
    db.runSync(
      'INSERT INTO routines (id, user_id, name, description, cover_image_uri, is_builtin) VALUES (?, ?, ?, ?, ?, 0)',
      [newRoutineId, 'user_1', routine.name + ' (Cópia)', routine.description, routine.cover_image_uri]
    );

    const days = db.getAllSync<RoutineDay>('SELECT * FROM routine_days WHERE routine_id = ? ORDER BY order_index', [routineId]);
    for (const day of days) {
      const newDayId = 'rd_' + Math.random().toString(36).substr(2, 9);
      db.runSync(
        'INSERT INTO routine_days (id, routine_id, day_name, order_index) VALUES (?, ?, ?, ?)',
        [newDayId, newRoutineId, day.day_name, day.order_index]
      );

      const exercises = db.getAllSync<DayExercise>(
        'SELECT * FROM routine_exercises WHERE routine_day_id = ? ORDER BY order_index', [day.id]
      );
      for (const ex of exercises) {
        db.runSync(
          'INSERT INTO routine_exercises (id, routine_day_id, exercise_id, order_index, superset_id, target_sets, target_reps, rest_time_seconds, set_configs) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
          ['re_' + Math.random().toString(36).substr(2, 9), newDayId, ex.exercise_id, ex.order_index, ex.superset_id ?? null, ex.target_sets, ex.target_reps, ex.rest_time_seconds, ex.set_configs ?? null]
        );
      }
    }
    return newRoutineId;
  }

  static duplicateExercise(ex: DayExercise, dayId: string): void {
    const maxIdx = db.getFirstSync<{ max_idx: number }>(
      'SELECT COALESCE(MAX(order_index), 0) as max_idx FROM routine_exercises WHERE routine_day_id = ?', [dayId]
    );
    db.runSync(
      `INSERT INTO routine_exercises (id, routine_day_id, exercise_id, order_index, superset_id, target_sets, target_reps, rest_time_seconds) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      ['re_dup_' + Date.now(), dayId, ex.exercise_id, (maxIdx?.max_idx || 0) + 1, null, ex.target_sets, ex.target_reps, ex.rest_time_seconds]
    );
  }

  static deleteExercise(reId: string): void {
    db.runSync('DELETE FROM routine_exercises WHERE id = ?', [reId]);
  }

  static removeFromSuperset(exerciseId: string): void {
    db.runSync('UPDATE routine_exercises SET superset_id = NULL WHERE id = ?', [exerciseId]);
  }

  static createSuperset(dayId: string, selections: string[], dayExercises: DayExercise[]): void {
    if (selections.length < 2) return;
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
  }

  static dissolveSuperset(supersetId: string): void {
    db.runSync('UPDATE routine_exercises SET superset_id = NULL WHERE superset_id = ?', [supersetId]);
  }

  static deleteSupersetExercises(supersetId: string): void {
    db.runSync('DELETE FROM routine_exercises WHERE superset_id = ?', [supersetId]);
  }

  static reorderExercises(data: RenderItem[]): void {
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
  }

  static getRoutine(routineId: string) {
    return db.getFirstSync<{ id: string; name: string; description: string | null; cover_image_uri: string | null }>(
      'SELECT id, name, description, cover_image_uri FROM routines WHERE id = ?', [routineId]
    );
  }

  static getRoutineDay(dayId: string) {
    return db.getFirstSync<RoutineDay>(
      'SELECT id, day_name, order_index FROM routine_days WHERE id = ?', [dayId]
    );
  }

  static getDayExercises(dayId: string) {
    return db.getAllSync<DayExercise>(
      `SELECT re.id, re.exercise_id, re.order_index, re.superset_id, re.target_sets, re.target_reps, re.rest_time_seconds, re.set_configs,
              e.name, e.muscle_group, COALESCE(e.gif_url, e.image_uri) as image_uri
       FROM routine_exercises re
       JOIN exercises e ON re.exercise_id = e.id
       WHERE re.routine_day_id = ?
       ORDER BY re.order_index`,
      [dayId]
    );
  }

  static getRoutineDays(routineId: string) {
    return db.getAllSync<RoutineDay>(
      'SELECT id, day_name, order_index FROM routine_days WHERE routine_id = ? ORDER BY order_index ASC',
      [routineId]
    );
  }

  static getDayExercisesStats(dayId: string) {
    return db.getAllSync<{ target_sets: number, rest_time_seconds: number, superset_id: string | null, muscle_group: string }>(
      `SELECT re.target_sets, re.rest_time_seconds, re.superset_id, e.muscle_group
       FROM routine_exercises re
       JOIN exercises e ON re.exercise_id = e.id
       WHERE re.routine_day_id = ?`,
      [dayId]
    );
  }

  static getOriginalExercisesForSummary(routineDayId: string) {
    return db.getAllSync<any>(`
      SELECT re.*, e.name 
      FROM routine_exercises re 
      JOIN exercises e ON re.exercise_id = e.id 
      WHERE re.routine_day_id = ? 
      ORDER BY re.order_index
    `, [routineDayId]);
  }

  static updateRoutineExercises(routineDayId: string, finalExercises: any[]): void {
    db.withTransactionSync(() => {
      db.runSync('DELETE FROM routine_exercises WHERE routine_day_id = ?', [routineDayId]);
      
      finalExercises.forEach((ex, index) => {
        const reId = 're_' + Math.random().toString(36).substr(2, 9);
        const targetSets = ex.sets.length > 0 ? ex.sets.length : 1;
        const setConfigs = ex.sets.map((s: any) => ({
          warmup: s.is_warmup || false,
          dropSet: s.is_dropset || false,
          untilFailure: s.is_to_failure || false,
          minReps: parseInt((ex.target_reps || '8-12').split('-')[0]) || 8,
          maxReps: parseInt((ex.target_reps || '8-12').split('-')[1] || (ex.target_reps || '12')) || 12,
          restTime: ex.rest_time_seconds || 90,
        }));

        db.runSync(`
          INSERT INTO routine_exercises 
          (id, routine_day_id, exercise_id, order_index, superset_id, target_sets, target_reps, rest_time_seconds, set_configs)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
          reId, 
          routineDayId, 
          ex.exercise_id, 
          index, 
          ex.superset_id || null, 
          targetSets, 
          ex.target_reps || '8-12', 
          ex.rest_time_seconds || 90,
          JSON.stringify(setConfigs)
        ]);
      });
    });
  }

  static getDayExercisesIds(dayId: string): string[] {
    const result = db.getAllSync<{ exercise_id: string }>(
      'SELECT exercise_id FROM routine_exercises WHERE routine_day_id = ?',
      [dayId]
    );
    return result.map(r => r.exercise_id);
  }

  static addExercisesToDay(dayId: string, selectedIds: Set<string>, supersetIds: Set<string>): void {
    db.withTransactionSync(() => {
      const maxIdx = db.getFirstSync<{ max_idx: number }>(
        'SELECT COALESCE(MAX(order_index), 0) as max_idx FROM routine_exercises WHERE routine_day_id = ?',
        [dayId]
      );
      let nextIndex = (maxIdx?.max_idx || 0) + 1;

      const supersetGroupId = supersetIds.size >= 2 ? 'ss_' + Date.now() : null;

      const stmt = db.prepareSync(
        `INSERT INTO routine_exercises
          (id, routine_day_id, exercise_id, order_index, superset_id, target_sets, target_reps, rest_time_seconds)
         VALUES (?, ?, ?, ?, ?, 3, '8-12', 90)`
      );

      for (const exId of selectedIds) {
        const reId = 're_' + Date.now() + '_' + nextIndex;
        const ssId = supersetIds.has(exId) ? supersetGroupId : null;
        stmt.executeSync([reId, dayId, exId, nextIndex, ssId]);
        nextIndex++;
      }
    });
  }

  static updateSetConfigs(id: string, configs: string, targetSets: number): void {
    db.runSync('UPDATE routine_exercises SET set_configs = ?, target_sets = ? WHERE id = ?',
      [configs, targetSets, id]);
  }

  static getExerciseInfoForEdit(id: string) {
    return db.getFirstSync<{ reId: string; name: string; muscle_group: string; set_configs: string | null; target_sets: number; target_reps: string; rest_time_seconds: number }>(
      `SELECT re.id as reId, e.name, e.muscle_group, re.set_configs, re.target_sets, re.target_reps, re.rest_time_seconds
       FROM routine_exercises re JOIN exercises e ON re.exercise_id = e.id
       WHERE re.id = ?`, [id]
    );
  }

  static getExerciseSetsForEdit(id: string) {
    return db.getFirstSync<{ set_configs: string | null; target_sets: number; target_reps: string; rest_time_seconds: number }>(
      'SELECT set_configs, target_sets, target_reps, rest_time_seconds FROM routine_exercises WHERE id = ?', [id]
    );
  }
}
