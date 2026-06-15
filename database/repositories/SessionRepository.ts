import { db } from '../schema';
import { WorkoutExercise } from '@/hooks/useWorkoutStore';

export interface HistorySession {
  id: string;
  name: string;
  start_time: string;
  end_time: string | null;
  total_volume_kg: number;
  session_notes: string | null;
  total_sets: number;
  duration_seconds: number;
  exercises?: HistoryExercise[];
}

export interface HistoryExercise {
  id: string;
  exercise_id: string;
  name: string;
  image_uri: string | null;
  muscle_group: string | null;
  order_index: number;
  superset_id: string | null;
  sets: HistorySet[];
}

export interface HistorySet {
  id: string;
  weight: number;
  reps: number;
  is_completed: boolean;
  is_warmup: boolean;
  is_dropset: boolean;
  is_to_failure: boolean;
  set_order: number;
}

export class SessionRepository {
  static getHistoryDates(year: number, month: number): string[] {
    const monthStr = month.toString().padStart(2, '0');
    const query = `
      SELECT DISTINCT date(start_time) as session_date 
      FROM sessions 
      WHERE strftime('%Y', start_time) = ? AND strftime('%m', start_time) = ?
    `;
    const rows = db.getAllSync<{session_date: string}>(query, [year.toString(), monthStr]);
    return rows.map(r => r.session_date);
  }

  static getSessionsForMonth(year: number, month: number): HistorySession[] {
    const monthStr = month.toString().padStart(2, '0');
    
    const query = `
      SELECT 
        s.id, s.start_time, s.end_time, s.total_volume_kg, s.session_notes,
        COALESCE(rd.day_name, 'Treino Livre') as name,
        (SELECT COUNT(*) FROM sets st JOIN session_exercises se ON st.session_exercise_id = se.id WHERE se.session_id = s.id) as total_sets
      FROM sessions s
      LEFT JOIN routine_days rd ON s.routine_day_id = rd.id
      WHERE strftime('%Y', s.start_time) = ? AND strftime('%m', s.start_time) = ?
      ORDER BY s.start_time DESC
    `;
    const rows = db.getAllSync<any>(query, [year.toString(), monthStr]);
    
    return rows.map(r => {
      let duration = 0;
      if (r.start_time && r.end_time) {
        duration = Math.floor((new Date(r.end_time).getTime() - new Date(r.start_time).getTime()) / 1000);
      }
      return {
        id: r.id,
        name: r.name,
        start_time: r.start_time,
        end_time: r.end_time,
        total_volume_kg: r.total_volume_kg || 0,
        session_notes: r.session_notes,
        total_sets: r.total_sets,
        duration_seconds: duration,
      };
    });
  }

  static getSessionDetails(sessionId: string): HistorySession | null {
    const query = `
      SELECT 
        s.id, s.start_time, s.end_time, s.total_volume_kg, s.session_notes,
        COALESCE(rd.day_name, 'Treino Livre') as name,
        (SELECT COUNT(*) FROM sets st JOIN session_exercises se ON st.session_exercise_id = se.id WHERE se.session_id = s.id) as total_sets
      FROM sessions s
      LEFT JOIN routine_days rd ON s.routine_day_id = rd.id
      WHERE s.id = ?
    `;
    const sessionRow = db.getFirstSync<any>(query, [sessionId]);
    if (!sessionRow) return null;

    let duration = 0;
    if (sessionRow.start_time && sessionRow.end_time) {
      duration = Math.floor((new Date(sessionRow.end_time).getTime() - new Date(sessionRow.start_time).getTime()) / 1000);
    }

    const session: HistorySession = {
      id: sessionRow.id,
      name: sessionRow.name,
      start_time: sessionRow.start_time,
      end_time: sessionRow.end_time,
      total_volume_kg: sessionRow.total_volume_kg || 0,
      session_notes: sessionRow.session_notes,
      total_sets: sessionRow.total_sets,
      duration_seconds: duration,
      exercises: []
    };

    const exQuery = `
      SELECT se.id, se.exercise_id, se.order_index, se.superset_id, e.name, COALESCE(e.gif_url, e.image_uri) as image_uri, e.muscle_group
      FROM session_exercises se
      JOIN exercises e ON se.exercise_id = e.id
      WHERE se.session_id = ?
      ORDER BY se.order_index ASC
    `;
    const exRows = db.getAllSync<any>(exQuery, [sessionId]);

    const exercisesMap = new Map<string, HistoryExercise>();
    for (const er of exRows) {
      const ex: HistoryExercise = {
        id: er.id,
        exercise_id: er.exercise_id,
        name: er.name,
        image_uri: er.image_uri,
        muscle_group: er.muscle_group,
        order_index: er.order_index,
        superset_id: er.superset_id || null,
        sets: []
      };
      exercisesMap.set(er.id, ex);
      session.exercises!.push(ex);
    }

    const setsQuery = `
      SELECT id, session_exercise_id, weight, reps, is_completed, is_warmup, is_dropset, is_to_failure, set_order
      FROM sets
      WHERE session_exercise_id IN (SELECT id FROM session_exercises WHERE session_id = ?)
      ORDER BY set_order ASC
    `;
    const setsRows = db.getAllSync<any>(setsQuery, [sessionId]);

    for (const sr of setsRows) {
      const ex = exercisesMap.get(sr.session_exercise_id);
      if (ex) {
        ex.sets.push({
          id: sr.id,
          weight: sr.weight,
          reps: sr.reps,
          is_completed: !!sr.is_completed,
          is_warmup: !!sr.is_warmup,
          is_dropset: !!sr.is_dropset,
          is_to_failure: !!sr.is_to_failure,
          set_order: sr.set_order
        });
      }
    }

    return session;
  }

