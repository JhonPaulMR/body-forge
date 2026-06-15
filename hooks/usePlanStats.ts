import { useState, useEffect } from 'react';
import { SessionRepository } from '@/database/repositories/SessionRepository';

export type PlanFilterType = 'VOLUME' | 'REPS' | 'DURATION';

export interface PlanChartData {
  label: string;
  value: number;
}

export function usePlanStats(routineId: string) {
  const [overview, setOverview] = useState({
    total_sessions: 0,
    total_duration_seconds: 0,
    total_sets: 0,
  });
  
  const [activeFilter, setActiveFilter] = useState<PlanFilterType>('VOLUME');
  const [chartData, setChartData] = useState<PlanChartData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!routineId) return;
    
    setLoading(true);
    try {
      const stats = SessionRepository.getPlanStatsOverview(routineId);
      setOverview(stats);

      const rawHistory = SessionRepository.getRawPlanWorkoutsHistory(routineId);
      
      if (rawHistory.length === 0) {
        setChartData([]);
        setLoading(false);
        return;
      }

      const firstDate = new Date(rawHistory[0].start_time).getTime();
      const lastDate = new Date(rawHistory[rawHistory.length - 1].start_time).getTime();
      const spanDays = (lastDate - firstDate) / (1000 * 60 * 60 * 24);

      let groupBy: 'day' | 'week' | 'month' = 'day';
      if (spanDays > 180) groupBy = 'month';
      else if (spanDays > 31) groupBy = 'week';

      const groupedMap = new Map<string, { label: string, value: number }>();

      rawHistory.forEach(session => {
        const d = new Date(session.start_time);
        let key = '';
        let label = '';

        if (groupBy === 'month') {
          key = `${d.getFullYear()}-${d.getMonth()}`;
          const monthNames = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
          label = monthNames[d.getMonth()];
        } else if (groupBy === 'week') {
          // Calculate week of the month or just simple day/month for the start of the week
          const firstDayOfWeek = new Date(d.setDate(d.getDate() - d.getDay()));
          key = `${firstDayOfWeek.getFullYear()}-${firstDayOfWeek.getMonth()}-${firstDayOfWeek.getDate()}`;
          label = `${String(firstDayOfWeek.getDate()).padStart(2, '0')}/${String(firstDayOfWeek.getMonth() + 1).padStart(2, '0')}`;
        } else {
          key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
          label = `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`;
        }

        let valToAdd = 0;
        if (activeFilter === 'VOLUME') valToAdd = session.volume;
        else if (activeFilter === 'REPS') valToAdd = session.reps;
        else if (activeFilter === 'DURATION') valToAdd = Math.round(session.duration_seconds / 60);

        if (!groupedMap.has(key)) {
          groupedMap.set(key, { label, value: 0 });
        }
        groupedMap.get(key)!.value += valToAdd;
      });

      setChartData(Array.from(groupedMap.values()));
    } catch (error) {
      console.error('Error loading plan stats:', error);
    } finally {
      setLoading(false);
    }
  }, [routineId, activeFilter]);

  return {
    overview,
    activeFilter,
    setActiveFilter,
    chartData,
    loading
  };
}
