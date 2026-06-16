import React from 'react';
import { View, Text } from 'react-native';
import { Scale } from 'lucide-react-native';
import { useSettingsStore } from '@/hooks/useSettingsStore';
import { getDisplayWeight } from '@/utils/units';

interface CurrentWeightProps {
  latestWeight: number | null;
  weightDiff: number | null;
}

export function CurrentWeight({ latestWeight, weightDiff }: CurrentWeightProps) {
  const weightUnit = useSettingsStore(state => state.weightUnit);
  const displayLatest = latestWeight ? getDisplayWeight(latestWeight, weightUnit) : null;
  const displayDiff = weightDiff !== null ? getDisplayWeight(weightDiff, weightUnit) : null;

  return (
    <View className="bg-forge-surface rounded-[20px] p-5 mb-4">
      <View className="flex-row justify-between items-center mb-2">
        <Text className="text-forge-muted text-[11px] font-bold tracking-wide">PESO ATUAL</Text>
        <Scale size={18} color="#A0C4FF" />
      </View>
      {displayLatest !== null ? (
        <>
          <View className="flex-row items-baseline">
            <Text className="text-forge-green text-[36px] font-black">{displayLatest.toFixed(1)}</Text>
            <Text className="text-forge-muted text-sm font-semibold"> {weightUnit}</Text>
          </View>
          {displayDiff !== null && (
            <Text
              className="text-[11px] font-bold mt-1.5"
              style={{ color: displayDiff <= 0 ? '#4ADE80' : '#FFA07A' }}
            >
              {displayDiff > 0 ? '+' : ''}{displayDiff.toFixed(1)} {weightUnit} desde a última medição
            </Text>
          )}
        </>
      ) : (
        <Text className="text-forge-muted-dark text-[13px] mt-2">Nenhuma medição registrada</Text>
      )}
    </View>
  );
}
