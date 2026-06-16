import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { BodyMetric } from '@/hooks/useStatsData';
import { useSettingsStore } from '@/hooks/useSettingsStore';
import { getDisplayWeight } from '@/utils/units';

interface StatsHistoryProps {
  bodyMetrics: BodyMetric[];
  setShowAddMetricModal: (val: boolean) => void;
}

export function StatsHistory({ bodyMetrics, setShowAddMetricModal }: StatsHistoryProps) {
  const weightUnit = useSettingsStore(state => state.weightUnit);

  return (
    <View className="bg-forge-surface rounded-[20px] p-5 mb-4">
      <View className="flex-row justify-between items-center mb-2">
        <Text className="text-forge-muted text-[11px] font-bold tracking-wide">HISTÓRICO DE MEDIÇÕES</Text>
        <TouchableOpacity
          className="bg-forge-accent-bg px-3.5 py-2 rounded-xl"
          onPress={() => setShowAddMetricModal(true)}
        >
          <Text className="text-forge-accent text-[10px] font-extrabold tracking-tight">+ REGISTRAR</Text>
        </TouchableOpacity>
      </View>
      {bodyMetrics.slice(0, 5).map((m, i) => (
        <View
          key={m.id}
          className={`flex-row justify-between items-center py-3.5 ${i < Math.min(bodyMetrics.length, 5) - 1 ? 'border-b border-forge-border' : ''}`}
        >
          <View>
            <Text className="text-forge-text-secondary text-[13px] font-semibold mb-0.5">
              {new Date(m.date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}
            </Text>
            {m.notes && <Text className="text-forge-muted-dark text-[11px]">{m.notes}</Text>}
          </View>
          <View className="items-end">
            <Text className="text-white text-base font-extrabold">{getDisplayWeight(m.weight_kg, weightUnit).toFixed(1)} {weightUnit}</Text>
            {m.body_fat_percentage && (
              <Text className="text-forge-muted text-[11px] font-semibold mt-0.5">{m.body_fat_percentage.toFixed(1)}% BF</Text>
            )}
          </View>
        </View>
      ))}
      {bodyMetrics.length === 0 && (
        <Text className="text-forge-muted-dark text-[13px] mt-2">Nenhuma medição registrada ainda.</Text>
      )}
    </View>
  );
}
