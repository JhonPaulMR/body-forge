import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  Dimensions,
  Modal,
  Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams, useFocusEffect } from 'expo-router';
import { ArrowLeft, Play, ChevronRight, Pencil, Share2, MoreVertical, Copy, Trash2 } from 'lucide-react-native';
import { db } from '@/database/schema';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface Routine {
  id: string;
  name: string;
  description: string | null;
  cover_image_uri: string | null;
}

interface RoutineDayDetail {
  id: string;
  day_name: string;
  order_index: number;
  exercises: DayExerciseInfo[];
}

interface DayExerciseInfo {
  id: string;
  name: string;
  muscle_group: string;
  target_sets: number;
  target_reps: string;
}

const phaseColors = ['#4ADE80', '#A0C4FF', '#FFA07A', '#C084FC', '#F472B6'];
const phaseLabels = ['ACTIVE PHASE', 'STRENGTH FOCUS', 'RECOVERY HYBRID', 'HYPERTROPHY', 'CONDITIONING'];

export default function PlanDetailsScreen() {
  const router = useRouter();
  const { routineId } = useLocalSearchParams<{ routineId: string }>();

  const [routine, setRoutine] = useState<Routine | null>(null);
  const [days, setDays] = useState<RoutineDayDetail[]>([]);
  const [activeTab, setActiveTab] = useState<'overview' | 'statistics'>('overview');
  const [showMenu, setShowMenu] = useState(false);

  useFocusEffect(
    useCallback(() => {
      if (routineId) {
        loadData();
      }
    }, [routineId])
  );

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
          `SELECT re.id, e.name, e.muscle_group, re.target_sets, re.target_reps
           FROM routine_exercises re
           JOIN exercises e ON re.exercise_id = e.id
           WHERE re.routine_day_id = ?
           ORDER BY re.order_index`,
          [day.id]
        );
        return { ...day, exercises };
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

        for (const ex of exercises) {
          db.runSync(
            `INSERT INTO routine_exercises (id, routine_day_id, exercise_id, order_index, superset_id, target_sets, target_reps, rest_time_seconds, set_configs)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            ['re_dup_' + Date.now() + Math.random().toString(36).substr(2, 5), newDayId, ex.exercise_id, ex.order_index, null, ex.target_sets, ex.target_reps, ex.rest_time_seconds, ex.set_configs]
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
    import('react-native').then(({ Alert }) => {
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
            router.replace('/(tabs)/planos' as any);
          } catch (e) { console.error(e); }
        }}
      ]);
    });
  };

  if (!routine) {
    return (
      <SafeAreaView className="flex-1 bg-forge-bg">
        <Text className="text-forge-muted text-base text-center mt-[100px]">Carregando...</Text>
      </SafeAreaView>
    );
  }

  const totalExercises = days.reduce((sum, d) => sum + d.exercises.length, 0);

  return (
    <SafeAreaView className="flex-1 bg-forge-bg" edges={['top']}>
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* Hero Image */}
        <View className="bg-forge-surface-hover" style={{ width: SCREEN_WIDTH, height: 200 }}>
          <Image
            source={{ uri: routine.cover_image_uri || 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=1000' }}
            className="w-full h-full opacity-40"
          />
          <View className="absolute inset-0" style={{ backgroundColor: 'rgba(22,24,28,0.35)' }} />

          {/* Header Overlay */}
          <View className="absolute top-3 left-0 right-0 flex-row items-center justify-between px-4">
            <TouchableOpacity
              className="w-9 h-9 rounded-xl justify-center items-center"
              style={{ backgroundColor: 'rgba(28,30,38,0.7)' }}
              onPress={() => router.back()}
            >
              <ArrowLeft size={20} color="#FFF" />
            </TouchableOpacity>
            <Text className="text-white text-sm font-extrabold tracking-wide">PLAN DETAILS</Text>
            <View className="flex-row gap-3">
              <TouchableOpacity onPress={() => router.push(`/planner?routineId=${routineId}` as any)}>
                <Pencil size={18} color="#FFF" />
              </TouchableOpacity>
              <TouchableOpacity>
                <Share2 size={18} color="#FFF" />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setShowMenu(true)}>
                <MoreVertical size={18} color="#FFF" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Plan Info Overlay */}
          <View className="absolute bottom-4 left-5 right-5">
            <Text className="text-forge-green text-[10px] font-bold tracking-widest mb-1">TITANIUM SERIES</Text>
            <Text className="text-white text-[28px] font-black leading-8">{routine.name}</Text>
          </View>
        </View>

        {/* Tab Selector */}
        <View className="flex-row px-5 border-b border-forge-border">
          <TouchableOpacity
            className={`py-4 mr-6 ${activeTab === 'overview' ? 'border-b-2 border-forge-accent' : ''}`}
            onPress={() => setActiveTab('overview')}
          >
            <Text className={`text-[13px] font-bold tracking-wide ${activeTab === 'overview' ? 'text-forge-accent' : 'text-forge-muted-dark'}`}>
              OVERVIEW
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            className={`py-4 mr-6 ${activeTab === 'statistics' ? 'border-b-2 border-forge-accent' : ''}`}
            onPress={() => setActiveTab('statistics')}
          >
            <Text className={`text-[13px] font-bold tracking-wide ${activeTab === 'statistics' ? 'text-forge-accent' : 'text-forge-muted-dark'}`}>
              STATISTICS
            </Text>
          </TouchableOpacity>
        </View>

        <View className="px-5 pt-5">
          {activeTab === 'overview' ? (
            <>
              {/* Training Schedule Header */}
              <View className="flex-row justify-between items-center mb-4">
                <Text className="text-white text-sm font-extrabold tracking-wide">TRAINING SCHEDULE</Text>
                <Text className="text-forge-muted text-[11px] font-semibold">{days.length} DAYS / WEEK</Text>
              </View>

              {/* Day Cards */}
              {days.map((day, index) => {
                const phaseColor = phaseColors[index % phaseColors.length];
                const phaseLabel = phaseLabels[index % phaseLabels.length];
                const exerciseCount = day.exercises.length;

                return (
                  <View key={day.id} className="bg-forge-surface rounded-[20px] p-5 mb-3 overflow-hidden">
                    <View className="flex-row justify-between items-start">
                      <View className="flex-1">
                        {/* Phase Tag */}
                        <View className="flex-row items-center gap-1.5 mb-2">
                          <View className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: phaseColor }} />
                          <Text className="text-[9px] font-bold tracking-widest" style={{ color: phaseColor }}>
                            {phaseLabel}
                          </Text>
                        </View>

                        {/* Day Name */}
                        <Text className="text-white text-xl font-black mb-2">{day.day_name}</Text>

                        {/* Info */}
                        <View className="flex-row items-center gap-3">
                          <Text className="text-forge-muted text-[11px] font-semibold">
                            🏋️ {exerciseCount} exercise{exerciseCount !== 1 ? 's' : ''}
                          </Text>
                          {exerciseCount > 0 && (
                            <Text className="text-forge-muted text-[11px] font-semibold">
                              ⏱ {exerciseCount * 8} min
                            </Text>
                          )}
                        </View>
                      </View>

                      {/* Large Number */}
                      <Text
                        className="text-[48px] font-black leading-[48px]"
                        style={{ color: 'rgba(160,196,255,0.12)' }}
                      >
                        {String(day.order_index).padStart(2, '0')}
                      </Text>
                    </View>

                    {/* View Exercises Link */}
                    {exerciseCount > 0 && (
                      <TouchableOpacity
                        className="flex-row items-center justify-end mt-2 gap-1"
                        onPress={() => router.push(`/planner?routineId=${routineId}` as any)}
                      >
                        <Text className="text-forge-accent text-[11px] font-bold tracking-tight">VIEW EXERCISES</Text>
                        <ChevronRight size={14} color="#A0C4FF" />
                      </TouchableOpacity>
                    )}
                  </View>
                );
              })}

              {days.length === 0 && (
                <View className="items-center py-12">
                  <Text className="text-forge-muted text-[13px] font-semibold">Nenhum dia configurado</Text>
                  <TouchableOpacity
                    className="mt-4 bg-forge-accent-bg px-5 py-3 rounded-xl"
                    onPress={() => router.push(`/planner?routineId=${routineId}` as any)}
                  >
                    <Text className="text-forge-accent text-xs font-extrabold tracking-tight">EDITAR PLANO</Text>
                  </TouchableOpacity>
                </View>
              )}
            </>
          ) : (
            <>
              {/* Statistics Grid */}
              <View className="flex-row flex-wrap gap-3 mb-5">
                <View className="flex-1 min-w-[45%] bg-forge-surface rounded-2xl p-4">
                  <Text className="text-forge-muted text-[9px] font-bold tracking-widest mb-1">WORKOUT SESSIONS</Text>
                  <Text className="text-white text-[32px] font-black">0</Text>
                </View>
                <View className="flex-1 min-w-[45%] bg-forge-surface rounded-2xl p-4">
                  <Text className="text-forge-muted text-[9px] font-bold tracking-widest mb-1">TOTAL TIME (HRS)</Text>
                  <Text className="text-white text-[32px] font-black">0</Text>
                </View>
                <View className="flex-1 min-w-[45%] bg-forge-surface rounded-2xl p-4">
                  <Text className="text-forge-muted text-[9px] font-bold tracking-widest mb-1">AVG. DURATION</Text>
                  <Text className="text-white text-[32px] font-black">00:00</Text>
                </View>
                <View className="flex-1 min-w-[45%] bg-forge-surface rounded-2xl p-4">
                  <Text className="text-forge-muted text-[9px] font-bold tracking-widest mb-1">SETS COMPLETED</Text>
                  <Text className="text-white text-[32px] font-black">0</Text>
                </View>
              </View>

              {/* Chart Filter */}
              <View className="flex-row gap-2 mb-5">
                {['VOLUME', 'REPS', 'DURATION'].map((filter, i) => (
                  <TouchableOpacity
                    key={filter}
                    className={`px-4 py-2 rounded-[20px] ${i === 0 ? 'bg-forge-accent-bg' : 'bg-forge-surface'}`}
                  >
                    <Text className={`text-[11px] font-bold tracking-tight ${i === 0 ? 'text-forge-accent' : 'text-forge-muted-dark'}`}>
                      {filter}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Empty Chart */}
              <View className="bg-forge-surface rounded-[20px] p-6 items-center justify-center min-h-[200px]">
                <View className="w-12 h-12 rounded-full bg-forge-border/50 justify-center items-center mb-3">
                  <Text className="text-forge-muted text-xl">📊</Text>
                </View>
                <Text className="text-white text-sm font-bold mb-1">No data available yet</Text>
                <Text className="text-forge-muted text-[11px] text-center">
                  Start a workout to see your progress
                </Text>

                {/* Placeholder Axis */}
                <View className="flex-row justify-between w-full mt-6">
                  <Text className="text-forge-muted-dark text-[9px]">JAN 1</Text>
                  <Text className="text-forge-muted-dark text-[9px]">FEB 15</Text>
                  <Text className="text-forge-muted-dark text-[9px]">APR 1</Text>
                </View>
              </View>
            </>
          )}
        </View>

        <View className="h-[100px]" />
      </ScrollView>

      {/* Start Plan Button */}
      <View className="absolute bottom-0 left-0 right-0 px-5 pb-8 pt-3 bg-forge-bg">
        <TouchableOpacity className="flex-row items-center justify-center bg-forge-accent rounded-2xl py-4 gap-2">
          <Text className="text-forge-bg text-sm font-extrabold tracking-wide">START PLAN</Text>
          <Play size={16} color="#1A1D24" fill="#1A1D24" />
        </TouchableOpacity>
      </View>

      {/* Routine Menu Modal */}
      {showMenu && (
        <Modal visible transparent animationType="fade">
          <Pressable className="flex-1 bg-black/60 justify-center items-center" onPress={() => setShowMenu(false)}>
            <View className="bg-forge-surface rounded-[16px] w-[220px] py-2 overflow-hidden">
              <TouchableOpacity className="flex-row items-center px-4 py-3.5 gap-3" onPress={handleDuplicate}>
                <Copy size={16} color="#A0C4FF" />
                <Text className="text-white text-sm font-semibold">Duplicar</Text>
              </TouchableOpacity>
              <View className="h-[1px] bg-forge-border mx-3 my-0.5" />
              <TouchableOpacity className="flex-row items-center px-4 py-3.5 gap-3" onPress={handleDelete}>
                <Trash2 size={16} color="#EF4444" />
                <Text className="text-red-400 text-sm font-semibold">Excluir</Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Modal>
      )}
    </SafeAreaView>
  );
}
