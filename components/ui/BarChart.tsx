import React from 'react';
import { View } from 'react-native';
import Svg, { Rect, Text as SvgText } from 'react-native-svg';

interface BarDataPoint {
  label: string;
  value: number;
  color?: string;
}

interface BarChartProps {
  data: BarDataPoint[];
  width?: number;
  height?: number;
  barColor?: string;
  barBackgroundColor?: string;
  showLabels?: boolean;
}

export function BarChart({
  data,
  width = 300,
  height = 140,
  barColor = '#FFA07A',
  barBackgroundColor = '#353945',
  showLabels = true,
}: BarChartProps) {
  if (data.length === 0) return null;

  const paddingLeft = 8;
  const paddingRight = 8;
  const paddingTop = 8;
  const paddingBottom = showLabels ? 24 : 8;

  const chartWidth = width - paddingLeft - paddingRight;
  const chartHeight = height - paddingTop - paddingBottom;

  const maxVal = Math.max(...data.map((d) => d.value));
  const barGap = 6;
  const barWidth = (chartWidth - (data.length - 1) * barGap) / data.length;

  return (
    <View style={{ width, height }}>
      <Svg width={width} height={height}>
        {data.map((point, i) => {
          const x = paddingLeft + i * (barWidth + barGap);
          const barHeight = maxVal > 0 ? (point.value / maxVal) * chartHeight : 0;
          const y = paddingTop + chartHeight - barHeight;
          const color = point.color || barColor;

          return (
            <React.Fragment key={i}>
              <Rect
                x={x}
                y={paddingTop}
                width={barWidth}
                height={chartHeight}
                rx={4}
                fill={barBackgroundColor}
              />
              {barHeight > 0 && (
                <Rect
                  x={x}
                  y={y}
                  width={barWidth}
                  height={barHeight}
                  rx={4}
                  fill={color}
                />
              )}
              {showLabels && (
                <SvgText
                  x={x + barWidth / 2}
                  y={height - 4}
                  fill="#5F6368"
                  fontSize={10}
                  textAnchor="middle"
                >
                  {point.label}
                </SvgText>
              )}
            </React.Fragment>
          );
        })}
      </Svg>
    </View>
  );
}
