import React from 'react';
import { View, Text } from 'react-native';
import { Check } from 'lucide-react-native';
import { HistoryExercise, HistorySet } from '@/database/repositories/SessionRepository';
import { toTitleCase } from '@/utils/stringUtils';
import { useSettingsStore } from '@/hooks/useSettingsStore';
import { getDisplayWeight } from '@/utils/units';

interface HistoryExerciseListProps {
  exercises: HistoryExercise[];
}

export function HistoryExerciseList({ exercises }: HistoryExerciseListProps) {
  if (!exercises || exercises.length === 0) {
    return null;
  }

  return (
    <View className="mt-6 w-full">
      {exercises.map((exercise) => (
        <View key={exercise.id} className="mb-6">
          <Text className="text-white text-base font-bold mb-4">{toTitleCase(exercise.name)}</Text>
          
          <View className="pl-1">
            {exercise.sets.map((set, setIndex) => (
              <HistorySetRow key={set.id} set={set} index={setIndex} />
            ))}
          </View>
        </View>
      ))}
    </View>
  );
}

function HistorySetRow({ set, index }: { set: HistorySet; index: number }) {
  const isCompleted = set.is_completed;
  const weightUnit = useSettingsStore(state => state.weightUnit);

  return (
    <View className="flex-row items-center justify-between mb-4">
      <View className="flex-row items-center">
        {/* Set number */}
        <View className={`w-8 h-8 rounded-full border items-center justify-center mr-4 
          ${isCompleted ? 'border-forge-green' : 'border-forge-border'}`}>
          <Text className={`text-sm font-medium ${isCompleted ? 'text-forge-green' : 'text-forge-muted'}`}>
            {index + 1}
          </Text>
        </View>

        {/* Weight & Reps */}
        <View>
          <Text className="text-white text-base font-medium">
            {getDisplayWeight(set.weight, weightUnit)} {weightUnit} <Text className="text-forge-muted mx-1">×</Text> {set.reps}
          </Text>
          {set.is_dropset && (
            <Text className="text-forge-muted text-[10px] font-bold uppercase tracking-widest mt-0.5">Drop set</Text>
          )}
          {set.is_warmup && (
            <Text className="text-forge-orange text-[10px] font-bold uppercase tracking-widest mt-0.5">Aquecimento</Text>
          )}
          {set.is_to_failure && (
            <Text className="text-forge-orange text-[10px] font-bold uppercase tracking-widest mt-0.5">Até a falha</Text>
          )}
        </View>
      </View>

      {/* Status */}
      <View className="flex-row items-center gap-1.5">
        {isCompleted ? (
          <>
            <Text className="text-forge-green text-sm font-semibold">Concluído</Text>
            <Check size={16} color="#10B981" />
          </>
        ) : (
          <Text className="text-forge-border text-sm font-semibold">Incompleto</Text>
        )}
      </View>
    </View>
  );
}
