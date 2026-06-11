import { useState, useCallback } from 'react';
import { db } from '@/database/schema';
import { useFocusEffect } from 'expo-router';

export interface UserRoutine {
  id: string;
  name: string;
  description: string | null;
  day_count: number;
  exercise_count: number;
  category?: string | null;
  cover_image_uri?: string | null;
  is_builtin?: number;
}

export function usePlansData() {
  const [userRoutines, setUserRoutines] = useState<UserRoutine[]>([]);
  const [forcaRoutines, setForcaRoutines] = useState<UserRoutine[]>([]);
  const [hipertrofiaRoutines, setHipertrofiaRoutines] = useState<UserRoutine[]>([]);
  const [gorduraRoutines, setGorduraRoutines] = useState<UserRoutine[]>([]);
  const [casaRoutines, setCasaRoutines] = useState<UserRoutine[]>([]);

  const loadUserRoutines = useCallback(() => {
    try {
      const result = db.getAllSync<UserRoutine>(
        `SELECT r.id, r.name, r.description, r.category, r.cover_image_uri, r.is_builtin,
                (SELECT COUNT(*) FROM routine_days WHERE routine_id = r.id) as day_count,
                (SELECT COUNT(*) FROM routine_exercises re
                 JOIN routine_days rd ON re.routine_day_id = rd.id
                 WHERE rd.routine_id = r.id) as exercise_count
         FROM routines r
         WHERE r.user_id = 'user_1'
         ORDER BY r.id DESC`
      );
      
      setUserRoutines(result.filter(r => r.is_builtin === 0));
      setForcaRoutines(result.filter(r => r.category === 'FORCA'));
      setHipertrofiaRoutines(result.filter(r => r.category === 'HIPERTROFIA'));
      setGorduraRoutines(result.filter(r => r.category === 'GORDURA'));
      setCasaRoutines(result.filter(r => r.category === 'CASA'));
    } catch (error) {
      console.error('Error loading routines:', error);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadUserRoutines();
    }, [])
  );

  return {
    userRoutines,
    forcaRoutines,
    hipertrofiaRoutines,
    gorduraRoutines,
    casaRoutines,
    loadUserRoutines
  };
}
