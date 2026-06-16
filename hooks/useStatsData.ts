import { useState, useCallback, useEffect } from 'react';
import { Alert } from 'react-native';
import { db } from '@/database/schema';

import { SessionRepository } from '@/database/repositories/SessionRepository';
import { useSettingsStore } from '@/hooks/useSettingsStore';
import { getDisplayMeasurement, convertToKg, convertToCm } from '@/utils/units';

export interface BodyMetric {
  id: string;
  date: string;
  weight_kg: number;
  body_fat_percentage: number | null;
  notes: string | null;
}

export type StatsPeriod = '7' | '30' | '1y' | 'all';
export type MuscleFocusType = 'primary' | 'secondary';

export function useStatsData() {
  const [periodFilter, setPeriodFilter] = useState<StatsPeriod>('30');
  const [muscleType, setMuscleType] = useState<MuscleFocusType>('primary');
  
  // New Stats State
  const [overview, setOverview] = useState({ total_sessions: 0, total_duration_seconds: 0, total_sets: 0 });
  const [muscleFocus, setMuscleFocus] = useState<{label: string, value: number}[]>([]);
  const [workoutsOverTime, setWorkoutsOverTime] = useState<{label: string, value: number, dateStr: string}[]>([]);

  const [bodyMetrics, setBodyMetrics] = useState<BodyMetric[]>([]);
  const [showAddMetricModal, setShowAddMetricModal] = useState(false);
  
  const [newWeight, setNewWeight] = useState('');
  const [newHeight, setNewHeight] = useState('');
  const [newBf, setNewBf] = useState('');
  const [newNotes, setNewNotes] = useState('');

  useEffect(() => {
    loadBodyMetrics();
  }, []);

  useEffect(() => {
    loadDynamicStats();
  }, [periodFilter, muscleType]);

  const loadDynamicStats = useCallback(() => {
    let startDate: string | null = null;
    const now = new Date();
    
    if (periodFilter === '7') {
      now.setDate(now.getDate() - 7);
      startDate = now.toISOString();
    } else if (periodFilter === '30') {
      now.setDate(now.getDate() - 30);
      startDate = now.toISOString();
    } else if (periodFilter === '1y') {
      now.setFullYear(now.getFullYear() - 1);
      startDate = now.toISOString();
    }
    // 'all' leaves startDate as null

    try {
      const statsOverview = SessionRepository.getStatsOverview(startDate);
      setOverview(statsOverview);

      const rawMuscleStats = SessionRepository.getMuscleFocusStats(startDate, muscleType);
      
      // Group small segments into "Outros"
      const totalMuscleSets = rawMuscleStats.reduce((sum, item) => sum + item.value, 0);
      let outrosValue = 0;
      const filteredStats = rawMuscleStats.filter(item => {
        const percent = (item.value / totalMuscleSets) * 100;
        // Se for <= 3% ou se for o grupo "outros" original, agrupa
        if (percent <= 3 || item.label.toLowerCase() === 'outros' || item.label.toLowerCase() === 'vários') {
          outrosValue += item.value;
          return false;
        }
        return true;
      });
      
      if (outrosValue > 0) {
        filteredStats.push({ label: 'Outros', value: outrosValue });
      }
      
      // Re-sort so "Outros" is typically at the end or ordered by value
      filteredStats.sort((a, b) => b.value - a.value);
      
      setMuscleFocus(filteredStats);

      if (periodFilter !== '7') {
        const groupBy = periodFilter === '30' ? 'week' : 'month';
        const wOverTime = SessionRepository.getWorkoutsOverTime(startDate, groupBy);
        setWorkoutsOverTime(wOverTime);
      } else {
        setWorkoutsOverTime([]);
      }
    } catch (e) {
      console.error('Error loading dynamic stats:', e);
    }
  }, [periodFilter, muscleType]);

  const loadBodyMetrics = useCallback(() => {
    try {
      const result = db.getAllSync<BodyMetric>(
        'SELECT * FROM body_metrics WHERE user_id = ? ORDER BY date DESC',
        ['user_1']
      );
      setBodyMetrics(result);
      
      const user = db.getFirstSync<{ height_cm: number | null }>('SELECT height_cm FROM users WHERE id = ?', ['user_1']);
      if (user && user.height_cm) {
        const displayHeight = getDisplayMeasurement(user.height_cm, useSettingsStore.getState().measurementUnit);
        setNewHeight(displayHeight.toString());
      }
    } catch (error) {
      console.error('Error loading body metrics:', error);
    }
  }, []);

  const handleAddMetric = () => {
    const inputWeight = parseFloat(newWeight);
    if (isNaN(inputWeight) || inputWeight <= 0) {
      Alert.alert('Erro', 'Insira um peso válido.');
      return;
    }
    const weightKg = convertToKg(inputWeight, useSettingsStore.getState().weightUnit);

    const bf = newBf ? parseFloat(newBf) : null;
    const inputHeight = newHeight ? parseFloat(newHeight) : null;
    const heightCm = inputHeight ? convertToCm(inputHeight, useSettingsStore.getState().measurementUnit) : null;
    const id = 'bm_' + Date.now();
    const today = new Date().toISOString().split('T')[0];

    try {
      db.runSync('INSERT OR IGNORE INTO users (id, name) VALUES (?, ?)', ['user_1', 'Atleta']);
      
      if (heightCm) {
        db.runSync('UPDATE users SET height_cm = ? WHERE id = ?', [heightCm, 'user_1']);
      }

      db.runSync(
        'INSERT INTO body_metrics (id, user_id, date, weight_kg, body_fat_percentage, notes) VALUES (?, ?, ?, ?, ?, ?)',
        [id, 'user_1', today, weightKg, bf, newNotes || null]
      );
      setNewWeight('');
      setNewBf('');
      setNewNotes('');
      setShowAddMetricModal(false);
      loadBodyMetrics();
    } catch (error) {
      console.error('Error inserting body metric:', error);
      Alert.alert('Erro', 'Não foi possível salvar a métrica.');
    }
  };

  const weightChartData = [...bodyMetrics]
    .reverse()
    .slice(-8)
    .map((m) => ({
      label: new Date(m.date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }).replace('.', ''),
      value: m.weight_kg,
    }));

  const latestWeight = bodyMetrics.length > 0 ? bodyMetrics[0].weight_kg : null;
  const previousWeight = bodyMetrics.length > 1 ? bodyMetrics[1].weight_kg : null;
  const weightDiff = latestWeight && previousWeight ? latestWeight - previousWeight : null;

  return {
    periodFilter,
    setPeriodFilter,
    muscleType,
    setMuscleType,
    overview,
    muscleFocus,
    workoutsOverTime,
    bodyMetrics,
    showAddMetricModal,
    setShowAddMetricModal,
    newWeight,
    setNewWeight,
    newHeight,
    setNewHeight,
    newBf,
    setNewBf,
    newNotes,
    setNewNotes,
    handleAddMetric,
    weightChartData,
    latestWeight,
    weightDiff
  };
}
