import { db } from '@/database/schema';

export interface Exercise {
  id: string;
  name: string;
  muscle_group: string;
  body_part?: string;
  target?: string;
  equipment: string;
  instructions: string | null;
  image_uri: string | null;
  gif_url?: string | null;
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

export interface ExerciseHistorySet {
  weight: number;
  reps: number;
  is_warmup: number;
  is_dropset: number;
  is_to_failure: number;
}

export interface ExerciseHistorySession {
  date: string;
  isPersonalRecord: boolean; // Not perfectly implemented yet, mock as false
  sets: ExerciseHistorySet[];
}

export interface ExerciseStats {
  weeklyVolume: number;
  history: ExerciseHistorySession[];
  trendMessage: string;
  trendDirection: 'up' | 'down' | 'neutral';
}

export const getExerciseStats = (exerciseId: string): ExerciseStats => {
  try {
    // 1. Weekly Volume: count of completed sets for this exercise in the last 7 days
    const volumeRow = db.getFirstSync<{ volume: number }>(`
      SELECT COUNT(s.id) as volume
      FROM sets s
      JOIN session_exercises se ON s.session_exercise_id = se.id
      JOIN sessions sess ON se.session_id = sess.id
      WHERE se.exercise_id = ? 
        AND s.is_completed = 1
        AND sess.start_time >= datetime('now', '-7 days')
    `, [exerciseId]);

    const weeklyVolume = volumeRow?.volume || 0;

    // 2. History: group by session start_time (date)
    // Fetch all completed sets for this exercise
    const historyRows = db.getAllSync<any>(`
      SELECT 
        sess.start_time,
        s.weight,
        s.reps,
        s.is_warmup,
        s.is_dropset,
        s.is_to_failure
      FROM sets s
      JOIN session_exercises se ON s.session_exercise_id = se.id
      JOIN sessions sess ON se.session_id = sess.id
      WHERE se.exercise_id = ? 
        AND s.is_completed = 1
      ORDER BY sess.start_time DESC, s.set_order ASC
    `, [exerciseId]);

    const sessionsMap: Record<string, ExerciseHistorySet[]> = {};

    historyRows.forEach(row => {
      // row.start_time is ISO string like "2026-05-24T10:00:00.000Z"
      const dateObj = new Date(row.start_time);
      
      const weekdays = ['DOMINGO', 'SEGUNDA-FEIRA', 'TERÇA-FEIRA', 'QUARTA-FEIRA', 'QUINTA-FEIRA', 'SEXTA-FEIRA', 'SÁBADO'];
      const months = ['JANEIRO', 'FEVEREIRO', 'MARÇO', 'ABRIL', 'MAIO', 'JUNHO', 'JULHO', 'AGOSTO', 'SETEMBRO', 'OUTUBRO', 'NOVEMBRO', 'DEZEMBRO'];
      
      const dayName = weekdays[dateObj.getDay()];
      const day = dateObj.getDate();
      const month = months[dateObj.getMonth()];
      
      const formattedDate = `${dayName}, ${day} DE ${month}`;

      if (!sessionsMap[formattedDate]) {
        sessionsMap[formattedDate] = [];
      }

      sessionsMap[formattedDate].push({
        weight: row.weight,
        reps: row.reps,
        is_warmup: row.is_warmup,
        is_dropset: row.is_dropset,
        is_to_failure: row.is_to_failure,
      });
    });

    // Calculate Personal Records by tracking max weight progression
    const sessionDates = Object.keys(sessionsMap);
    
    // Reverse sessions so oldest is first for calculating PR progression
    const chronologicalDates = [...sessionDates].reverse();
    let runningMax = 0;
    
    // First map all sessions to an array to hold their final shapes
    const sessionsByDate: Record<string, ExerciseHistorySession> = {};
    
    chronologicalDates.forEach(date => {
      const sets = sessionsMap[date];
      const sessionMaxWeight = Math.max(...sets.map(s => s.weight || 0), 0);
      
      let isPersonalRecord = false;
      if (sessionMaxWeight > runningMax && sessionMaxWeight > 0) {
        isPersonalRecord = true;
        runningMax = sessionMaxWeight;
      }
      
      sessionsByDate[date] = { date, isPersonalRecord, sets };
    });

    // Now put them back into DESC order for the final history array
    const history: ExerciseHistorySession[] = sessionDates.map(date => sessionsByDate[date]);

    // Reverse for the trend comparison below
    const reversedHistory = [...history];

    let trendMessage = 'Continue treinando para gerar mais dados de tendência.';
    let trendDirection: 'up' | 'down' | 'neutral' = 'neutral';

    if (reversedHistory.length >= 2) {
      const latestSets = reversedHistory[0].sets;
      const prevSets = reversedHistory[1].sets;
      
      const maxLatest = Math.max(...latestSets.map(s => s.weight || 0), 0);
      const maxPrev = Math.max(...prevSets.map(s => s.weight || 0), 0);

      if (maxLatest > maxPrev && maxPrev > 0) {
        const percentage = Math.round(((maxLatest - maxPrev) / maxPrev) * 100);
        trendMessage = `Sua carga máxima aumentou ${percentage}% em comparação ao treino anterior!`;
        trendDirection = 'up';
      } else if (maxLatest < maxPrev && maxLatest > 0) {
        const percentage = Math.round(((maxPrev - maxLatest) / maxPrev) * 100);
        trendMessage = `Sua carga máxima diminuiu ${percentage}%. Foque na recuperação e alimentação.`;
        trendDirection = 'down';
      } else {
        trendMessage = `Sua força se manteve constante desde o último treino.`;
        trendDirection = 'neutral';
      }
    }

    return { weeklyVolume, history: reversedHistory, trendMessage, trendDirection };
  } catch (error) {
    console.error('Error fetching exercise stats:', error);
    return { weeklyVolume: 0, history: [], trendMessage: '', trendDirection: 'neutral' };
  }
};
