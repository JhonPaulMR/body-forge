import React, { useState, useCallback } from 'react';
import { View, Text, ScrollView, Image, TouchableOpacity } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import { Menu, ChevronRight, Dumbbell, Zap, Plus } from 'lucide-react-native';
import { db } from '@/database/schema';

interface UserRoutine {
  id: string;
  name: string;
  description: string | null;
  day_count: number;
  exercise_count: number;
}

const featuredPlan = {
  title: 'Hipertrofia Elite',
  duration: '12 Semanas',
  frequency: '5 Dias/Semana',
  image: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=1000',
};

const basePlans = [
  {
    id: 'plan_ppl',
    name: 'PPL (Push/Pull/Legs)',
    focus: 'VOLUME MODERADO',
    duration: '8 Semanas',
    frequency: '6 Dias/Semana',
    muscles: [
      { name: 'PEITO/OMBRO', pct: 40, color: '#A0C4FF' },
      { name: 'COSTAS', pct: 35, color: '#4ADE80' },
      { name: 'PERNAS', pct: 25, color: '#FFA07A' },
    ],
  },
  {
    id: 'plan_sl',
    name: 'Stronglifts 5×5',
    focus: 'FOCO EM FORÇA',
    duration: 'Contínuo',
    frequency: '3 Dias/Semana',
    muscles: [
      { name: 'INFERIOR', pct: 60, color: '#A0C4FF' },
      { name: 'EMPURRAR', pct: 25, color: '#4ADE80' },
      { name: 'PUXAR', pct: 15, color: '#FFA07A' },
    ],
  },
];