  static updateSessionNotes(sessionId: string, notes: string): void {
    db.runSync('UPDATE sessions SET session_notes = ? WHERE id = ?', [notes, sessionId]);
  }

  static getPerformAgainExercises(sessionId: string): WorkoutExercise[] {
    const session = SessionRepository.getSessionDetails(sessionId);
    if (!session || !session.exercises) return [];

    const generateId = () => Math.random().toString(36).substring(2, 9);

    return session.exercises.map(ex => {
      return {
        id: generateId(),
        exercise_id: ex.exercise_id,
        name: ex.name,
        muscle_group: ex.muscle_group || 'Unknown',
        image_uri: ex.image_uri,
        target_sets: ex.sets.length,
        target_reps: "0", 
        rest_time_seconds: 60,
        superset_id: ex.superset_id || null,
        sets: ex.sets.map(s => ({
          id: generateId(),
          weight: s.weight,
          reps: s.reps,
          is_completed: false,
          is_warmup: s.is_warmup,
          is_dropset: s.is_dropset,
          is_to_failure: s.is_to_failure,
        })),
        previous_sets: ex.sets.filter(s => s.is_completed).map(s => ({ weight: s.weight, reps: s.reps })),
      };
    });
  }

  static createSession(sessionId: string, userId: string, routineDayId: string | null): void {
    db.runSync(
      'INSERT INTO sessions (id, user_id, routine_day_id, start_time, total_volume_kg) VALUES (?, ?, ?, ?, ?)',
      [sessionId, userId, routineDayId, new Date().toISOString(), 0]
    );
  }

  static getLastSessionOrderIndex(routineId: string) {
    return db.getFirstSync<{ order_index: number }>(
      `SELECT rd.order_index 
       FROM sessions s 
       JOIN routine_days rd ON s.routine_day_id = rd.id
       WHERE rd.routine_id = ? 
       ORDER BY s.start_time DESC LIMIT 1`,
      [routineId]
    );
  }

  static getPreviousSetsForExercise(exerciseId: string) {
    const lastSessionEx = db.getFirstSync<{ id: string }>(
      `SELECT se.id FROM session_exercises se 
       JOIN sessions s ON se.session_id = s.id 
       WHERE se.exercise_id = ? AND s.end_time IS NOT NULL 
       ORDER BY s.start_time DESC LIMIT 1`,
      [exerciseId]
    );

    if (lastSessionEx) {
      return db.getAllSync<{ weight: number, reps: number }>(
        'SELECT weight, reps FROM sets WHERE session_exercise_id = ? AND is_completed = 1 ORDER BY set_order ASC',
        [lastSessionEx.id]
      );
    }
    return [];
  }

