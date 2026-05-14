import React from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Menu, Dumbbell, Plus } from 'lucide-react-native';

import { usePlansData } from '@/hooks/usePlansData';
import { FeaturedPlanCard } from '@/components/plans/FeaturedPlanCard';
import { BasePlanCard } from '@/components/plans/BasePlanCard';
import { UserPlansList } from '@/components/plans/UserPlansList';

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
  const { userRoutines } = usePlansData();

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

        <FeaturedPlanCard {...featuredPlan} />

        <Text className="text-forge-muted text-[11px] font-bold tracking-wide mb-3">PROGRAMAS BASE</Text>
        {basePlans.map((plan) => (
          <BasePlanCard key={plan.id} plan={plan} />
        ))}

        <UserPlansList userRoutines={userRoutines} />

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
