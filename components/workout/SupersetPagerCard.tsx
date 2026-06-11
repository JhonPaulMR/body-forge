import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, TextInput } from 'react-native';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { Check, Plus, MoreVertical, Clock, Minus } from 'lucide-react-native';
import { useWorkoutStore, WorkoutExercise, WorkoutSet } from '@/hooks/useWorkoutStore';
import { muscleImages } from '@/constants/muscleImages';
import { WorkoutSetRow } from './WorkoutSetRow';
import { toTitleCase } from '@/utils/stringUtils';

interface SupersetPagerCardProps {
  block: WorkoutExercise[];
  onOpenHistory: (ex: WorkoutExercise) => void;
  onOpenNotes: (ex: WorkoutExercise) => void;
  onOpenRest: (ex: WorkoutExercise) => void;
}

const getSetGroups = (sets: WorkoutSet[]) => {
  const groups: WorkoutSet[][] = [];
  sets.forEach((s, index) => {
    if (index === 0) {
      groups.push([s]);
      return;
    }

    const prev = sets[index - 1];
    
    if (s.is_dropset) {
      if (prev.is_dropset) {
        if (s.dropset_group_id && prev.dropset_group_id && s.dropset_group_id === prev.dropset_group_id) {
          groups[groups.length - 1].push(s);
        } else {
          groups.push([s]);
        }
      } else {
        groups[groups.length - 1].push(s);
      }
    } else {
      groups.push([s]);
    }
  });
  return groups;
};

const SupersetPagerCardComponent = ({ block, onOpenHistory, onOpenNotes, onOpenRest }: SupersetPagerCardProps) => {
  const router = useRouter();
  
  const [menuVisibleId, setMenuVisibleId] = useState<string | null>(null);

  const handleComplete = (ex: WorkoutExercise, setId: string) => {
    const store = useWorkoutStore.getState();
    store.completeSet(ex.id, setId);
    store.startRestTimer(ex.rest_time_seconds);
  };

  // Encontrar o número máximo de "grupos" (séries normais) neste bloco
  const maxGroups = Math.max(...block.map(ex => getSetGroups(ex.sets).length));
  const isSingle = block.length === 1;

  const renderExerciseHeader = (exercise: WorkoutExercise, showButtons: boolean) => {
    const exerciseImage = exercise.image_uri || muscleImages[exercise.muscle_group as keyof typeof muscleImages] || muscleImages['Peito'];
    return (
      <View className="mb-4">
        <View className="flex-row gap-4 items-center mb-4 mt-2">
          <TouchableOpacity 
            onPress={() => router.push(`/exercises/${exercise.exercise_id}`)}
            className="border border-forge-border rounded-xl overflow-hidden bg-forge-surface-hover"
          >
            {exerciseImage ? (
              <Image source={{ uri: exerciseImage }} style={{ width: 64, height: 64 }} contentFit="cover" cachePolicy="disk" />
            ) : (
              <View className="w-16 h-16 items-center justify-center">
                <Text className="text-forge-muted font-bold text-xl">{exercise.name.charAt(0)}</Text>
              </View>
            )}
          </TouchableOpacity>
          
          <View className="flex-1 justify-center">
            <Text className="text-white text-lg font-bold leading-tight mb-2 pr-2">
              {toTitleCase(exercise.name)}
            </Text>
            <TouchableOpacity onPress={() => onOpenRest(exercise)} className="flex-row items-center gap-1.5 self-start px-2 py-1 bg-forge-surface rounded-md">
              <Clock size={12} color="#10B981" />
              <Text className="text-[#10B981] font-medium text-[10px] uppercase tracking-wider">Descanso: {exercise.rest_time_seconds}s</Text>
            </TouchableOpacity>
          </View>
        </View>

        {showButtons && (
          <View className="flex-row gap-3">
            <TouchableOpacity onPress={() => onOpenHistory(exercise)} className="flex-1 bg-forge-surface border border-forge-border py-2 rounded-lg items-center">
              <Text className="text-white font-bold text-[10px] tracking-widest">HISTÓRICO</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => onOpenNotes(exercise)} className="flex-row items-center justify-center gap-2 flex-1 bg-forge-surface border border-forge-border py-2 rounded-lg">
              <Text className="text-white font-bold text-[10px] tracking-widest">NOTAS</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  };

  return (
    <ScrollView 
      showsVerticalScrollIndicator={false} 
      contentContainerStyle={{ paddingBottom: 150 }}
      keyboardShouldPersistTaps="handled"
    >
      {/* Se for exercício único, renderiza o cabeçalho fora do loop de séries */}
      {isSingle && block[0] && renderExerciseHeader(block[0], true)}

      {Array.from({ length: maxGroups }).map((_, groupIndex) => (
        <View key={groupIndex} className={groupIndex > 0 ? "mt-8" : ""}>
          {block.map((exercise) => {
            const groups = getSetGroups(exercise.sets);
            const group = groups[groupIndex];
            
            if (!group) return null; // Este exercício não tem tantas séries

            return (
              <View key={`${exercise.id}-${groupIndex}`} className="mb-6">
                
                {/* Se for Superset, renderiza o cabeçalho repetido antes de cada bloco */}
                {!isSingle && renderExerciseHeader(exercise, groupIndex === 0)}

                {/* Séries do Grupo (Série normal + possíveis Dropsets) */}
                <View className="gap-0">
                  {group.map((set, innerIndex) => {
                    // O índice real e sequencial na lista de sets (1, 2, 3...)
                    const globalSetIndex = exercise.sets.findIndex(s => s.id === set.id) + 1;
                    const prev = exercise.previous_sets?.[globalSetIndex - 1];
                    const prevText = prev ? `${prev.weight}kg x ${prev.reps}` : '-';
                    const isFirstInGroup = innerIndex === 0;
                    const isVisualDropset = !!(set.is_dropset && !isFirstInGroup);
                    return (
                      <WorkoutSetRow
                        key={set.id}
                        set={set}
                        exercise={exercise}
                        globalSetIndex={globalSetIndex}
                        prevText={prevText}
                        isFirstInGroup={isFirstInGroup}
                        isVisualDropset={isVisualDropset}
                        menuVisibleId={menuVisibleId}
                        setMenuVisibleId={setMenuVisibleId}
                        handleComplete={handleComplete}
                      />
                    );
                  })}
                </View>

                {/* Só mostra Add Set se for a última série (grupo) deste exercício para não quebrar a ordem visual */}
                {groupIndex === groups.length - 1 && (
                  <TouchableOpacity 
                    onPress={() => useWorkoutStore.getState().addSet(exercise.id)}
                    className="h-10 bg-forge-bg border border-forge-border rounded-xl items-center justify-center flex-row gap-2 mt-4 mx-4"
                  >
                    <Plus size={16} color="#8A8F98" />
                    <Text className="text-forge-muted font-bold text-xs uppercase tracking-widest">Adicionar série</Text>
                  </TouchableOpacity>
                )}
              </View>
            );
          })}
        </View>
      ))}
    </ScrollView>
  );
};

export const SupersetPagerCard = React.memo(SupersetPagerCardComponent, (prevProps, nextProps) => {
  if (prevProps.block.length !== nextProps.block.length) return false;
  for (let i = 0; i < prevProps.block.length; i++) {
    if (prevProps.block[i] !== nextProps.block[i]) return false;
  }
  return true;
});
