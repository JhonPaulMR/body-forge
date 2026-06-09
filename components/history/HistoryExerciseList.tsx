import React from 'react';
import { View, Text } from 'react-native';
import { CheckCircle2 } from 'lucide-react-native';
import { HistoryExercise, HistorySet } from '@/services/historyService';

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
          <Text className="text-white text-base font-bold mb-4">{exercise.name}</Text>
          
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
            {set.weight} kg <Text className="text-forge-muted mx-1">×</Text> {set.reps}
          </Text>
          {set.is_dropset && (
            <Text className="text-forge-muted text-[10px] font-bold uppercase tracking-widest mt-0.5">Drop set</Text>
          )}
          {set.is_warmup && (
            <Text className="text-forge-orange text-[10px] font-bold uppercase tracking-widest mt-0.5">Warm up</Text>
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
            <CheckCircle2 size={16} color="#10B981" />
          </>
        ) : (
          <Text className="text-forge-border text-sm font-semibold">Incompleto</Text>
        )}
      </View>
    </View>
  );
}
