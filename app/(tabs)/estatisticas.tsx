import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  Pressable,
  Alert,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Menu, TrendingUp, Scale, Activity, ChevronDown } from 'lucide-react-native';
import { db } from '@/database/schema';
import { BarChart } from '@/components/ui/BarChart';
import { DonutChart } from '@/components/ui/DonutChart';
import { LineChart } from '@/components/ui/LineChart';
import { HeatmapGrid } from '@/components/ui/HeatmapGrid';

interface BodyMetric {
  id: string;
  date: string;
  weight_kg: number;
  body_fat_percentage: number | null;
  notes: string | null;
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CHART_WIDTH = SCREEN_WIDTH - 80;

const weeklyVolumeData = [
  { label: 'SEG', value: 6200 },
  { label: 'TER', value: 7800 },
  { label: 'QUA', value: 0 },
  { label: 'QUI', value: 8400 },
  { label: 'SEX', value: 7200 },
  { label: 'SAB', value: 8900 },
  { label: 'DOM', value: 0 },
];

const muscleGroupData = [
  { value: 40, color: '#A0C4FF', label: 'Peito & Tríceps' },
  { value: 25, color: '#4ADE80', label: 'Costas & Bíceps' },
  { value: 20, color: '#FFA07A', label: 'Pernas' },
];

const rm1Data = [
  { label: 'S1', value: 275 },
  { label: 'S2', value: 280 },
  { label: 'S3', value: 285 },
  { label: 'S4', value: 290 },
  { label: 'S5', value: 295 },
  { label: 'S6', value: 300 },
  { label: 'S7', value: 305 },
  { label: 'S8', value: 310 },
];

const rm1BenchData = [
  { label: 'S1', value: 185 },
  { label: 'S2', value: 188 },
  { label: 'S3', value: 190 },
  { label: 'S4', value: 192 },
  { label: 'S5', value: 195 },
  { label: 'S6', value: 196 },
  { label: 'S7', value: 198 },
  { label: 'S8', value: 200 },
];

const heatmapData = [
  0.8, 1, 0, 0.6, 1, 0, 0.3,
  1, 0.5, 1, 0, 0.8, 1, 0.9,
  0.6, 0, 0.7, 1, 0.5, 0, 1,
  0.8, 1, 0.3, 0, 0.9, 1, 1,
  1, 0.6, 0, 0, 0, 0, 0,
];

const mockActivities = [
  {
    type: 'strength',
    title: 'Pernas (Hipertrofia)',
    time: 'Hoje, 07:30',
    details: '6 exercícios • 24 séries totais • 8,400 lbs volume',
    tags: ['NOVO PR', 'AGACHAMENTO'],
    color: '#4ADE80',
  },
  {
    type: 'strength',
    title: 'Peito & Ombro',
    time: 'Ontem, 18:15',
    details: '5 exercícios • 20 séries totais • 7,120 lbs volume',
    tags: [],
    color: '#888',
  },
  {
    type: 'cardio',
    title: 'HIIT Metabolic',
    time: '22 Out, 06:00',
    details: '25 mins • 420 kcal • Batimento Médio 145bpm',
    tags: [],
    color: '#FFA07A',
  },
];

export default function EstatisticasScreen() {
  const [periodFilter, setPeriodFilter] = useState<'7' | '30'>('30');
  const [bodyMetrics, setBodyMetrics] = useState<BodyMetric[]>([]);
  const [showAddMetricModal, setShowAddMetricModal] = useState(false);
  const [newWeight, setNewWeight] = useState('');
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
    const id = 'bm_' + Date.now();
    const today = new Date().toISOString().split('T')[0];

    try {
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

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

        <View style={styles.header}>
          <TouchableOpacity>
            <Menu size={24} color="#FFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>BODY FORGE</Text>
          <View style={styles.avatarPlaceholder}>
            <View style={{ width: 32, height: 32, backgroundColor: '#333', borderRadius: 16, overflow: 'hidden' }}>
              <View style={{ flex: 1, backgroundColor: '#FAD6B1', marginTop: 8, marginHorizontal: 6, borderTopLeftRadius: 10, borderTopRightRadius: 10 }} />
            </View>
          </View>
        </View>

        <Text style={styles.sectionLabel}>ANALYTICS HUB</Text>
        <Text style={styles.pageTitle}>Estatísticas</Text>

        <View style={styles.periodToggle}>
          <TouchableOpacity
            style={[styles.periodButton, periodFilter === '7' && styles.periodButtonActive]}
            onPress={() => setPeriodFilter('7')}
          >
            <Text style={[styles.periodText, periodFilter === '7' && styles.periodTextActive]}>
              7 DIAS
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.periodButton, periodFilter === '30' && styles.periodButtonActive]}
            onPress={() => setPeriodFilter('30')}
          >
            <Text style={[styles.periodText, periodFilter === '30' && styles.periodTextActive]}>
              30 DIAS
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>VOLUME SEMANAL</Text>
            <TrendingUp size={18} color="#A0C4FF" />
          </View>
          <View style={styles.volumeRow}>
            <Text style={styles.bigNumber}>42,850</Text>
            <Text style={styles.bigUnit}> lbs</Text>
          </View>
          <View style={{ alignItems: 'center', marginTop: 16 }}>
            <BarChart
              data={weeklyVolumeData}
              width={CHART_WIDTH}
              height={120}
              barColor="#FFA07A"
              barBackgroundColor="#353945"
            />
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>GRUPO MUSCULAR</Text>
          <View style={{ alignItems: 'center', marginVertical: 16 }}>
            <DonutChart
              data={muscleGroupData}
              size={150}
              strokeWidth={18}
              centerLabel="12"
              centerSubLabel="SESSÕES"
            />
          </View>
          {muscleGroupData.map((g, i) => (
            <View key={i} style={styles.legendRow}>
              <View style={[styles.legendDot, { backgroundColor: g.color }]} />
              <Text style={styles.legendLabel}>{g.label}</Text>
              <Text style={styles.legendValue}>{g.value}%</Text>
            </View>
          ))}
        </View>

        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>1RM ESTIMADO</Text>
            <View style={styles.rmLegend}>
              <View style={styles.rmLegendItem}>
                <View style={[styles.rmLegendLine, { backgroundColor: '#A0C4FF' }]} />
                <Text style={styles.rmLegendText}>SQUAT</Text>
              </View>
              <View style={styles.rmLegendItem}>
                <View style={[styles.rmLegendLine, { backgroundColor: '#FFA07A' }]} />
                <Text style={styles.rmLegendText}>BENCH</Text>
              </View>
            </View>
          </View>
          <View style={styles.rmGoal}>
            <Text style={styles.rmGoalLabel}>PRÓXIMA META</Text>
            <Text style={styles.rmGoalValue}>315 lbs</Text>
          </View>
          <View style={{ alignItems: 'center' }}>
            <LineChart
              data={rm1Data}
              width={CHART_WIDTH}
              height={120}
              lineColor="#A0C4FF"
              showDots={false}
              showYLabels={false}
              fillGradient={false}
            />
          </View>
          <View style={{ alignItems: 'center', marginTop: -120 }}>
            <LineChart
              data={rm1BenchData}
              width={CHART_WIDTH}
              height={120}
              lineColor="#FFA07A"
              showDots={false}
              showYLabels={false}
              fillGradient={false}
              showLabels={false}
            />
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>CONSISTÊNCIA MENSAL</Text>
          <View style={{ marginTop: 12 }}>
            <HeatmapGrid
              data={heatmapData}
              columns={7}
              cellSize={28}
              cellGap={5}
              frequencyLabel="FREQUÊNCIA: 84%"
            />
          </View>
        </View>

