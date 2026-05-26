import React from 'react';
import { Text } from 'react-native';
import { useWorkoutStore } from '@/hooks/useWorkoutStore';

const formatTime = (seconds: number) => {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
};

export function WorkoutTimer({ className }: { className?: string }) {
  const elapsedSeconds = useWorkoutStore(state => state.elapsedSeconds);
  
  return (
    <Text className={className || "text-white font-black text-xl"}>
      {formatTime(elapsedSeconds)}
    </Text>
  );
}
