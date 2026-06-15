import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Check, Zap } from 'lucide-react-native';
import { SessionRepository } from '@/database/repositories/SessionRepository';

export default function WorkoutCompleteScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [streak, setStreak] = useState(0);

  useEffect(() => {
    const currentStreak = SessionRepository.getCurrentStreak();
    setStreak(currentStreak);
  }, []);

  return (
    <SafeAreaView className="flex-1 bg-forge-bg justify-center items-center p-6">
      <View className="items-center mb-10">
        <View className="w-24 h-24 bg-forge-accent/20 rounded-full items-center justify-center mb-6 border border-forge-accent/50">
          <Check size={48} color="#A0C4FF" />
        </View>
        
        <Text className="text-white text-3xl font-black mb-2 text-center">TREINO CONCLUÍDO!</Text>
        <Text className="text-forge-muted text-center text-sm">
          Excelente trabalho! Você está um passo mais perto dos seus objetivos.
        </Text>
      </View>

      <View className="w-full gap-4">
        <View className="bg-forge-surface p-4 rounded-xl border border-forge-border flex-row items-center justify-between">
          <View className="flex-row items-center gap-3">
            <Zap size={20} color="#FBBF24" />
            <Text className="text-white font-bold">Sequência Atual</Text>
          </View>
          <Text className="text-[#FBBF24] font-black text-xl">
            {streak} {streak === 1 ? 'Dia' : 'Dias'}
          </Text>
        </View>
      </View>

      <View className="absolute left-6 right-6" style={{ bottom: Math.max(insets.bottom + 10, 24) }}>
        <TouchableOpacity 
          onPress={() => router.replace({ pathname: '/(tabs)/treino', params: { dayId: '' } })}
          className="w-full bg-[#A0C4FF] py-4 rounded-xl items-center shadow-sm"
        >
          <Text className="text-forge-bg font-black tracking-wide text-sm">VOLTAR AO INÍCIO</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