        <Text style={styles.sectionTitleOutside}>REGISTRO DE ATIVIDADE</Text>
        {mockActivities.map((act, i) => (
          <View key={i} style={styles.activityCard}>
            <View style={styles.activityIcon}>
              <Activity size={16} color={act.color} />
            </View>
            <View style={{ flex: 1 }}>
              <View style={styles.activityHeader}>
                <Text style={styles.activityTitle}>{act.title}</Text>
                <Text style={styles.activityTime}>{act.time}</Text>
              </View>
              <Text style={styles.activityDetails}>{act.details}</Text>
              {act.tags.length > 0 && (
                <View style={styles.activityTags}>
                  {act.tags.map((tag, ti) => (
                    <View key={ti} style={styles.activityTag}>
                      <Text style={styles.activityTagText}>{tag}</Text>
                    </View>
                  ))}
                </View>
              )}
            </View>
          </View>
        ))}

        <Text style={styles.sectionTitleOutside}>CORPO</Text>

        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>PESO ATUAL</Text>
            <Scale size={18} color="#A0C4FF" />
          </View>
          {latestWeight ? (
            <>
              <View style={styles.volumeRow}>
                <Text style={styles.bigNumber}>{latestWeight.toFixed(1)}</Text>
                <Text style={styles.bigUnit}> kg</Text>
              </View>
              {weightDiff !== null && (
                <Text style={[styles.weightDiff, { color: weightDiff <= 0 ? '#4ADE80' : '#FFA07A' }]}>
                  {weightDiff > 0 ? '+' : ''}{weightDiff.toFixed(1)} kg desde a última medição
                </Text>
              )}
            </>
          ) : (
            <Text style={styles.noDataText}>Nenhuma medição registrada</Text>
          )}
        </View>

