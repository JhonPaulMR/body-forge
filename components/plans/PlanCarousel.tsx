import React from 'react';
import { View, Text, ScrollView } from 'react-native';
import { UserRoutine } from '@/hooks/usePlansData';
import { PlanCard } from './PlanCard';

interface PlanCarouselProps {
  title: string;
  routines: UserRoutine[];
}

export function PlanCarousel({ title, routines }: PlanCarouselProps) {
  if (!routines || routines.length === 0) return null;

  return (
    <View className="mb-8">
      <Text className="text-forge-muted text-[11px] font-bold tracking-widest uppercase mb-4">
        {title}
      </Text>
      
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingRight: 20 }}
      >
        {routines.map(routine => (
          <PlanCard key={routine.id} plan={routine} />
        ))}
      </ScrollView>
    </View>
  );
}
