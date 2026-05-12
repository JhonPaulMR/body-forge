import React from 'react';
import { View, Text } from 'react-native';
import { Scale } from 'lucide-react-native';

interface CurrentWeightProps {
  latestWeight: number | null;
  weightDiff: number | null;
}

export function CurrentWeight({ latestWeight, weightDiff }: CurrentWeightProps) {
  return (
    <View className="bg-forge-surface rounded-[20px] p-5 mb-4">
      <View className="flex-row justify-between items-center mb-2">
        <Text className="text-forge-muted text-[11px] font-bold tracking-wide">PESO ATUAL</Text>
        <Scale size={18} color="#A0C4FF" />
      </View>
      {latestWeight ? (
        <>
          <View className="flex-row items-baseline">
            <Text className="text-forge-green text-[36px] font-black">{latestWeight.toFixed(1)}</Text>
            <Text className="text-forge-muted text-sm font-semibold"> kg</Text>
          </View>
          {weightDiff !== null && (
            <Text
              className="text-[11px] font-bold mt-1.5"
              style={{ color: weightDiff <= 0 ? '#4ADE80' : '#FFA07A' }}
            >
              {weightDiff > 0 ? '+' : ''}{weightDiff.toFixed(1)} kg desde a última medição
            </Text>
          )}
        </>
      ) : (
        <Text className="text-forge-muted-dark text-[13px] mt-2">Nenhuma medição registrada</Text>
      )}
    </View>
  );
}
