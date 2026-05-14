import { useState, useCallback, useEffect } from 'react';
import { Alert } from 'react-native';
import { db } from '@/database/schema';

export interface BodyMetric {
  id: string;
  date: string;
  weight_kg: number;
  body_fat_percentage: number | null;
  notes: string | null;
}

export function useStatsData() {
  const [periodFilter, setPeriodFilter] = useState<'7' | '30'>('30');
  const [bodyMetrics, setBodyMetrics] = useState<BodyMetric[]>([]);
  const [showAddMetricModal, setShowAddMetricModal] = useState(false);
  
  const [newWeight, setNewWeight] = useState('');
  const [newHeight, setNewHeight] = useState('');
  const [newBf, setNewBf] = useState('');
  const [newNotes, setNewNotes] = useState('');

  useEffect(() => {
    loadBodyMetrics();
  }, []);

  const loadBodyMetrics = useCallback(() => {
    try {
      const result = db.getAllSync<BodyMetric>(
        'SELECT * FROM body_metrics WHERE user_id = ? ORDER BY date DESC',
        ['user_1']
      );
      setBodyMetrics(result);
      
      const user = db.getFirstSync<{ height_cm: number | null }>('SELECT height_cm FROM users WHERE id = ?', ['user_1']);
      if (user && user.height_cm) {
        setNewHeight(user.height_cm.toString());
      }
    } catch (error) {
      console.error('Error loading body metrics:', error);
    }
  }, []);

  const handleAddMetric = () => {
    const weight = parseFloat(newWeight);
    if (isNaN(weight) || weight <= 0) {
      Alert.alert('Erro', 'Insira um peso válido.');
      return;
    }

    const bf = newBf ? parseFloat(newBf) : null;
    const height = newHeight ? parseFloat(newHeight) : null;
    const id = 'bm_' + Date.now();
    const today = new Date().toISOString().split('T')[0];

    try {
      db.runSync('INSERT OR IGNORE INTO users (id, name) VALUES (?, ?)', ['user_1', 'Atleta']);
      
      if (height) {
        db.runSync('UPDATE users SET height_cm = ? WHERE id = ?', [height, 'user_1']);
      }

      db.runSync(
        'INSERT INTO body_metrics (id, user_id, date, weight_kg, body_fat_percentage, notes) VALUES (?, ?, ?, ?, ?, ?)',
        [id, 'user_1', today, weight, bf, newNotes || null]
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
