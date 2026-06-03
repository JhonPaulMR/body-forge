import React, { useCallback, useState, useEffect } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { Play } from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { db } from '@/database/schema';

import { useWorkoutStore } from '@/hooks/useWorkoutStore';
import { ActiveWorkoutView } from '@/components/workout/ActiveWorkoutView';
import { parseMuscleGroup } from '@/services/muscleGroupUtils';
import { AppHeader } from '@/components/AppHeader';
import { CalendarWidget } from '@/components/CalendarWidget';
import { useHomeData } from '@/hooks/useHomeData';

export default function TreinoTab() {
  const router = useRouter();
  const params = useLocalSearchParams<{ dayId: string }>();
  const { isActive } = useWorkoutStore();
  const [nextWorkout, setNextWorkout] = useState<any>(null);
  const [consumedDayId, setConsumedDayId] = useState<string | null>(null);
  const homeData = useHomeData();

  const currentDayId = params.dayId;

  useFocusEffect(
    useCallback(() => {
      if (!isActive && !currentDayId) {
        loadNextSuggestedWorkout();
      }
    }, [isActive, currentDayId])
  );

  useEffect(() => {
    if (currentDayId && currentDayId !== consumedDayId && !isActive) {
      setConsumedDayId(currentDayId);
    }
  }, [currentDayId, isActive]);

  const loadNextSuggestedWorkout = async () => {
    // ... existing load logic
    try {
      const activeIdsStr = await AsyncStorage.getItem('active_routine_ids');
      const activeIds: string[] = activeIdsStr ? JSON.parse(activeIdsStr) : [];
      
      if (activeIds.length === 0) {
        setNextWorkout(null);
        return;
      }

      // Pegamos a primeira rotina ativa
      const mainRoutineId = activeIds[0];
      
      const days = db.getAllSync<any>(
        'SELECT id, day_name, order_index FROM routine_days WHERE routine_id = ? ORDER BY order_index ASC',
        [mainRoutineId]
      );

      if (days.length === 0) {
        setNextWorkout(null);
        return;
      }

      const lastSession = db.getFirstSync<any>(
        `SELECT rd.order_index 
         FROM sessions s 
         JOIN routine_days rd ON s.routine_day_id = rd.id
         WHERE rd.routine_id = ? 
         ORDER BY s.start_time DESC LIMIT 1`,
        [mainRoutineId]
      );

      let nextDay = days[0];
      if (lastSession) {
        const nextIndex = days.findIndex(d => d.order_index > lastSession.order_index);
        if (nextIndex !== -1) {
          nextDay = days[nextIndex];
        }
      }

      const exs = db.getAllSync<any>(
        `SELECT re.target_sets, re.rest_time_seconds, re.superset_id, e.muscle_group
         FROM routine_exercises re
         JOIN exercises e ON re.exercise_id = e.id
         WHERE re.routine_day_id = ?`,
        [nextDay.id]
      );

      let totalMinutes = 0;
      const muscleCounts: Record<string, number> = {};

      exs.forEach(ex => {
        let isSpecialSet = !!ex.superset_id;
        const restMinutes = (ex.rest_time_seconds || 0) / 60;
        if (isSpecialSet) {
          totalMinutes += restMinutes;
        } else {
          totalMinutes += ((ex.target_sets || 0) * restMinutes);
        }
        totalMinutes += (ex.target_sets || 0);

        const muscleData = parseMuscleGroup(ex.muscle_group);
        const muscle = muscleData.primaryString;
        if (muscle) {
          muscleCounts[muscle] = (muscleCounts[muscle] || 0) + 1;
        }
      });

      const topMuscles = Object.entries(muscleCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(m => m[0].toUpperCase());

      setNextWorkout({
        routineId: mainRoutineId,
        dayId: nextDay.id,
        name: nextDay.day_name,
        estTime: Math.ceil(totalMinutes),
        muscles: topMuscles,
      });

    } catch (e) {
      console.error(e);
    }
  };

  const isStartingNew = currentDayId && currentDayId !== consumedDayId && !isActive;

  if (isActive || isStartingNew) {
    return <ActiveWorkoutView />;
  }

  return (
    <SafeAreaView className="flex-1 bg-forge-bg" edges={['top']}>
      <AppHeader />
      
      <View className="px-5 mb-4">
        <CalendarWidget 
          currentMonthStr={homeData.currentMonthStr}
          completedDays={homeData.completedDays}
          weekDays={homeData.weekDays}
          weeklyGoal={homeData.weeklyGoal}
          onUpdateGoal={homeData.updateWeeklyGoal}
        />
      </View>

      <View className="flex-1 px-6 justify-center mt-[-40px]">
        <Text className="text-white text-4xl font-black text-center leading-[42px] tracking-tight mb-4">
          Nenhum treino{"\n"}ativo
        </Text>
      
      <Text className="text-forge-muted text-base font-medium text-center mb-10 px-4">
        Pronto para começar sua próxima evolução?
      </Text>

      <TouchableOpacity 
        className="w-full bg-[#A0C4FF] rounded-xl py-4 items-center justify-center mb-16"
        onPress={() => {
          const newSessionId = 'sess_' + Math.random().toString(36).substr(2, 9);
          
          try {
            db.runSync(
              'INSERT INTO sessions (id, user_id, routine_day_id, start_time, total_volume_kg) VALUES (?, ?, ?, ?, ?)',
              [newSessionId, 'user_1', null, new Date().toISOString(), 0]
            );
            const { startFreeWorkout } = useWorkoutStore.getState();
            startFreeWorkout(newSessionId);
          } catch (e) {
            console.error('Failed to start free workout', e);
          }
        }}
      >
        <Text className="text-forge-bg text-sm font-black tracking-widest uppercase">
          INICIAR TREINO LIVRE
        </Text>
      </TouchableOpacity>

      {nextWorkout && (
        <View className="w-full">
          <Text className="text-forge-muted text-xs font-black tracking-widest mb-4">
            PRÓXIMO SUGERIDO
          </Text>
          
          <View className="bg-[#1C1E26] rounded-2xl p-5 border border-forge-border/20 shadow-md">
            <View className="flex-row justify-between items-start mb-4">
              <View className="flex-1 mr-4">
                <Text className="text-white text-xl font-bold mb-2">
                  {nextWorkout.name}
                </Text>
                <Text className="text-forge-muted text-xs font-medium">
                  ⏱ Est. {nextWorkout.estTime} min
                </Text>
              </View>
              
              <TouchableOpacity 
                className="w-12 h-12 bg-[#2D3038] rounded-2xl items-center justify-center"
                onPress={() => {
                  router.push(`/planner/day-details?dayId=${nextWorkout.dayId}&routineId=${nextWorkout.routineId}`);
                }}
              >
                <Play size={18} color="#A0C4FF" />
              </TouchableOpacity>
            </View>

            {nextWorkout.muscles.length > 0 && (
              <View className="flex-row flex-wrap gap-2">
                {nextWorkout.muscles.map((m: string) => (
                  <View key={m} className="px-3 py-1.5 rounded-lg border border-forge-border/40 bg-forge-surface/30">
                    <Text className="text-forge-muted text-[10px] font-bold tracking-widest">{m}</Text>
                  </View>
                ))}
              </View>
            )}
          </View>
        </View>
      )}
      </View>
    </SafeAreaView>
  );
}
