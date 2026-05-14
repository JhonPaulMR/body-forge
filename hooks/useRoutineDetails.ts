import { useState, useCallback } from 'react';
import { Alert } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { db } from '@/database/schema';

export interface Routine {
  id: string;
  name: string;
  description: string | null;
  cover_image_uri: string | null;
}

export interface DayExerciseInfo {
  id: string;
  name: string;
  muscle_group: string;
  target_sets: number;
  target_reps: string;
  rest_time_seconds?: number;
  superset_id?: string;
}

export interface RoutineDayDetail {
  id: string;
  day_name: string;
  order_index: number;
  exercises: DayExerciseInfo[];
  est_time: number;
  est_kcal: number;
}

export function useRoutineDetails(routineId: string) {
  const router = useRouter();
  const [routine, setRoutine] = useState<Routine | null>(null);
  const [days, setDays] = useState<RoutineDayDetail[]>([]);
  const [isActivePlan, setIsActivePlan] = useState(false);
  const [showMenu, setShowMenu] = useState(false);

  useFocusEffect(
    useCallback(() => {
      if (routineId) {
        loadData();
        checkActiveStatus();
      }
    }, [routineId])
  );

  const checkActiveStatus = async () => {
    try {
      const activeIdsStr = await AsyncStorage.getItem('active_routine_ids');
      if (activeIdsStr) {
        const activeIds = JSON.parse(activeIdsStr);
        setIsActivePlan(activeIds.includes(routineId));
      }
    } catch (error) {
      console.error('Error checking active status:', error);
    }
  };

  const toggleActivePlan = async () => {
    try {
      const activeIdsStr = await AsyncStorage.getItem('active_routine_ids');
      let activeIds: string[] = activeIdsStr ? JSON.parse(activeIdsStr) : [];
      
      if (isActivePlan) {
        activeIds = activeIds.filter(id => id !== routineId);
      } else {
        activeIds.push(routineId);
      }
      
      await AsyncStorage.setItem('active_routine_ids', JSON.stringify(activeIds));
      
      if (isActivePlan) {
        setIsActivePlan(false);
        router.replace('/planos' as any);
      } else {
        setIsActivePlan(true);
        router.replace('/home' as any);
      }
    } catch (error) {
      console.error('Error toggling active status:', error);
    }
  };

  const loadData = () => {
    try {
      const r = db.getFirstSync<Routine>(
        'SELECT id, name, description, cover_image_uri FROM routines WHERE id = ?',
        [routineId]
      );
      setRoutine(r);

      const daysResult = db.getAllSync<{ id: string; day_name: string; order_index: number }>(
        'SELECT id, day_name, order_index FROM routine_days WHERE routine_id = ? ORDER BY order_index',
        [routineId]
      );

      const daysWithExercises: RoutineDayDetail[] = daysResult.map((day) => {
        const exercises = db.getAllSync<DayExerciseInfo>(
          `SELECT re.id, e.name, e.muscle_group, re.target_sets, re.target_reps, re.rest_time_seconds, re.superset_id
           FROM routine_exercises re
           JOIN exercises e ON re.exercise_id = e.id
           WHERE re.routine_day_id = ?
           ORDER BY re.order_index`,
          [day.id]
        );
        
        let totalMinutes = 0;
        exercises.forEach(ex => {
          let isSpecialSet = !!ex.superset_id;
          const restMinutes = (ex.rest_time_seconds || 0) / 60;
          if (isSpecialSet) {
            totalMinutes += restMinutes;
          } else {
            totalMinutes += ((ex.target_sets || 0) * restMinutes);
          }
          totalMinutes += (ex.target_sets || 0);
        });
        const est_time = Math.ceil(totalMinutes);
        const est_kcal = Math.ceil(est_time * 7.5);

        return { ...day, exercises, est_time, est_kcal };
      });
      setDays(daysWithExercises);
    } catch (error) {
      console.error('Error loading plan details:', error);
    }
  };

  const handleDuplicate = () => {
    if (!routine) return;
    try {
      const newRoutineId = 'routine_dup_' + Date.now();
      db.runSync(
        'INSERT INTO routines (id, user_id, name, description, cover_image_uri, is_builtin) VALUES (?, ?, ?, ?, ?, ?)',
        [newRoutineId, 'user_1', routine.name + ' (cópia)', routine.description, routine.cover_image_uri, 0]
      );
      
      const daysResult = db.getAllSync<{ id: string; day_name: string; order_index: number }>(
        'SELECT id, day_name, order_index FROM routine_days WHERE routine_id = ? ORDER BY order_index',
        [routineId]
      );

      for (const day of daysResult) {
        const newDayId = 'rd_dup_' + Date.now() + Math.random().toString(36).substr(2, 5);
        db.runSync(
          'INSERT INTO routine_days (id, routine_id, day_name, order_index) VALUES (?, ?, ?, ?)',
          [newDayId, newRoutineId, day.day_name, day.order_index]
        );

        const exercises = db.getAllSync<any>(
          'SELECT * FROM routine_exercises WHERE routine_day_id = ? ORDER BY order_index',
          [day.id]
        );

        // Map original superset_id to new ones for this day
        const supersetMap = new Map<string, string>();

        for (const ex of exercises) {
          let newSupersetId = null;
          if (ex.superset_id) {
            if (!supersetMap.has(ex.superset_id)) {
              supersetMap.set(ex.superset_id, 'ss_dup_' + Date.now() + Math.random().toString(36).substr(2, 5));
            }
            newSupersetId = supersetMap.get(ex.superset_id);
          }

          db.runSync(
            `INSERT INTO routine_exercises (id, routine_day_id, exercise_id, order_index, superset_id, target_sets, target_reps, rest_time_seconds, set_configs)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            ['re_dup_' + Date.now() + Math.random().toString(36).substr(2, 5), newDayId, ex.exercise_id, ex.order_index, newSupersetId, ex.target_sets, ex.target_reps, ex.rest_time_seconds, ex.set_configs]
          );
        }
      }
      setShowMenu(false);
      router.replace(`/planner/details?routineId=${newRoutineId}` as any);
    } catch (e) {
      console.error(e);
    }
  };

  const handleDelete = () => {
    setShowMenu(false);
    Alert.alert('Excluir plano', 'Tem certeza que deseja excluir o plano atual e todos os seus exercícios?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Excluir', style: 'destructive', onPress: () => {
        try {
          db.runSync(`
            DELETE FROM routine_exercises WHERE routine_day_id IN (
              SELECT id FROM routine_days WHERE routine_id = ?
            )
          `, [routineId]);
          db.runSync('DELETE FROM routine_days WHERE routine_id = ?', [routineId]);
          db.runSync('DELETE FROM routines WHERE id = ?', [routineId]);
          router.replace('/planos' as any);
        } catch (e) { console.error(e); }
      }}
    ]);
  };

  const totalExercises = days.reduce((sum, d) => sum + d.exercises.length, 0);

  return {
    routine,
    days,
    isActivePlan,
    showMenu,
    setShowMenu,
    totalExercises,
    toggleActivePlan,
    handleDuplicate,
    handleDelete,
  };
}
