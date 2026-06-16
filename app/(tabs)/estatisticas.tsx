import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
// @ts-ignore - lucide-react-native type definitions have a bug missing some icons
import { Settings } from 'lucide-react-native';
import { useRouter } from 'expo-router';

import { useStatsData } from '@/hooks/useStatsData';
import { CurrentWeight } from '@/components/stats/CurrentWeight';
import { WeightEvolutionChart } from '@/components/stats/WeightEvolutionChart';
import { StatsHistory } from '@/components/stats/StatsHistory';
import { MetricsRegistrationModal } from '@/components/stats/MetricsRegistrationModal';

import { BarChart } from '@/components/ui/BarChart';
import { DonutChart } from '@/components/ui/DonutChart';

// Constants and Mocks that could be moved later
const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CHART_WIDTH = SCREEN_WIDTH - 80;

const CHART_COLORS = [
  '#3B82F6', '#10B981', '#F97316', '#8B5CF6', '#EC4899',
  '#EAB308', '#EF4444', '#06B6D4', '#D946EF', '#84CC16'
];

export default function EstatisticasScreen() {
  const router = useRouter();
  const statsData = useStatsData();

  return (
    <SafeAreaView className="flex-1 bg-forge-bg" edges={['top']}>
      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 10, paddingBottom: 120 }} showsVerticalScrollIndicator={false}>

        <View className="flex-row items-center justify-between mb-6">
          <TouchableOpacity onPress={() => router.push('/settings')}>
            <Settings size={24} color="#FFF" />
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
            className={`px-4 py-2 rounded-[20px] border ${statsData.periodFilter === '7' ? 'bg-forge-accent-bg border-forge-accent' : 'border-forge-border'}`}
            onPress={() => statsData.setPeriodFilter('7')}
          >
            <Text className={`text-[11px] font-bold tracking-tight ${statsData.periodFilter === '7' ? 'text-forge-accent' : 'text-forge-muted-dark'}`}>
              7 DIAS
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            className={`px-4 py-2 rounded-[20px] border ${statsData.periodFilter === '30' ? 'bg-forge-accent-bg border-forge-accent' : 'border-forge-border'}`}
            onPress={() => statsData.setPeriodFilter('30')}
          >
            <Text className={`text-[11px] font-bold tracking-tight ${statsData.periodFilter === '30' ? 'text-forge-accent' : 'text-forge-muted-dark'}`}>
              30 DIAS
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            className={`px-4 py-2 rounded-[20px] border ${statsData.periodFilter === '1y' ? 'bg-forge-accent-bg border-forge-accent' : 'border-forge-border'}`}
            onPress={() => statsData.setPeriodFilter('1y')}
          >
            <Text className={`text-[11px] font-bold tracking-tight ${statsData.periodFilter === '1y' ? 'text-forge-accent' : 'text-forge-muted-dark'}`}>
              1 ANO
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            className={`px-4 py-2 rounded-[20px] border ${statsData.periodFilter === 'all' ? 'bg-forge-accent-bg border-forge-accent' : 'border-forge-border'}`}
            onPress={() => statsData.setPeriodFilter('all')}
          >
            <Text className={`text-[11px] font-bold tracking-tight ${statsData.periodFilter === 'all' ? 'text-forge-accent' : 'text-forge-muted-dark'}`}>
              TODOS
            </Text>
          </TouchableOpacity>
        </View>

        {/* GENERAL METRICS */}
        <View className="mb-6">
          <Text className="text-forge-muted text-[11px] font-bold tracking-wide mb-3">GERAL</Text>
          <View className="flex-row flex-wrap gap-3">
            <View className="bg-forge-surface rounded-2xl p-4 flex-1 min-w-[45%]">
              <Text className="text-forge-muted-dark text-[10px] font-bold tracking-tight mb-1">SESSÕES DE TREINOS</Text>
              <Text className="text-white text-2xl font-black">{statsData.overview.total_sessions}</Text>
            </View>
            <View className="bg-forge-surface rounded-2xl p-4 flex-1 min-w-[45%]">
              <Text className="text-forge-muted-dark text-[10px] font-bold tracking-tight mb-1">TEMPO TOTAL</Text>
              <Text className="text-white text-2xl font-black">
                {Math.floor(statsData.overview.total_duration_seconds / 3600)}
                <Text className="text-sm font-semibold text-forge-muted">h</Text>
              </Text>
            </View>
            <View className="bg-forge-surface rounded-2xl p-4 flex-1 min-w-[45%]">
              <Text className="text-forge-muted-dark text-[10px] font-bold tracking-tight mb-1">DURAÇÃO MÉDIA</Text>
              <Text className="text-white text-2xl font-black">
                {statsData.overview.total_sessions > 0 ? Math.floor(statsData.overview.total_duration_seconds / statsData.overview.total_sessions / 60) : 0}
                <Text className="text-sm font-semibold text-forge-muted">min</Text>
              </Text>
            </View>
            <View className="bg-forge-surface rounded-2xl p-4 flex-1 min-w-[45%]">
              <Text className="text-forge-muted-dark text-[10px] font-bold tracking-tight mb-1">SÉRIES CONCLUÍDAS</Text>
              <Text className="text-white text-2xl font-black">{statsData.overview.total_sets}</Text>
            </View>
          </View>
        </View>

        {/* MUSCLE FOCUS CHART */}
        <View className="bg-forge-surface rounded-[20px] p-5 mb-4">
          <Text className="text-forge-muted text-[11px] font-bold tracking-wide">FOCO MUSCULAR</Text>
          <View className="items-center my-4">
            <DonutChart
              data={statsData.muscleFocus.map((m, i) => ({
                label: m.label,
                value: m.value,
                color: CHART_COLORS[i % CHART_COLORS.length]
              }))}
              size={170}
              strokeWidth={32}
              centerLabel={statsData.overview.total_sessions.toString()}
              centerSubLabel="SESSÕES"
              showPercentages={true}
            />
          </View>

          <View className="flex-row flex-wrap justify-between mt-2">
            {statsData.muscleFocus.map((g, i) => (
              <View key={i} className="flex-row items-center py-2 gap-2 w-[48%]">
                <View className="w-1.5 h-4 rounded-sm" style={{ backgroundColor: CHART_COLORS[i % CHART_COLORS.length] }} />
                <View className="flex-1">
                  <Text className="text-white text-[13px] font-semibold" numberOfLines={1}>{g.label.toUpperCase()}</Text>
                  <Text className="text-forge-muted-dark text-[10px] font-bold">{g.value} séries</Text>
                </View>
              </View>
            ))}
            {statsData.muscleFocus.length === 0 && (
               <Text className="text-forge-muted text-xs text-center w-full my-4">Nenhum dado registrado para o período.</Text>
            )}
          </View>

          <View className="flex-row gap-2 mt-4 pt-4 border-t border-forge-border">
            <TouchableOpacity
              className={`flex-1 py-2 rounded-xl items-center ${statsData.muscleType === 'primary' ? 'bg-forge-accent' : 'bg-forge-bg'}`}
              onPress={() => statsData.setMuscleType('primary')}
            >
              <Text className={`text-xs font-bold ${statsData.muscleType === 'primary' ? 'text-forge-bg' : 'text-white'}`}>Músculos primários</Text>
            </TouchableOpacity>
            <TouchableOpacity
              className={`flex-1 py-2 rounded-xl items-center ${statsData.muscleType === 'secondary' ? 'bg-forge-accent' : 'bg-forge-bg'}`}
              onPress={() => statsData.setMuscleType('secondary')}
            >
              <Text className={`text-xs font-bold ${statsData.muscleType === 'secondary' ? 'text-forge-bg' : 'text-white'}`}>Músculos secundários</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* WORKOUTS OVER TIME CHART */}
        {statsData.periodFilter !== '7' && (
          <View className="bg-forge-surface rounded-[20px] p-5 mb-4">
            <Text className="text-forge-muted text-[11px] font-bold tracking-wide mb-4">
              TREINOS POR {statsData.periodFilter === '30' ? 'SEMANA' : 'MÊS'}
            </Text>
            <View className="items-center">
              {statsData.workoutsOverTime.length > 0 ? (
                <BarChart
                  data={statsData.workoutsOverTime}
                  width={CHART_WIDTH}
                  height={160}
                  barColor="#A0C4FF"
                  barBackgroundColor="#2A2D35"
                  showGridLines={true}
                  customBarWidth={statsData.periodFilter === '30' ? 24 : 12}
                />
              ) : (
                <Text className="text-forge-muted text-xs text-center my-8">Nenhum treino registrado no período.</Text>
              )}
            </View>
          </View>
        )}

        <Text className="text-forge-muted text-xs font-bold tracking-wide mt-2 mb-3">CORPO</Text>

        <CurrentWeight 
          latestWeight={statsData.latestWeight} 
          weightDiff={statsData.weightDiff} 
        />

        <WeightEvolutionChart 
          weightChartData={statsData.weightChartData} 
        />

        <StatsHistory 
          bodyMetrics={statsData.bodyMetrics} 
          setShowAddMetricModal={statsData.setShowAddMetricModal} 
        />
      </ScrollView>

      <MetricsRegistrationModal {...statsData} />

    </SafeAreaView>
  );
}
