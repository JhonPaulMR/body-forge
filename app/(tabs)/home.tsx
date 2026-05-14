import React from 'react';
import { View, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useHomeData } from '@/hooks/useHomeData';
import useWaterTracker from '@/hooks/useWaterTracker';

import { HomeHeader } from '@/components/home/HomeHeader';
import { ActivePlans } from '@/components/home/ActivePlans';
import { ActivityLog } from '@/components/home/ActivityLog';
import { BodyMetrics } from '@/components/home/BodyMetrics';
import { WaterTracker } from '@/components/home/WaterTracker';

export default function HomeScreen() {
  const homeData = useHomeData();
  const waterData = useWaterTracker();

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
          />

          <ActivePlans routines={homeData.routines} />

          <ActivityLog
            completedDays={homeData.completedDays}
            weeklyStats={homeData.weeklyStats}
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
