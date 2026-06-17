import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { ArrowLeft } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { WorkoutTimer } from './WorkoutTimer';

interface ActiveWorkoutHeaderProps {
  onFinish: () => void;
}

export function ActiveWorkoutHeader({ onFinish }: ActiveWorkoutHeaderProps) {
  const router = useRouter();

  return (
    <View className="flex-row items-center justify-between px-4 py-4 border-b border-forge-border">
      <TouchableOpacity onPress={() => router.back()} className="p-2 -ml-2">
        <ArrowLeft size={24} color="#8A8F98" />
      </TouchableOpacity>
      <WorkoutTimer className="text-white font-black text-xl" />
      <TouchableOpacity onPress={onFinish}>
        <Text className="text-white font-bold text-xs uppercase tracking-widest">FINALIZAR</Text>
      </TouchableOpacity>
    </View>
  );
}
