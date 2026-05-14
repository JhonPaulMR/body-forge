import { useState, useCallback, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { db } from '@/database/schema';
import { useFocusEffect } from 'expo-router';
import { parseMuscleGroup } from '@/services/muscleGroupUtils';

export interface Routine {
  id: string;
  name: string;
  cover_image_uri: string | null;
  est_time: number;
  est_kcal: number;
  subtitle: string;
}

export interface ActivityStats {
  dateStr: string;
  volume: number;
  rpe: number;
  mainMuscle: string | null;
  workoutName: string | null;
  setsCompleted: number;
}

export function useHomeData() {
  const [weekDays, setWeekDays] = useState<Date[]>([]);
  const [currentMonthStr, setCurrentMonthStr] = useState('');
  const [completedDays, setCompletedDays] = useState(0);

  const [routines, setRoutines] = useState<Routine[]>([]);
  const [weeklyStats, setWeeklyStats] = useState<ActivityStats[]>([]);

  const [currentWeight, setCurrentWeight] = useState<number | null>(null);
  const [weightDiff, setWeightDiff] = useState<number | null>(null);
  const [imc, setImc] = useState<number | null>(null);

  useEffect(() => {
    const today = new Date();
    const currentDayOfWeek = today.getDay(); // 0 is Sunday
    const diffToMonday = currentDayOfWeek === 0 ? -6 : 1 - currentDayOfWeek;
    
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() + diffToMonday);

    const days = Array.from({ length: 7 }).map((_, i) => {
      const d = new Date(startOfWeek);
      d.setDate(startOfWeek.getDate() + i);
      return d;
    });

    setWeekDays(days);

    const monthNames = ['JANEIRO', 'FEVEREIRO', 'MARÇO', 'ABRIL', 'MAIO', 'JUNHO', 'JULHO', 'AGOSTO', 'SETEMBRO', 'OUTUBRO', 'NOVEMBRO', 'DEZEMBRO'];
    setCurrentMonthStr(`${monthNames[today.getMonth()]} ${today.getFullYear()}`);
  }, []);

  const loadHomeData = async () => {
    if (weekDays.length === 0) return;
    try {
      // 1. Load active IDs from AsyncStorage
      const activeIdsStr = await AsyncStorage.getItem('active_routine_ids');
      const activeIds: string[] = activeIdsStr ? JSON.parse(activeIdsStr) : [];
      
      let mappedRoutines: Routine[] = [];
      
      if (activeIds.length > 0) {
        // 2. Query only the active routines
        const placeholders = activeIds.map(() => '?').join(',');
        const activeRoutines = db.getAllSync<any>(
          `SELECT id, name, cover_image_uri FROM routines WHERE id IN (${placeholders})`,
          activeIds
        );

        // 3. Map estimations
        mappedRoutines = activeRoutines.map(r => {
          const exs = db.getAllSync<{ target_sets: number, rest_time_seconds: number, superset_id: string }>(
            `SELECT re.target_sets, re.rest_time_seconds, re.superset_id FROM routine_exercises re 
             JOIN routine_days rd ON re.routine_day_id = rd.id
             WHERE rd.routine_id = ?`,
            [r.id]
          );
          const daysCount = db.getFirstSync<{ c: number }>('SELECT count(*) as c FROM routine_days WHERE routine_id = ?', [r.id])?.c || 1;

          let totalMinutes = 0;
          exs.forEach(ex => {
            let isSpecialSet = !!ex.superset_id;
            const restMinutes = (ex.rest_time_seconds || 0) / 60;
            if (isSpecialSet) {
              totalMinutes += restMinutes;
            } else {
              totalMinutes += ((ex.target_sets || 0) * restMinutes);
            }
            totalMinutes += (ex.target_sets || 0); // 1 min per set
          });
          
          const avgTime = daysCount > 0 ? totalMinutes / daysCount : 0;
          
          return {
            ...r,
            est_time: Math.ceil(avgTime),
            est_kcal: Math.ceil(avgTime * 7.5),
            subtitle: 'PROGRAMA ATIVO',
          };
        });
      }

      setRoutines(mappedRoutines);

      // Body Metrics
      const metrics = db.getAllSync<{ weight_kg: number }>(
        'SELECT weight_kg FROM body_metrics WHERE user_id = ? ORDER BY date DESC LIMIT 2',
        ['user_1']
      );
      const user = db.getFirstSync<{ height_cm: number | null }>('SELECT height_cm FROM users WHERE id = ?', ['user_1']);
      
      if (metrics.length > 0) {
        setCurrentWeight(metrics[0].weight_kg);
        if (metrics.length > 1) {
          setWeightDiff(metrics[0].weight_kg - metrics[1].weight_kg);
        } else {
          setWeightDiff(null);
        }

        if (user && user.height_cm) {
          const hMeters = user.height_cm / 100;
          setImc(metrics[0].weight_kg / (hMeters * hMeters));
        } else {
          setImc(null);
        }
      }

      // Activity Stats & Completed Days
      const startStr = weekDays[0].toISOString().split('T')[0];
      const endStr = weekDays[6].toISOString().split('T')[0];
      
      const statsMap: Record<string, ActivityStats> = {};
      weekDays.forEach(d => {
        statsMap[d.toISOString().split('T')[0]] = { dateStr: d.toISOString().split('T')[0], volume: 0, rpe: 0, mainMuscle: null, workoutName: null, setsCompleted: 0 };
      });

      // Tonnage & RPE Query
      const sessions = db.getAllSync<{ id: string, dateStr: string, name: string }>(
        `SELECT s.id, date(s.start_time) as dateStr, rd.day_name as name 
         FROM sessions s 
         LEFT JOIN routine_days rd ON s.routine_day_id = rd.id
         WHERE dateStr >= ? AND dateStr <= ?`,
        [startStr, endStr]
      );

      let compDays = new Set<string>();

      sessions.forEach(s => {
        if (!s.dateStr) return;
        compDays.add(s.dateStr);
        if (!statsMap[s.dateStr]) return;
        
        statsMap[s.dateStr].workoutName = s.name || 'Treino Concluído';

        const sesExs = db.getAllSync<{ id: string, muscle_group: string }>(
          `SELECT se.id, e.muscle_group FROM session_exercises se
           LEFT JOIN exercises e ON se.exercise_id = e.id
           WHERE se.session_id = ?`,
           [s.id]
        );

        let dayVolume = 0;
        let dayRpeSum = 0;
        let dayRpeCount = 0;
        let daySets = 0;
        const muscleCounts: Record<string, number> = {};

        sesExs.forEach(se => {
          const muscleData = parseMuscleGroup(se.muscle_group);
          const muscle = muscleData.primaryString;
          if (muscle) {
            muscleCounts[muscle] = (muscleCounts[muscle] || 0) + 1;
          }
          const sets = db.getAllSync<{ weight: number, reps: number, rpe: number }>(
            'SELECT weight, reps, rpe FROM sets WHERE session_exercise_id = ? AND is_completed = 1',
            [se.id]
          );
          sets.forEach(set => {
            dayVolume += (set.weight || 0) * (set.reps || 0);
            if (set.rpe) {
              dayRpeSum += set.rpe;
              dayRpeCount++;
            }
            daySets++;
          });
        });

        statsMap[s.dateStr].volume += dayVolume;
        statsMap[s.dateStr].setsCompleted += daySets;
        if (dayRpeCount > 0) {
          statsMap[s.dateStr].rpe = dayRpeSum / dayRpeCount;
        }

        // Main muscle
        if (Object.keys(muscleCounts).length > 0) {
           const main = Object.keys(muscleCounts).reduce((a, b) => muscleCounts[a] > muscleCounts[b] ? a : b);
           statsMap[s.dateStr].mainMuscle = main;
        }
      });

      setCompletedDays(compDays.size);
      
      const statsArr = weekDays.map(d => statsMap[d.toISOString().split('T')[0]]);
      setWeeklyStats(statsArr);

    } catch (e) {
      console.error('Home Data Load Error', e);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadHomeData();
    }, [weekDays])
  );

  return {
    weekDays,
    currentMonthStr,
    completedDays,
    routines,
    weeklyStats,
    currentWeight,
    weightDiff,
    imc,
    loadHomeData
  };
}
