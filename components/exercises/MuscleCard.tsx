import React from 'react';
import { View, Text } from 'react-native';
import Body from 'react-native-body-highlighter';
import { getMuscleById, MUSCLE_GROUPS } from '@/components/exercises/MuscleSelectionModal';
import { muscleStringMap } from '@/constants/muscleImages';
import { Activity } from 'lucide-react-native';

interface MuscleCardProps {
  muscleId: string | null;
  stringFallback: string | null;
  type: 'primary' | 'secondary';
}

export function MuscleCard({ muscleId, stringFallback, type }: MuscleCardProps) {
  let slug = '';
  let side: 'front' | 'back' = 'front';
  let name = '';
  let category = 'upper';

  if (muscleId) {
    const muscle = getMuscleById(muscleId);
    if (muscle) {
      slug = muscle.slug;
      side = muscle.side;
      name = muscle.name;
      category = MUSCLE_GROUPS.upper.some(m => m.id === muscleId) ? 'upper' : (MUSCLE_GROUPS.lower.some(m => m.id === muscleId) ? 'lower' : 'other');
    }
  } else if (stringFallback) {
    const mapped = muscleStringMap[stringFallback];
    if (mapped) {
      slug = mapped.slug;
      side = mapped.side;
      name = stringFallback;
      category = mapped.category;
    } else {
      name = stringFallback;
    }
  }

  if (!name) return null;

  let translateY = 0;
  if (category === 'upper') {
    translateY = 15;
  } else if (category === 'lower') {
    translateY = -90;
  }

  return (
    <View key={`${type}-${muscleId || name}`} className="bg-forge-surface rounded-2xl p-4 mb-3 flex-row items-center gap-4">
      <View className="w-[80px] h-[100px] rounded-xl bg-forge-bg justify-center items-center overflow-hidden border border-forge-border pt-2">
        <View style={{ transform: [{ scale: 0.45 }, { translateY }] }} pointerEvents="none">
          {slug ? (
            <Body 
              data={[{ slug: slug as any, intensity: type === 'primary' ? 1 : 2 }]} 
              side={side} 
              gender="male" 
              scale={1}
              colors={['#A0C4FF', '#4FACFE', '#5F6368']} 
              border="#5F6368"
            />
          ) : (
            <Activity size={20} color="#8A8F98" />
          )}
        </View>
      </View>
      <View className="flex-1">
        <Text className="text-white text-lg font-extrabold mb-1">{name}</Text>
        <Text className="text-forge-muted-dark text-[11px] font-semibold">
          {type === 'primary' ? 'Grupo principal' : 'Grupo auxiliar'}
        </Text>
      </View>
    </View>
  );
}
