import { db } from '@/database/schema';
import { WorkoutExercise, WorkoutSet } from '@/hooks/useWorkoutStore';

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

export const historyService = {
  getHistoryDates: (year: number, month: number): string[] => {
    const monthStr = month.toString().padStart(2, '0');
    // Using SQLite date format: strftime returns YYYY and MM
    const query = `
      SELECT DISTINCT date(start_time) as session_date 
      FROM sessions 
      WHERE strftime('%Y', start_time) = ? AND strftime('%m', start_time) = ?
    `;
    const rows = db.getAllSync<any>(query, [year.toString(), monthStr]);
    return rows.map(r => r.session_date);
  },

  getSessionsForMonth: (year: number, month: number): HistorySession[] => {
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
  },

  getSessionDetails: (sessionId: string): HistorySession | null => {
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
      SELECT se.id, se.exercise_id, se.order_index, e.name, e.image_uri, e.muscle_group
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
  },

  updateSessionNotes: (sessionId: string, notes: string) => {
    db.runSync('UPDATE sessions SET session_notes = ? WHERE id = ?', [notes, sessionId]);
  },

  getPerformAgainExercises: (sessionId: string): WorkoutExercise[] => {
    const session = historyService.getSessionDetails(sessionId);
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
        superset_id: null,
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
};