  static finishSession(sessionId: string, endTime: string, totalVolume: number, exercises: WorkoutExercise[]): void {
    const rid = () => Math.random().toString(36).substr(2, 5);
    
    db.withTransactionSync(() => {
      db.runSync(
        'UPDATE sessions SET end_time = ?, total_volume_kg = ? WHERE id = ?',
        [endTime, totalVolume, sessionId]
      );

      for (let i = 0; i < exercises.length; i++) {
        const ex = exercises[i];
        const seId = `se_${Date.now()}_${i}_${rid()}`;
        db.runSync(
          'INSERT INTO session_exercises (id, session_id, exercise_id, order_index, superset_id) VALUES (?, ?, ?, ?, ?)',
          [seId, sessionId, ex.exercise_id, i, ex.superset_id || null]
        );

        for (let j = 0; j < ex.sets.length; j++) {
          const s = ex.sets[j];
          db.runSync(
            `INSERT INTO sets (id, session_exercise_id, weight, reps, is_completed, is_warmup, is_dropset, is_to_failure, set_order) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [`st_${Date.now()}_${i}_${j}_${rid()}`, seId, s.weight, s.reps, s.is_completed ? 1 : 0, s.is_warmup ? 1 : 0, s.is_dropset ? 1 : 0, s.is_to_failure ? 1 : 0, j]
          );
        }
      }
    });
  }

  static cancelSession(sessionId: string): void {
    db.runSync('DELETE FROM sessions WHERE id = ?', [sessionId]);
  }

  // ==========================================
  // STATISTICS & ANALYTICS QUERIES
  // ==========================================

  static getStatsOverview(startDate: string | null) {
    let query = `
      SELECT 
        COUNT(DISTINCT s.id) as total_sessions,
        SUM(CAST(strftime('%s', s.end_time) AS INTEGER) - CAST(strftime('%s', s.start_time) AS INTEGER)) as total_duration_seconds,
        SUM((SELECT COUNT(*) FROM sets st JOIN session_exercises se ON st.session_exercise_id = se.id WHERE se.session_id = s.id AND st.is_completed = 1)) as total_sets
      FROM sessions s
      WHERE s.end_time IS NOT NULL
    `;
    const params: string[] = [];
    if (startDate) {
      query += ` AND s.start_time >= ?`;
      params.push(startDate);
    }
    const result = db.getFirstSync<{ total_sessions: number, total_duration_seconds: number, total_sets: number }>(query, params);
    
    return {
      total_sessions: result?.total_sessions || 0,
      total_duration_seconds: result?.total_duration_seconds || 0,
      total_sets: result?.total_sets || 0,
    };
  }

  static getMuscleFocusStats(startDate: string | null, type: 'primary' | 'secondary'): { label: string, value: number }[] {
    let query = `
      SELECT 
        e.target, e.body_part, e.muscle_group, COUNT(st.id) as set_count
      FROM sets st
      JOIN session_exercises se ON st.session_exercise_id = se.id
      JOIN sessions s ON se.session_id = s.id
      JOIN exercises e ON se.exercise_id = e.id
      WHERE st.is_completed = 1 AND s.end_time IS NOT NULL
    `;
    const params: string[] = [];
    if (startDate) {
      query += ` AND s.start_time >= ?`;
      params.push(startDate);
    }
    query += ` GROUP BY e.target, e.body_part, e.muscle_group`;

    const rows = db.getAllSync<{ target: string | null, body_part: string | null, muscle_group: string | null, set_count: number }>(query, params);
    
    const aggregated: Record<string, number> = {};

    for (const row of rows) {
      let prim = '';
      let secList: string[] = [];

      if (row.muscle_group && row.muscle_group.trim().startsWith('{')) {
        try {
          const parsed = JSON.parse(row.muscle_group);
          prim = parsed.primaryString || '';
          secList = parsed.secondary || [];
        } catch(e) {}
      } else {
        prim = row.target || row.body_part || row.muscle_group || 'Outros';
      }

      if (!prim) prim = 'Outros';

      if (type === 'primary') {
        aggregated[prim] = (aggregated[prim] || 0) + row.set_count;
      } else {
        for (const secId of secList) {
          aggregated[secId] = (aggregated[secId] || 0) + row.set_count;
        }
      }
    }

    // Convert secondary IDs to names if type === 'secondary'
    // Doing it here avoids needing to import getMuscleById dynamically if we can just map it loosely or rely on the frontend.
    // Actually, it's better to return the raw keys, and the frontend will map them to names and colors.
    return Object.keys(aggregated).map(key => ({
      label: key,
      value: aggregated[key]
    })).sort((a, b) => b.value - a.value);
  }

  static getWorkoutsOverTime(startDate: string | null, groupBy: 'week' | 'month'): { label: string, value: number, dateStr: string }[] {
    // SQLite strftime:
    // %Y-%W (Year-Week)
    // %Y-%m (Year-Month)
    const groupFormat = groupBy === 'week' ? '%Y-%W' : '%Y-%m';
    
    let query = `
      SELECT 
        strftime('${groupFormat}', start_time) as period,
        MIN(start_time) as first_date_in_period,
        COUNT(id) as session_count
      FROM sessions
      WHERE end_time IS NOT NULL
    `;
    const params: string[] = [];
    if (startDate) {
      query += ` AND start_time >= ?`;
      params.push(startDate);
    }
    query += ` GROUP BY period ORDER BY period ASC`;

    const rows = db.getAllSync<{ period: string, first_date_in_period: string, session_count: number }>(query, params);
    
    return rows.map(r => {
      const d = new Date(r.first_date_in_period);
      let label = '';
      if (groupBy === 'week') {
        const day = d.getDate();
        const monthNames = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
        label = `${day} ${monthNames[d.getMonth()]}`;
      } else {
        const monthNames = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
        label = monthNames[d.getMonth()];
      }
      return {
        label,
        value: r.session_count,
        dateStr: r.first_date_in_period
      };
    });
  }

  static getPlanStatsOverview(routineId: string) {
    const query = `
      SELECT 
        COUNT(DISTINCT s.id) as total_sessions,
        SUM(CAST(strftime('%s', s.end_time) AS INTEGER) - CAST(strftime('%s', s.start_time) AS INTEGER)) as total_duration_seconds,
        SUM((SELECT COUNT(*) FROM sets st JOIN session_exercises se ON st.session_exercise_id = se.id WHERE se.session_id = s.id AND st.is_completed = 1)) as total_sets
      FROM sessions s
      JOIN routine_days rd ON s.routine_day_id = rd.id
      WHERE rd.routine_id = ? AND s.end_time IS NOT NULL
    `;
    const result = db.getFirstSync<{ total_sessions: number, total_duration_seconds: number, total_sets: number }>(query, [routineId]);
    
    return {
      total_sessions: result?.total_sessions || 0,
      total_duration_seconds: result?.total_duration_seconds || 0,
      total_sets: result?.total_sets || 0,
    };
  }

  static getRawPlanWorkoutsHistory(routineId: string) {
    const query = `
      SELECT 
        s.id,
        s.start_time,
        s.total_volume_kg as volume,
        (SELECT SUM(st.reps) FROM sets st JOIN session_exercises se ON st.session_exercise_id = se.id WHERE se.session_id = s.id AND st.is_completed = 1) as reps,
        (CAST(strftime('%s', s.end_time) AS INTEGER) - CAST(strftime('%s', s.start_time) AS INTEGER)) as duration_seconds
      FROM sessions s
      JOIN routine_days rd ON s.routine_day_id = rd.id
      WHERE rd.routine_id = ? AND s.end_time IS NOT NULL
      ORDER BY s.start_time ASC
    `;
    const rows = db.getAllSync<{ id: string, start_time: string, volume: number | null, reps: number | null, duration_seconds: number | null }>(query, [routineId]);
    
    return rows.map(r => ({
      id: r.id,
      start_time: r.start_time,
      volume: r.volume || 0,
      reps: r.reps || 0,
      duration_seconds: r.duration_seconds || 0
    }));
  }

  /**
   * Calculates the current workout streak (consecutive days with completed sessions).
   * Counts backwards from today.
   */
  static getCurrentStreak(): number {
    try {
      const rows = db.getAllSync<{ session_date: string }>(
        `SELECT DISTINCT date(start_time) as session_date 
         FROM sessions 
         WHERE end_time IS NOT NULL 
         ORDER BY session_date DESC`
      );

      if (rows.length === 0) return 0;

      let streak = 0;
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // Start from today and check each day backwards
      const dateSet = new Set(rows.map(r => r.session_date));
      
      for (let i = 0; i <= rows.length + 1; i++) {
        const checkDate = new Date(today);
        checkDate.setDate(today.getDate() - i);
        const checkStr = checkDate.toISOString().split('T')[0];
        
        if (dateSet.has(checkStr)) {
          streak++;
        } else {
          // If it's today and no session yet, skip and keep checking from yesterday
          if (i === 0) continue;
          break;
        }
      }

      return streak;
    } catch (e) {
      console.error('Error calculating streak:', e);
      return 0;
    }
  }
}