        {weightChartData.length > 1 && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>EVOLUÇÃO DO PESO</Text>
            <View style={{ alignItems: 'center', marginTop: 12 }}>
              <LineChart
                data={weightChartData}
                width={CHART_WIDTH}
                height={160}
                lineColor="#A0C4FF"
                dotColor="#A0C4FF"
              />
            </View>
          </View>
        )}

        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>HISTÓRICO DE MEDIÇÕES</Text>
            <TouchableOpacity
              style={styles.addButton}
              onPress={() => setShowAddMetricModal(true)}
            >
              <Text style={styles.addButtonText}>+ REGISTRAR</Text>
            </TouchableOpacity>
          </View>
          {bodyMetrics.slice(0, 5).map((m, i) => (
            <View key={m.id} style={[styles.metricRow, i < Math.min(bodyMetrics.length, 5) - 1 && styles.metricRowBorder]}>
              <View>
                <Text style={styles.metricDate}>
                  {new Date(m.date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}
                </Text>
                {m.notes && <Text style={styles.metricNotes}>{m.notes}</Text>}
              </View>
              <View style={styles.metricValues}>
                <Text style={styles.metricWeight}>{m.weight_kg.toFixed(1)} kg</Text>
                {m.body_fat_percentage && (
                  <Text style={styles.metricBf}>{m.body_fat_percentage.toFixed(1)}% BF</Text>
                )}
              </View>
            </View>
          ))}
          {bodyMetrics.length === 0 && (
            <Text style={styles.noDataText}>Nenhuma medição registrada ainda.</Text>
          )}
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      <Modal visible={showAddMetricModal} transparent animationType="slide">
        <Pressable style={styles.modalOverlay} onPress={() => setShowAddMetricModal(false)}>
          <Pressable style={styles.modalContent}>
            <Text style={styles.modalTitle}>Registrar Medição</Text>

            <Text style={styles.inputLabel}>Peso (kg) *</Text>
            <TextInput
              style={styles.input}
              placeholder="Ex: 84.5"
              placeholderTextColor="#5F6368"
              keyboardType="decimal-pad"
              value={newWeight}
              onChangeText={setNewWeight}
            />

            <Text style={styles.inputLabel}>% Gordura Corporal</Text>
            <TextInput
              style={styles.input}
              placeholder="Ex: 15.0"
              placeholderTextColor="#5F6368"
              keyboardType="decimal-pad"
              value={newBf}
              onChangeText={setNewBf}
            />

            <Text style={styles.inputLabel}>Notas</Text>
            <TextInput
              style={[styles.input, { height: 60, textAlignVertical: 'top' }]}
              placeholder="Observações opcionais..."
              placeholderTextColor="#5F6368"
              multiline
              value={newNotes}
              onChangeText={setNewNotes}
            />

            <TouchableOpacity style={styles.submitButton} onPress={handleAddMetric}>
              <Text style={styles.submitButtonText}>REGISTRAR</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => setShowAddMetricModal(false)}
            >
              <Text style={styles.cancelButtonText}>CANCELAR</Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#16181C',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  headerTitle: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: 1,
  },
  avatarPlaceholder: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#2A2C35',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sectionLabel: {
    color: '#A0C4FF',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.5,
    marginBottom: 4,
  },
  pageTitle: {
    color: '#FFF',
    fontSize: 32,
    fontWeight: '900',
    marginBottom: 16,
  },
  periodToggle: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 20,
  },
  periodButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#2A2D35',
  },
  periodButtonActive: {
    backgroundColor: '#252B3B',
    borderColor: '#A0C4FF',
  },
  periodText: {
    color: '#5F6368',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  periodTextActive: {
    color: '#A0C4FF',
  },
  card: {
    backgroundColor: '#1C1E26',
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  cardTitle: {
    color: '#888',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
  },
  volumeRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  bigNumber: {
    color: '#4ADE80',
    fontSize: 36,
    fontWeight: '900',
  },
  bigUnit: {
    color: '#888',
    fontSize: 14,
    fontWeight: '600',
  },
  legendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    gap: 8,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendLabel: {
    color: '#CCC',
    fontSize: 13,
    fontWeight: '600',
    flex: 1,
  },
  legendValue: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: '700',
  },
  rmLegend: {
    flexDirection: 'row',
    gap: 16,
  },
  rmLegendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  rmLegendLine: {
    width: 16,
    height: 2,
    borderRadius: 1,
  },
  rmLegendText: {
    color: '#888',
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  rmGoal: {
    alignItems: 'flex-end',
    marginBottom: 4,
  },
  rmGoalLabel: {
    color: '#888',
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  rmGoalValue: {
    color: '#4ADE80',
    fontSize: 24,
    fontWeight: '900',
  },
  sectionTitleOutside: {
    color: '#888',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1,
    marginTop: 8,
    marginBottom: 12,
  },
  activityCard: {
    flexDirection: 'row',
    backgroundColor: '#1C1E26',
    borderRadius: 16,
    padding: 16,
    marginBottom: 10,
    gap: 12,
  },
  activityIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#252B3B',
    justifyContent: 'center',
    alignItems: 'center',
  },
  activityHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  activityTitle: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '700',
  },
  activityTime: {
    color: '#5F6368',
    fontSize: 11,
    fontWeight: '600',
  },
  activityDetails: {
    color: '#888',
    fontSize: 11,
    lineHeight: 16,
    marginBottom: 6,
  },
  activityTags: {
    flexDirection: 'row',
    gap: 6,
  },
  activityTag: {
    backgroundColor: '#1A4D3A',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  activityTagText: {
    color: '#4ADE80',
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  weightDiff: {
    fontSize: 11,
    fontWeight: '700',
    marginTop: 6,
  },
  noDataText: {
    color: '#5F6368',
    fontSize: 13,
    marginTop: 8,
  },
  addButton: {
    backgroundColor: '#252B3B',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
  },
  addButtonText: {
    color: '#A0C4FF',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  metricRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
  },
  metricRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: '#2A2D35',
  },
  metricDate: {
    color: '#CCC',
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 2,
  },
  metricNotes: {
    color: '#5F6368',
    fontSize: 11,
  },
  metricValues: {
    alignItems: 'flex-end',
  },
  metricWeight: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '800',
  },
  metricBf: {
    color: '#888',
    fontSize: 11,
    fontWeight: '600',
    marginTop: 2,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#1C1E26',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 40,
  },
  modalTitle: {
    color: '#FFF',
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 20,
  },
  inputLabel: {
    color: '#888',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
    marginBottom: 6,
    marginTop: 12,
  },
  input: {
    backgroundColor: '#252B3B',
    borderRadius: 12,
    padding: 14,
    color: '#FFF',
    fontSize: 14,
    fontWeight: '600',
    borderWidth: 1,
    borderColor: '#2A2D35',
  },
  submitButton: {
    backgroundColor: '#A0C4FF',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    marginTop: 24,
  },
  submitButtonText: {
    color: '#16181C',
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 1,
  },
  cancelButton: {
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  cancelButtonText: {
    color: '#888',
    fontSize: 13,
    fontWeight: '700',
  },
});
