import React from 'react';
import { View, Text, TouchableOpacity, Image } from 'react-native';
import { ChevronRight, Clock, Zap } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { Routine } from '@/hooks/useHomeData';

interface ActivePlansProps {
  routines: Routine[];
}

export function ActivePlans({ routines }: ActivePlansProps) {
  const router = useRouter();

  if (routines.length === 0) return null;

  return (
    <>
      <Text className="text-forge-muted text-[11px] font-bold tracking-wide mb-4">MEUS PLANOS DE TREINO</Text>
      {routines.map(r => (
        <TouchableOpacity 
          key={r.id} 
          className="h-[120px] rounded-2xl overflow-hidden mb-4 bg-forge-surface-hover active:opacity-80"
          onPress={() => router.push(`/planner/details?routineId=${r.id}` as any)}
        >
           <Image
             source={{ uri: r.cover_image_uri || 'https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?q=80&w=1000' }}
             className="w-full h-full absolute opacity-40"
           />
           <View className="flex-1 p-4 flex-row justify-between items-end" style={{ backgroundColor: 'rgba(26,28,35,0.5)' }}>
             <View>
               <Text className="text-forge-accent text-[10px] font-bold tracking-wide mb-1 uppercase">{r.subtitle}</Text>
               <Text className="text-white text-xl font-black mb-1">{r.name}</Text>
               <View className="flex-row items-center gap-1">
                 <Clock size={11} color="#B0B5BD" />
                 <Text className="text-forge-text-secondary text-[11px]">~{Math.floor(r.est_time)} min</Text>
                 <Zap size={11} color="#B0B5BD" />
                 <Text className="text-forge-text-secondary text-[11px]">~{Math.floor(r.est_kcal)} kcal</Text>
               </View>
             </View>
             <View className="w-10 h-10 rounded-xl bg-forge-accent justify-center items-center">
               <ChevronRight size={20} color="#1A1C23" />
             </View>
           </View>
        </TouchableOpacity>
      ))}
    </>
  );
}
