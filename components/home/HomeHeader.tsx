import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Menu } from 'lucide-react-native';

interface HomeHeaderProps {
  currentMonthStr: string;
  completedDays: number;
  weekDays: Date[];
}

export function HomeHeader({ currentMonthStr, completedDays, weekDays }: HomeHeaderProps) {
  const todayStr = new Date().toISOString().split('T')[0];

  return (
    <View>
      <View className="flex-row items-center justify-between mb-7">
        <TouchableOpacity>
          <Menu size={24} color="#FFF" />
        </TouchableOpacity>
        <Text className="text-white text-lg font-black tracking-wide">BODY FORGE</Text>
        <View className="w-9 h-9 rounded-full bg-forge-border justify-center items-center">
           <View className="w-8 h-8 bg-forge-avatar rounded-2xl overflow-hidden">
             <View className="flex-1 bg-forge-skin mt-2 mx-1.5 rounded-t-[10px]" />
           </View>
        </View>
      </View>

      <View className="mb-6">
        <Text className="text-forge-text-tertiary text-[13px] font-semibold tracking-wide">{currentMonthStr}</Text>
        <View className="flex-row items-center justify-between mt-1.5 mb-4">
          <Text className="text-forge-orange text-[11px] font-bold tracking-tight">{completedDays}/7 DIAS CONCLUÍDOS</Text>
          <View className="w-[60px] h-1 bg-forge-border rounded-sm">
            <View className="h-1 bg-forge-green rounded-sm" style={{ width: `${(completedDays/7)*100}%` }} />
          </View>
        </View>

        <View className="flex-row justify-between">
          {weekDays.map((date, i) => {
            const dStr = date.toISOString().split('T')[0];
            const isToday = dStr === todayStr;
            const dayNames = ['DOM', 'SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SÁB'];
            
            return (
              <View key={i} className={`py-2.5 px-3 rounded-lg items-center ${isToday ? 'bg-forge-accent' : 'bg-forge-surface'}`}>
                <Text className={`text-[11px] mb-1 font-semibold ${isToday ? 'text-forge-bg' : 'text-forge-muted'}`}>
                  {dayNames[date.getDay()]}
                </Text>
                <Text className={`text-base font-bold ${isToday ? 'text-forge-bg' : 'text-forge-text-secondary'}`}>
                  {date.getDate()}
                </Text>
              </View>
            );
          })}
        </View>
      </View>
    </View>
  );
}
