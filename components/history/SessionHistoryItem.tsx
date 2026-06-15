import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Clock, Dumbbell, Check } from 'lucide-react-native';
import { HistorySession } from '@/database/repositories/SessionRepository';

interface SessionHistoryItemProps {
  session: HistorySession;
  onPress: () => void;
  index: number;
}

export function SessionHistoryItem({ session, onPress, index }: SessionHistoryItemProps) {
  const dateObj = new Date(session.start_time);
  const weekdays = ['DOMINGO', 'SEGUNDA', 'TERÇA', 'QUARTA', 'QUINTA', 'SEXTA', 'SÁBADO'];
  const months = ['JAN', 'FEV', 'MAR', 'ABR', 'MAI', 'JUN', 'JUL', 'AGO', 'SET', 'OUT', 'NOV', 'DEZ'];
  
  const dateStr = `${weekdays[dateObj.getDay()]}, ${dateObj.getDate()} ${months[dateObj.getMonth()]}`;

  const durationMins = Math.ceil(session.duration_seconds / 60);
  const durationStr = durationMins > 60 
    ? `${Math.floor(durationMins / 60)}h ${durationMins % 60}m` 
    : `${durationMins}m`;

  const isFirst = index === 0;

  return (
    <View className="flex-row mb-4 items-center pl-2">
      <View className="w-6 items-center justify-center mr-3">
        {isFirst ? (
          <View className="w-3.5 h-3.5 rounded-full bg-[#A0C4FF]" />
        ) : (
          <View className="w-3.5 h-3.5 rounded-full border-2 border-forge-green" />
        )}
      </View>

      <TouchableOpacity 
        className="flex-1 bg-forge-surface rounded-2xl p-4 border border-forge-border"
        onPress={onPress}
      >
        <View className="flex-row justify-between items-center mb-1">
          <Text className={`text-[10px] font-bold tracking-widest ${isFirst ? 'text-[#A0C4FF]' : 'text-forge-green'}`}>
            {dateStr}
          </Text>
          <View className="flex-row items-center gap-1">
            <Clock size={12} color="#9CA3AF" />
            <Text className="text-forge-muted text-xs font-medium">{durationStr}</Text>
          </View>
        </View>

        <Text className="text-white text-lg font-bold mb-3">{session.name}</Text>

        <View className="flex-row items-center gap-4">
          <View className="flex-row items-center gap-1.5">
            <Dumbbell size={14} color="#9CA3AF" />
            <Text className="text-forge-muted text-xs font-medium">
              {session.total_volume_kg.toLocaleString('pt-BR')} kg
            </Text>
          </View>

          <View className="flex-row items-center gap-1.5">
            <Check size={14} color="#9CA3AF" />
            <Text className="text-forge-muted text-xs font-medium">
              {session.total_sets} Sets
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    </View>
  );
}
