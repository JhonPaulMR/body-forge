import React, { useState } from 'react';
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
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, Play, ChevronRight, Pencil, MoreVertical, Copy, Trash2, Check, Dumbbell, Clock, Zap, BarChart3 } from 'lucide-react-native';

import { useRoutineDetails, RoutineDayDetail } from '@/hooks/useRoutineDetails';
import { usePlanStats, PlanFilterType } from '@/hooks/usePlanStats';
import { BarChart } from '@/components/ui/BarChart';

const { width: SCREEN_WIDTH } = Dimensions.get('window');



export default function PlanDetailsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { routineId } = useLocalSearchParams<{ routineId: string }>();
  const [activeTab, setActiveTab] = useState<'overview' | 'statistics'>('overview');

  const {
    routine,
    days,
    isActivePlan,
    showMenu,
    setShowMenu,
    totalExercises,
    toggleActivePlan,
    handleDuplicate,
    handleDelete,
  } = useRoutineDetails(routineId);

  if (!routine) {
    return (
      <SafeAreaView className="flex-1 bg-forge-bg">
        <Text className="text-forge-muted text-base text-center mt-[100px]">Carregando...</Text>
      </SafeAreaView>
    );
  }

  const isBuiltin = routine.is_builtin === 1;

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
            <Text className="text-white text-sm font-extrabold tracking-wide">DETALHES DO PLANO</Text>
            <View className="flex-row gap-3">
              {!isBuiltin && (
                <TouchableOpacity onPress={() => router.push(`/planner?routineId=${routineId}` as any)}>
                  <Pencil size={18} color="#FFF" />
                </TouchableOpacity>
              )}
              <TouchableOpacity onPress={() => setShowMenu(true)}>
                <MoreVertical size={18} color="#FFF" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Plan Info Overlay */}
          <View className="absolute bottom-4 left-5 right-5">
            <Text className="text-forge-green text-[10px] font-bold tracking-widest mb-1">
              {isBuiltin ? 'PROGRAMA ESPECIALIZADO' : 'SÉRIE DE TREINO'}
            </Text>
            <Text className="text-white text-[28px] font-black leading-8">{routine.name}</Text>
            {isBuiltin && routine.description ? (
               <Text className="text-forge-muted text-xs leading-5 mt-2" numberOfLines={3}>{routine.description}</Text>
            ) : null}
          </View>
        </View>

        {/* Tab Selector */}
        <View className="flex-row px-5 border-b border-forge-border">
          <TouchableOpacity
            className={`py-4 mr-6 ${activeTab === 'overview' ? 'border-b-2 border-forge-accent' : ''}`}
            onPress={() => setActiveTab('overview')}
          >
            <Text className={`text-[13px] font-bold tracking-wide ${activeTab === 'overview' ? 'text-forge-accent' : 'text-forge-muted-dark'}`}>
              VISÃO GERAL
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            className={`py-4 mr-6 ${activeTab === 'statistics' ? 'border-b-2 border-forge-accent' : ''}`}
            onPress={() => setActiveTab('statistics')}
          >
            <Text className={`text-[13px] font-bold tracking-wide ${activeTab === 'statistics' ? 'text-forge-accent' : 'text-forge-muted-dark'}`}>
              ESTATÍSTICAS
            </Text>
          </TouchableOpacity>
        </View>

        <View className="px-5 pt-5">
          {activeTab === 'overview' ? (
            <OverviewTab days={days} routineId={routineId} />
          ) : (
            <StatisticsTab routineId={routineId} />
          )}
        </View>

        <View className="h-[100px]" />
      </ScrollView>

      {/* Start/Finish Plan Button */}
      <View 
        className="absolute bottom-0 left-0 right-0 px-5 pt-3 bg-forge-bg"
        style={{ paddingBottom: Math.max(insets.bottom, 24) }}
      >
        <TouchableOpacity 
          className={`flex-row items-center justify-center rounded-2xl py-4 gap-2 ${isActivePlan ? 'bg-forge-surface border border-forge-border' : 'bg-forge-accent'}`}
          onPress={toggleActivePlan}
        >
          <Text className={`text-sm font-extrabold tracking-wide ${isActivePlan ? 'text-forge-muted' : 'text-forge-bg'}`}>
            {isActivePlan ? 'FINALIZAR PLANO' : 'INICIAR PLANO'}
          </Text>
          {!isActivePlan && <Play size={16} color="#1A1D24" fill="#1A1D24" />}
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
              {!isBuiltin && (
                <>
                  <View className="h-[1px] bg-forge-border mx-3 my-0.5" />
                  <TouchableOpacity className="flex-row items-center px-4 py-3.5 gap-3" onPress={handleDelete}>
                    <Trash2 size={16} color="#EF4444" />
                    <Text className="text-red-400 text-sm font-semibold">Excluir</Text>
                  </TouchableOpacity>
                </>
              )}
            </View>
          </Pressable>
        </Modal>
      )}
    </SafeAreaView>
  );
}

// ---- Sub-components ----

