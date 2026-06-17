import React from 'react';
import { View, ScrollView, TouchableOpacity, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Play } from 'lucide-react-native';

import { useWorkoutStore } from '@/hooks/useWorkoutStore';

import { useHomeData } from '@/hooks/useHomeData';
import useWaterTracker from '@/hooks/useWaterTracker';

import { HomeHeader } from '@/components/home/HomeHeader';
import { ActivePlans } from '@/components/home/ActivePlans';
import { ActivityLog } from '@/components/home/ActivityLog';
import { BodyMetrics } from '@/components/home/BodyMetrics';
import { WaterTracker } from '@/components/home/WaterTracker';
import { scheduleNextWorkoutReminder } from '@/services/plannerUtils';

export default function HomeScreen() {
  const router = useRouter();
  const homeData = useHomeData();
  const waterData = useWaterTracker();
  const isWorkoutActive = useWorkoutStore(s => s.isActive);

  React.useEffect(() => {
    scheduleNextWorkoutReminder();
  }, []);

  return (
    <View className="flex-1 bg-forge-bg">
      <SafeAreaView className="flex-1" edges={['top']}>
        <ScrollView
          contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 10, paddingBottom: 120 }}
          showsVerticalScrollIndicator={false}
        >
          <HomeHeader
            currentMonthStr={homeData.currentMonthStr}
            completedDays={homeData.completedDays}
            weekDays={homeData.weekDays}
            weeklyGoal={homeData.weeklyGoal}
            onUpdateGoal={homeData.updateWeeklyGoal}
          />

          <ActivePlans routines={homeData.routines} />

          {isWorkoutActive && (
            <TouchableOpacity 
              className="bg-forge-accent rounded-2xl p-4 mb-4 flex-row items-center mt-2 shadow-sm"
              onPress={() => router.push('/treino')}
            >
              <View className="w-10 h-10 rounded-full bg-forge-bg/20 items-center justify-center mr-3">
                <Play size={20} color="#111" fill="#111" />
              </View>
              <View>
                <Text className="text-forge-bg text-sm font-black tracking-wide">TREINO EM PROGRESSO</Text>
                <Text className="text-forge-bg/80 text-[11px] font-bold mt-0.5">Toque para retomar sua sessão</Text>
              </View>
            </TouchableOpacity>
          )}

          <ActivityLog
            completedDays={homeData.completedDays}
            weeklyStats={homeData.weeklyStats}
            weeklyMuscleData={homeData.weeklyMuscleData}
          />

          <BodyMetrics
            currentWeight={homeData.currentWeight}
            weightDiff={homeData.weightDiff}
            imc={homeData.imc}
          />

          <WaterTracker {...waterData} />
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}