export default function PlanosScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [userRoutines, setUserRoutines] = useState<UserRoutine[]>([]);

  useFocusEffect(
    useCallback(() => {
      loadUserRoutines();
    }, [])
  );

  const loadUserRoutines = () => {
    try {
      const result = db.getAllSync<UserRoutine>(
        `SELECT r.id, r.name, r.description,
                (SELECT COUNT(*) FROM routine_days WHERE routine_id = r.id) as day_count,
                (SELECT COUNT(*) FROM routine_exercises re
                 JOIN routine_days rd ON re.routine_day_id = rd.id
                 WHERE rd.routine_id = r.id) as exercise_count
         FROM routines r
         WHERE r.user_id = 'user_1' AND r.is_builtin = 0
         ORDER BY r.id DESC`
      );
      setUserRoutines(result);
    } catch (error) {
      console.error('Error loading routines:', error);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-forge-bg" edges={['top']}>
      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 10, paddingBottom: 120 }} showsVerticalScrollIndicator={false}>

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

        <Text className="text-forge-accent text-[11px] font-bold tracking-widest mb-1">EXPLORAR PROGRAMAS</Text>
        <Text className="text-white text-[32px] font-black mb-6">Planos</Text>

        <Text className="text-forge-muted text-[11px] font-bold tracking-wide mb-3">EM DESTAQUE</Text>
        <View className="h-[180px] rounded-[20px] overflow-hidden mb-6 bg-forge-surface-hover">
          <Image
            source={{ uri: featuredPlan.image }}
            className="w-full h-full absolute opacity-35"
          />
          <View className="flex-1 p-5 justify-end flex-row items-end">
            <View className="flex-1">
              <Text className="text-white text-[26px] font-black mb-1.5">{featuredPlan.title}</Text>
              <Text className="text-forge-text-secondary text-xs font-semibold">
                {featuredPlan.duration} • {featuredPlan.frequency}
              </Text>
            </View>
            <TouchableOpacity className="bg-forge-accent px-5 py-2.5 rounded-3xl">
              <Text className="text-forge-bg text-xs font-extrabold tracking-tight">COMEÇAR</Text>
            </TouchableOpacity>
          </View>
        </View>

        <Text className="text-forge-muted text-[11px] font-bold tracking-wide mb-3">PROGRAMAS BASE</Text>
        {basePlans.map((plan) => (
          <TouchableOpacity key={plan.id} className="bg-forge-surface rounded-2xl p-4 mb-3" activeOpacity={0.7}>
            <View className="flex-row items-start mb-3">
              <View className="flex-1">
                <Text className="text-white text-base font-extrabold mb-1">{plan.name}</Text>
                <Text className="text-forge-muted text-[10px] font-bold tracking-wide">{plan.focus}</Text>
              </View>
              <Zap size={20} color="#A0C4FF" />
            </View>

            <View className="flex-row gap-3 mb-2">
              {plan.muscles.map((m, i) => (
                <View key={i} className="flex-row items-center gap-1">
                  <View className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: m.color }} />
                  <Text className="text-forge-text-secondary text-[9px] font-bold tracking-tight">{m.name}</Text>
                  <Text className="text-forge-muted text-[9px] font-semibold">{m.pct}%</Text>
                </View>
              ))}
            </View>
            <View className="flex-row h-1.5 rounded overflow-hidden mb-3 gap-0.5">
              {plan.muscles.map((m, i) => (
                <View
                  key={i}
                  style={{
                    flex: m.pct,
                    backgroundColor: m.color,
                    height: 6,
                    ...(i === 0 && { borderTopLeftRadius: 4, borderBottomLeftRadius: 4 }),
                    ...(i === plan.muscles.length - 1 && { borderTopRightRadius: 4, borderBottomRightRadius: 4 }),
                  }}
                />
              ))}
            </View>

            <View className="flex-row justify-between">
              <Text className="text-forge-muted text-[11px] font-semibold">{plan.duration}</Text>
              <Text className="text-forge-muted text-[11px] font-semibold">📅 {plan.frequency}</Text>
            </View>
          </TouchableOpacity>
        ))}

        {/* User Plans - from DB */}
        <View className="flex-row justify-between items-center mt-2">
          <Text className="text-forge-muted text-[11px] font-bold tracking-wide mb-3">MEUS PLANOS</Text>
          {userRoutines.length > 0 && (
            <TouchableOpacity>
              <Text className="text-forge-accent text-xs font-semibold mb-3">Ver todos</Text>
            </TouchableOpacity>
          )}
        </View>

        {userRoutines.length > 0 ? (
          userRoutines.map((routine) => (
            <TouchableOpacity
              key={routine.id}
              className="flex-row items-center bg-forge-surface rounded-2xl p-4 mb-2.5 gap-3"
              activeOpacity={0.7}
              onPress={() => router.push(`/planner/details?routineId=${routine.id}` as any)}
            >
              <View className="w-10 h-10 rounded-xl bg-forge-accent-bg justify-center items-center">
                <Dumbbell size={18} color="#A0C4FF" />
              </View>
              <View className="flex-1">
                <Text className="text-white text-sm font-bold mb-0.5">{routine.name}</Text>
                <Text className="text-forge-muted text-[10px] font-medium">
                  {routine.day_count} dia{routine.day_count !== 1 ? 's' : ''} • {routine.exercise_count} exercício{routine.exercise_count !== 1 ? 's' : ''}
                </Text>
              </View>
              <ChevronRight size={18} color="#5F6368" />
            </TouchableOpacity>
          ))
        ) : (
          <View className="items-center py-8 bg-forge-surface rounded-2xl mb-3">
            <View className="w-14 h-14 rounded-2xl bg-forge-bg border border-dashed border-forge-border-light justify-center items-center mb-3">
              <Dumbbell size={22} color="#5F6368" />
            </View>
            <Text className="text-forge-muted text-[13px] font-semibold mb-1">Nenhum plano criado</Text>
            <Text className="text-forge-muted-dark text-[11px]">Toque em + para criar seu primeiro plano</Text>
          </View>
        )}

        <Text className="text-forge-muted text-[11px] font-bold tracking-wide mb-3 mt-2">EXERCÍCIOS</Text>
        <TouchableOpacity
          className="flex-row items-center justify-center bg-forge-surface rounded-2xl p-[18px] gap-3 border border-forge-border"
          activeOpacity={0.7}
          onPress={() => router.push('/exercises' as any)}
        >
          <Dumbbell size={20} color="#A0C4FF" />
          <Text className="text-white text-sm font-bold tracking-wide">VER TODOS OS EXERCÍCIOS</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Build Plan Button */}
      <TouchableOpacity
        className="absolute right-5 flex-row items-center bg-forge-accent rounded-full px-5 py-3.5 gap-2"
        style={{ elevation: 8, shadowColor: '#A0C4FF', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, bottom: Math.max(90, insets.bottom + 75) }}
        activeOpacity={0.8}
        onPress={() => router.push('/planner' as any)}
      >
        <Plus size={20} color="#1A1D24" />
        <Text className="text-forge-bg text-sm font-extrabold tracking-tight">Construir Plano</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}
