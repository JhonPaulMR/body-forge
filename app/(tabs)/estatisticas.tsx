import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  Pressable,
  Alert,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Menu, TrendingUp, Scale, Activity } from 'lucide-react-native';
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
    <SafeAreaView className="flex-1 bg-forge-bg" edges={['top']}>
      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 10 }} showsVerticalScrollIndicator={false}>

        <View className="flex-row items-center justify-between mb-6">
          <TouchableOpacity>
            <Menu size={24} color="#FFF" />
          </TouchableOpacity>
          <Text className="text-white text-lg font-black tracking-wide">BODY FORGE</Text>
          <View className="w-9 h-9 rounded-full bg-forge-border justify-center items-center">
            <View className="w-8 h-8 bg-forge-avatar rounded-2xl overflow-hidden">
              <View className="flex-1 bg-forge-skin mt-2 mx-1.5 rounded-t-[10px]" />
            </View>
          </View>
        </View>

        <Text className="text-forge-accent text-[11px] font-bold tracking-widest mb-1">ANALYTICS HUB</Text>
        <Text className="text-white text-[32px] font-black mb-4">Estatísticas</Text>

        <View className="flex-row gap-2 mb-5">
          <TouchableOpacity
            className={`px-4 py-2 rounded-[20px] border ${periodFilter === '7' ? 'bg-forge-accent-bg border-forge-accent' : 'border-forge-border'}`}
            onPress={() => setPeriodFilter('7')}
          >
            <Text className={`text-[11px] font-bold tracking-tight ${periodFilter === '7' ? 'text-forge-accent' : 'text-forge-muted-dark'}`}>
              7 DIAS
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            className={`px-4 py-2 rounded-[20px] border ${periodFilter === '30' ? 'bg-forge-accent-bg border-forge-accent' : 'border-forge-border'}`}
            onPress={() => setPeriodFilter('30')}
          >
            <Text className={`text-[11px] font-bold tracking-tight ${periodFilter === '30' ? 'text-forge-accent' : 'text-forge-muted-dark'}`}>
              30 DIAS
            </Text>
          </TouchableOpacity>
        </View>

        <View className="bg-forge-surface rounded-[20px] p-5 mb-4">
          <View className="flex-row justify-between items-center mb-2">
            <Text className="text-forge-muted text-[11px] font-bold tracking-wide">VOLUME SEMANAL</Text>
            <TrendingUp size={18} color="#A0C4FF" />
          </View>
          <View className="flex-row items-baseline">
            <Text className="text-forge-green text-[36px] font-black">42,850</Text>
            <Text className="text-forge-muted text-sm font-semibold"> lbs</Text>
          </View>
          <View className="items-center mt-4">
            <BarChart
              data={weeklyVolumeData}
              width={CHART_WIDTH}
              height={120}
              barColor="#FFA07A"
              barBackgroundColor="#353945"
            />
          </View>
        </View>

        <View className="bg-forge-surface rounded-[20px] p-5 mb-4">
          <Text className="text-forge-muted text-[11px] font-bold tracking-wide">GRUPO MUSCULAR</Text>
          <View className="items-center my-4">
            <DonutChart
              data={muscleGroupData}
              size={150}
              strokeWidth={18}
              centerLabel="12"
              centerSubLabel="SESSÕES"
            />
          </View>
          {muscleGroupData.map((g, i) => (
            <View key={i} className="flex-row items-center py-1.5 gap-2">
              <View className="w-2 h-2 rounded-full" style={{ backgroundColor: g.color }} />
              <Text className="text-forge-text-secondary text-[13px] font-semibold flex-1">{g.label}</Text>
              <Text className="text-white text-[13px] font-bold">{g.value}%</Text>
            </View>
          ))}
        </View>

        <View className="bg-forge-surface rounded-[20px] p-5 mb-4">
          <View className="flex-row justify-between items-center mb-2">
            <Text className="text-forge-muted text-[11px] font-bold tracking-wide">1RM ESTIMADO</Text>
            <View className="flex-row gap-4">
              <View className="flex-row items-center gap-1">
                <View className="w-4 h-0.5 rounded-sm bg-forge-accent" />
                <Text className="text-forge-muted text-[9px] font-bold tracking-tight">SQUAT</Text>
              </View>
              <View className="flex-row items-center gap-1">
                <View className="w-4 h-0.5 rounded-sm bg-forge-orange" />
                <Text className="text-forge-muted text-[9px] font-bold tracking-tight">BENCH</Text>
              </View>
            </View>
          </View>
          <View className="items-end mb-1">
            <Text className="text-forge-muted text-[9px] font-bold tracking-tight">PRÓXIMA META</Text>
            <Text className="text-forge-green text-2xl font-black">315 lbs</Text>
          </View>
          <View className="items-center">
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
          <View className="items-center" style={{ marginTop: -120 }}>
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

        <View className="bg-forge-surface rounded-[20px] p-5 mb-4">
          <Text className="text-forge-muted text-[11px] font-bold tracking-wide">CONSISTÊNCIA MENSAL</Text>
          <View className="mt-3">
            <HeatmapGrid
              data={heatmapData}
              columns={7}
              cellSize={28}
              cellGap={5}
              frequencyLabel="FREQUÊNCIA: 84%"
            />
          </View>
        </View>

        <Text className="text-forge-muted text-xs font-bold tracking-wide mt-2 mb-3">REGISTRO DE ATIVIDADE</Text>
        {mockActivities.map((act, i) => (
          <View key={i} className="flex-row bg-forge-surface rounded-2xl p-4 mb-2.5 gap-3">
            <View className="w-9 h-9 rounded-full bg-forge-accent-bg justify-center items-center">
              <Activity size={16} color={act.color} />
            </View>
            <View className="flex-1">
              <View className="flex-row justify-between items-center mb-1">
                <Text className="text-white text-sm font-bold">{act.title}</Text>
                <Text className="text-forge-muted-dark text-[11px] font-semibold">{act.time}</Text>
              </View>
              <Text className="text-forge-muted text-[11px] leading-4 mb-1.5">{act.details}</Text>
              {act.tags.length > 0 && (
                <View className="flex-row gap-1.5">
                  {act.tags.map((tag, ti) => (
                    <View key={ti} className="bg-forge-green-bg px-2.5 py-1 rounded-md">
                      <Text className="text-forge-green text-[9px] font-bold tracking-tight">{tag}</Text>
                    </View>
                  ))}
                </View>
              )}
            </View>
          </View>
        ))}

        <Text className="text-forge-muted text-xs font-bold tracking-wide mt-2 mb-3">CORPO</Text>

        <View className="bg-forge-surface rounded-[20px] p-5 mb-4">
          <View className="flex-row justify-between items-center mb-2">
            <Text className="text-forge-muted text-[11px] font-bold tracking-wide">PESO ATUAL</Text>
            <Scale size={18} color="#A0C4FF" />
          </View>
          {latestWeight ? (
            <>
              <View className="flex-row items-baseline">
                <Text className="text-forge-green text-[36px] font-black">{latestWeight.toFixed(1)}</Text>
                <Text className="text-forge-muted text-sm font-semibold"> kg</Text>
              </View>
              {weightDiff !== null && (
                <Text
                  className="text-[11px] font-bold mt-1.5"
                  style={{ color: weightDiff <= 0 ? '#4ADE80' : '#FFA07A' }}
                >
                  {weightDiff > 0 ? '+' : ''}{weightDiff.toFixed(1)} kg desde a última medição
                </Text>
              )}
            </>
          ) : (
            <Text className="text-forge-muted-dark text-[13px] mt-2">Nenhuma medição registrada</Text>
          )}
        </View>

        {weightChartData.length > 1 && (
          <View className="bg-forge-surface rounded-[20px] p-5 mb-4">
            <Text className="text-forge-muted text-[11px] font-bold tracking-wide">EVOLUÇÃO DO PESO</Text>
            <View className="items-center mt-3">
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

        <View className="bg-forge-surface rounded-[20px] p-5 mb-4">
          <View className="flex-row justify-between items-center mb-2">
            <Text className="text-forge-muted text-[11px] font-bold tracking-wide">HISTÓRICO DE MEDIÇÕES</Text>
            <TouchableOpacity
              className="bg-forge-accent-bg px-3.5 py-2 rounded-xl"
              onPress={() => setShowAddMetricModal(true)}
            >
              <Text className="text-forge-accent text-[10px] font-extrabold tracking-tight">+ REGISTRAR</Text>
            </TouchableOpacity>
          </View>
          {bodyMetrics.slice(0, 5).map((m, i) => (
            <View
              key={m.id}
              className={`flex-row justify-between items-center py-3.5 ${i < Math.min(bodyMetrics.length, 5) - 1 ? 'border-b border-forge-border' : ''}`}
            >
              <View>
                <Text className="text-forge-text-secondary text-[13px] font-semibold mb-0.5">
                  {new Date(m.date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}
                </Text>
                {m.notes && <Text className="text-forge-muted-dark text-[11px]">{m.notes}</Text>}
              </View>
              <View className="items-end">
                <Text className="text-white text-base font-extrabold">{m.weight_kg.toFixed(1)} kg</Text>
                {m.body_fat_percentage && (
                  <Text className="text-forge-muted text-[11px] font-semibold mt-0.5">{m.body_fat_percentage.toFixed(1)}% BF</Text>
                )}
              </View>
            </View>
          ))}
          {bodyMetrics.length === 0 && (
            <Text className="text-forge-muted-dark text-[13px] mt-2">Nenhuma medição registrada ainda.</Text>
          )}
        </View>

        <View className="h-[100px]" />
      </ScrollView>

      <Modal visible={showAddMetricModal} transparent animationType="slide">
        <Pressable className="flex-1 bg-black/60 justify-end" onPress={() => setShowAddMetricModal(false)}>
          <Pressable className="bg-forge-surface rounded-t-3xl p-6 pb-10">
            <Text className="text-white text-xl font-extrabold mb-5">Registrar Medição</Text>

            <Text className="text-forge-muted text-[11px] font-bold tracking-tight mb-1.5 mt-3">Peso (kg) *</Text>
            <TextInput
              className="bg-forge-accent-bg rounded-xl p-3.5 text-white text-sm font-semibold border border-forge-border"
              placeholder="Ex: 84.5"
              placeholderTextColor="#5F6368"
              keyboardType="decimal-pad"
              value={newWeight}
              onChangeText={setNewWeight}
            />

            <Text className="text-forge-muted text-[11px] font-bold tracking-tight mb-1.5 mt-3">% Gordura Corporal</Text>
            <TextInput
              className="bg-forge-accent-bg rounded-xl p-3.5 text-white text-sm font-semibold border border-forge-border"
              placeholder="Ex: 15.0"
              placeholderTextColor="#5F6368"
              keyboardType="decimal-pad"
              value={newBf}
              onChangeText={setNewBf}
            />

            <Text className="text-forge-muted text-[11px] font-bold tracking-tight mb-1.5 mt-3">Notas</Text>
            <TextInput
              className="bg-forge-accent-bg rounded-xl p-3.5 text-white text-sm font-semibold border border-forge-border h-[60px]"
              style={{ textAlignVertical: 'top' }}
              placeholder="Observações opcionais..."
              placeholderTextColor="#5F6368"
              multiline
              value={newNotes}
              onChangeText={setNewNotes}
            />

            <TouchableOpacity className="bg-forge-accent rounded-2xl p-4 items-center mt-6" onPress={handleAddMetric}>
              <Text className="text-forge-bg text-sm font-extrabold tracking-wide">REGISTRAR</Text>
            </TouchableOpacity>

            <TouchableOpacity
              className="p-4 items-center mt-2"
              onPress={() => setShowAddMetricModal(false)}
            >
              <Text className="text-forge-muted text-[13px] font-bold">CANCELAR</Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}
