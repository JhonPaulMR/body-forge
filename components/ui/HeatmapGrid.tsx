import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

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
      <View style={styles.grid}>
        {Array.from({ length: rows }).map((_, row) => (
          <View key={row} style={styles.row}>
            {Array.from({ length: columns }).map((_, col) => {
              const index = row * columns + col;
              const value = index < data.length ? data[index] : -1;
              if (value < 0) return <View key={col} style={{ width: cellSize, height: cellSize, margin: cellGap / 2 }} />;
              return (
                <View
                  key={col}
                  style={[
                    styles.cell,
                    {
                      width: cellSize,
                      height: cellSize,
                      margin: cellGap / 2,
                      backgroundColor: getColor(value),
                      borderRadius: 4,
                    },
                  ]}
                />
              );
            })}
          </View>
        ))}
      </View>
      <View style={styles.footer}>
        {frequencyLabel && (
          <Text style={styles.frequencyText}>{frequencyLabel}</Text>
        )}
        <View style={styles.legend}>
          <Text style={styles.legendLabel}>MENOS</Text>
          {INTENSITY_COLORS.map((color, i) => (
            <View
              key={i}
              style={[styles.legendCell, { backgroundColor: color }]}
            />
          ))}
          <Text style={styles.legendLabel}>MAIS</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    alignItems: 'center',
  },
  row: {
    flexDirection: 'row',
  },
  cell: {},
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
  },
  frequencyText: {
    color: '#A0C4FF',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  legend: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  legendLabel: {
    color: '#5F6368',
    fontSize: 8,
    fontWeight: '600',
    letterSpacing: 0.5,
    marginHorizontal: 4,
  },
  legendCell: {
    width: 12,
    height: 12,
    borderRadius: 2,
  },
});