function OverviewTab({ days, routineId }: { days: RoutineDayDetail[]; routineId: string }) {
  const router = useRouter();

  return (
    <>
      {/* Training Schedule Header */}
      <View className="flex-row justify-between items-center mb-4">
        <Text className="text-white text-sm font-extrabold tracking-wide">CRONOGRAMA DE TREINOS</Text>
        <Text className="text-forge-muted text-[11px] font-semibold">{days.length} DIAS / SEMANA</Text>
      </View>

      {/* Day Cards */}
      {days.map((day) => {
        const exerciseCount = day.exercises.length;

        return (
          <View key={day.id} className="bg-forge-surface rounded-[20px] p-5 mb-3 overflow-hidden">
            <View className="flex-row justify-between items-start">
              <View className="flex-1">
                {/* Day Name */}
                <Text className="text-white text-xl font-black mb-2">{day.day_name}</Text>

                {/* Info */}
                <View className="flex-row items-center gap-3">
                  <View className="flex-row items-center gap-1">
                    <Dumbbell size={11} color="#8A8F98" />
                    <Text className="text-forge-muted text-[11px] font-semibold">
                      {exerciseCount} exercício{exerciseCount !== 1 ? 's' : ''}
                    </Text>
                  </View>
                  {exerciseCount > 0 && (
                    <View className="flex-row items-center gap-1">
                      <Clock size={11} color="#8A8F98" />
                      <Text className="text-forge-muted text-[11px] font-semibold">{day.est_time} min</Text>
                      <Zap size={11} color="#8A8F98" />
                      <Text className="text-forge-muted text-[11px] font-semibold">{day.est_kcal} kcal</Text>
                    </View>
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
                onPress={() => router.push(`/planner/day-details?dayId=${day.id}&routineId=${routineId}` as any)}
              >
                <Text className="text-forge-accent text-[11px] font-bold tracking-tight">VER EXERCÍCIOS</Text>
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
  );
}

function StatisticsTab({ routineId }: { routineId: string }) {
  const { overview, activeFilter, setActiveFilter, chartData, loading } = usePlanStats(routineId);

  const formatDuration = (totalSeconds: number) => {
    const hrs = Math.floor(totalSeconds / 3600);
    const mins = Math.floor((totalSeconds % 3600) / 60);
    return hrs > 0 ? `${hrs}h ${mins}m` : `${mins}m`;
  };

  const avgDuration = overview.total_sessions > 0 ? Math.round(overview.total_duration_seconds / overview.total_sessions) : 0;
  const formatAvgDuration = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  const filters: PlanFilterType[] = ['VOLUME', 'REPS', 'DURATION'];

  return (
    <>
      {/* Statistics Grid */}
      <View className="flex-row flex-wrap gap-3 mb-5">
        <View className="flex-1 min-w-[45%] bg-forge-surface rounded-2xl p-4">
          <Text className="text-forge-muted text-[9px] font-bold tracking-widest mb-1">SESSÕES DE TREINO</Text>
          <Text className="text-white text-[32px] font-black">{overview.total_sessions}</Text>
        </View>
        <View className="flex-1 min-w-[45%] bg-forge-surface rounded-2xl p-4">
          <Text className="text-forge-muted text-[9px] font-bold tracking-widest mb-1">TEMPO TOTAL</Text>
          <Text className="text-white text-[32px] font-black">{formatDuration(overview.total_duration_seconds)}</Text>
        </View>
        <View className="flex-1 min-w-[45%] bg-forge-surface rounded-2xl p-4">
          <Text className="text-forge-muted text-[9px] font-bold tracking-widest mb-1">DURAÇÃO MÉDIA</Text>
          <Text className="text-white text-[32px] font-black">{formatAvgDuration(avgDuration)}</Text>
        </View>
        <View className="flex-1 min-w-[45%] bg-forge-surface rounded-2xl p-4">
          <Text className="text-forge-muted text-[9px] font-bold tracking-widest mb-1">SÉRIES CONCLUÍDAS</Text>
          <Text className="text-white text-[32px] font-black">{overview.total_sets}</Text>
        </View>
      </View>

      {/* Chart Filter */}
      <View className="flex-row gap-2 mb-5">
        {filters.map((filter) => (
          <TouchableOpacity
            key={filter}
            onPress={() => setActiveFilter(filter)}
            className={`px-4 py-2 rounded-[20px] ${activeFilter === filter ? 'bg-forge-accent-bg' : 'bg-forge-surface'}`}
          >
            <Text className={`text-[11px] font-bold tracking-tight ${activeFilter === filter ? 'text-forge-accent' : 'text-forge-muted-dark'}`}>
              {filter}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Chart Area */}
      {loading ? (
        <View className="bg-forge-surface rounded-[20px] p-6 items-center justify-center min-h-[200px]">
          <Text className="text-forge-muted text-sm font-bold">Carregando...</Text>
        </View>
      ) : chartData.length === 0 ? (
        <View className="bg-forge-surface rounded-[20px] p-6 items-center justify-center min-h-[200px]">
          <View className="w-12 h-12 rounded-full bg-forge-border/50 justify-center items-center mb-3">
            <BarChart3 size={20} color="#8A8F98" />
          </View>
          <Text className="text-white text-sm font-bold mb-1">Nenhum dado disponível ainda</Text>
          <Text className="text-forge-muted text-[11px] text-center">
            Inicie um treino para ver seu progresso
          </Text>
        </View>
      ) : (
        <View className="bg-forge-surface rounded-[20px] p-5 items-center">
           <BarChart
             data={chartData}
             width={SCREEN_WIDTH - 80}
             height={160}
             barColor="#A0C4FF"
             barBackgroundColor="#2A2D35"
             showGridLines={true}
             customBarWidth={chartData.length <= 5 ? 24 : undefined}
           />
        </View>
      )}
    </>
  );
}
