import React from 'react';
import { View } from 'react-native';
import { AppHeader } from '@/components/AppHeader';
import { CalendarWidget } from '@/components/CalendarWidget';

interface HomeHeaderProps {
  currentMonthStr: string;
  completedDays: number;
  weekDays: Date[];
  weeklyGoal: number;
  onUpdateGoal: (goal: number) => void;
}

export function HomeHeader({ currentMonthStr, completedDays, weekDays, weeklyGoal, onUpdateGoal }: HomeHeaderProps) {
  return (
    <View>
      <View className="-mx-5 mb-3">
        <AppHeader />
      </View>

      <CalendarWidget 
        currentMonthStr={currentMonthStr} 
        completedDays={completedDays} 
        weekDays={weekDays}
        weeklyGoal={weeklyGoal}
        onUpdateGoal={onUpdateGoal}
      />
    </View>
  );
}
