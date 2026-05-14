import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { ChevronRight, Dumbbell } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { UserRoutine } from '@/hooks/usePlansData';

interface UserPlansListProps {
  userRoutines: UserRoutine[];
}

export function UserPlansList({ userRoutines }: UserPlansListProps) {
  const router = useRouter();

  return (
    <>
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
    </>
  );
}
