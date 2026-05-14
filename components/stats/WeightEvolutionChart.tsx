import React from 'react';
import { View, Text, Dimensions } from 'react-native';
import { LineChart } from '@/components/ui/LineChart';

interface WeightEvolutionChartProps {
  weightChartData: { label: string; value: number }[];
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CHART_WIDTH = SCREEN_WIDTH - 80;

export function WeightEvolutionChart({ weightChartData }: WeightEvolutionChartProps) {
  if (weightChartData.length <= 1) return null;

  return (
    <View className="bg-forge-surface rounded-[20px] p-5 mb-4">
      <Text className="text-forge-muted text-[11px] font-bold tracking-wide">EVOLUÇÃO DO PESO</Text>
      <View className="items-center mt-3">
        <LineChart
          data={weightChartData}
          width={CHART_WIDTH}
          height={160}
          lineColor="#A0C4FF"
          dotColor="#A0C4FF"
        />
      </View>
    </View>
  );
}
