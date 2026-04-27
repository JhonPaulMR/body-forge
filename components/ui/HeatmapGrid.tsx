import React from 'react';
import { View, Text } from 'react-native';

interface HeatmapGridProps {
  /** Array de valores de 0 a 1 representando intensidade (28-42 dias) */
  data: number[];
  columns?: number;
  cellSize?: number;
  cellGap?: number;
  baseColor?: string;
  frequencyLabel?: string;
}

const INTENSITY_COLORS = [
  '#1C1E26',
  '#1A4D3A',
  '#22755A',
  '#2ECC71',
  '#4ADE80',
];

function getColor(value: number): string {
  if (value <= 0) return INTENSITY_COLORS[0];
  if (value <= 0.25) return INTENSITY_COLORS[1];
  if (value <= 0.5) return INTENSITY_COLORS[2];
  if (value <= 0.75) return INTENSITY_COLORS[3];
  return INTENSITY_COLORS[4];
}

export function HeatmapGrid({
  data,
  columns = 7,
  cellSize = 28,
  cellGap = 4,
  frequencyLabel,
}: HeatmapGridProps) {
  const rows = Math.ceil(data.length / columns);

  return (
    <View>
      <View className="items-center">
        {Array.from({ length: rows }).map((_, row) => (
          <View key={row} className="flex-row">
            {Array.from({ length: columns }).map((_, col) => {
              const index = row * columns + col;
              const value = index < data.length ? data[index] : -1;
              if (value < 0) return <View key={col} style={{ width: cellSize, height: cellSize, margin: cellGap / 2 }} />;
              return (
                <View
                  key={col}
                  style={{
                    width: cellSize,
                    height: cellSize,
                    margin: cellGap / 2,
                    backgroundColor: getColor(value),
                    borderRadius: 4,
                  }}
                />
              );
            })}
          </View>
        ))}
      </View>
      <View className="flex-row justify-between items-center mt-3">
        {frequencyLabel && (
          <Text className="text-forge-accent text-[11px] font-bold tracking-tight">{frequencyLabel}</Text>
        )}
        <View className="flex-row items-center gap-[3px]">
          <Text className="text-forge-muted-dark text-[8px] font-semibold tracking-tight mx-1">MENOS</Text>
          {INTENSITY_COLORS.map((color, i) => (
            <View
              key={i}
              className="w-3 h-3 rounded-sm"
              style={{ backgroundColor: color }}
            />
          ))}
          <Text className="text-forge-muted-dark text-[8px] font-semibold tracking-tight mx-1">MAIS</Text>
        </View>
      </View>
    </View>
  );
}
