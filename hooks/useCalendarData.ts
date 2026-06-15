import { useState, useCallback, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { db } from '@/database/schema';
import { useFocusEffect } from 'expo-router';

/**
 * Lightweight hook that only fetches calendar/week data.
 * Use this instead of the full useHomeData() when you only need the calendar widget.
 */
export function useCalendarData() {
  const [weekDays, setWeekDays] = useState<Date[]>([]);
  const [currentMonthStr, setCurrentMonthStr] = useState('');
  const [completedDays, setCompletedDays] = useState(0);
  const [weeklyGoal, setWeeklyGoal] = useState(7);

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

  const loadCalendarData = useCallback(async () => {
    if (weekDays.length === 0) return;
    try {
      const goalStr = await AsyncStorage.getItem('weekly_goal');
      setWeeklyGoal(goalStr ? parseInt(goalStr, 10) : 7);

      const startStr = weekDays[0].toISOString().split('T')[0];
      const endStr = weekDays[6].toISOString().split('T')[0];

      const sessions = db.getAllSync<{ dateStr: string }>(
        `SELECT DISTINCT date(start_time) as dateStr FROM sessions WHERE date(start_time) >= ? AND date(start_time) <= ?`,
        [startStr, endStr]
      );

      setCompletedDays(sessions.length);
    } catch (e) {
      console.error('Calendar data load error', e);
    }
  }, [weekDays]);

  useFocusEffect(
    useCallback(() => {
      loadCalendarData();
    }, [loadCalendarData])
  );

  const updateWeeklyGoal = async (newGoal: number) => {
    try {
      await AsyncStorage.setItem('weekly_goal', newGoal.toString());
      setWeeklyGoal(newGoal);
    } catch (e) {
      console.error('Error saving weekly goal', e);
    }
  };

  return {
    weekDays,
    currentMonthStr,
    completedDays,
    weeklyGoal,
    updateWeeklyGoal,
  };
}
