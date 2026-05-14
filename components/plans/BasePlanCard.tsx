import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Zap, Clock } from 'lucide-react-native';

interface BasePlanMuscle {
  name: string;
  pct: number;
  color: string;
}

interface BasePlanData {
  id: string;
  name: string;
  focus: string;
  duration: string;
  frequency: string;
  muscles: BasePlanMuscle[];
}

interface BasePlanCardProps {
  plan: BasePlanData;
}

export function BasePlanCard({ plan }: BasePlanCardProps) {
  return (
    <TouchableOpacity className="bg-forge-surface rounded-2xl p-4 mb-3" activeOpacity={0.7}>
      <View className="flex-row items-start mb-3">
        <View className="flex-1">
          <Text className="text-white text-base font-extrabold mb-1">{plan.name}</Text>
          <Text className="text-forge-muted text-[10px] font-bold tracking-wide">{plan.focus}</Text>
        </View>
        <Zap size={20} color="#A0C4FF" />
      </View>

      <View className="flex-row gap-3 mb-2">
        {plan.muscles.map((m, i) => (
          <View key={i} className="flex-row items-center gap-1">
            <View className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: m.color }} />
            <Text className="text-forge-text-secondary text-[9px] font-bold tracking-tight">{m.name}</Text>
            <Text className="text-forge-muted text-[9px] font-semibold">{m.pct}%</Text>
          </View>
        ))}
      </View>
      <View className="flex-row h-1.5 rounded overflow-hidden mb-3 gap-0.5">
        {plan.muscles.map((m, i) => (
          <View
            key={i}
            style={{
              flex: m.pct,
              backgroundColor: m.color,
              height: 6,
              ...(i === 0 && { borderTopLeftRadius: 4, borderBottomLeftRadius: 4 }),
              ...(i === plan.muscles.length - 1 && { borderTopRightRadius: 4, borderBottomRightRadius: 4 }),
            }}
          />
        ))}
      </View>

      <View className="flex-row justify-between">
        <Text className="text-forge-muted text-[11px] font-semibold">{plan.duration}</Text>
        <View className="flex-row items-center gap-1">
          <Clock size={12} color="#8A8F98" />
          <Text className="text-forge-muted text-[11px] font-semibold">{plan.frequency}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}
