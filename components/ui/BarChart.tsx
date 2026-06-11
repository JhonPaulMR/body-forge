import React from 'react';
import { View } from 'react-native';
import Svg, { Rect, Text as SvgText, Line } from 'react-native-svg';

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
  showGridLines?: boolean;
  customBarWidth?: number;
}

export function BarChart({
  data,
  width = 300,
  height = 140,
  barColor = '#FFA07A',
  barBackgroundColor = '#353945',
  showLabels = true,
  showGridLines = false,
  customBarWidth,
}: BarChartProps) {
  if (data.length === 0) return null;

  const paddingLeft = showGridLines ? 30 : 8;
  const paddingRight = 8;
  const paddingTop = 8;
  const paddingBottom = showLabels ? 24 : 8;

  const chartWidth = width - paddingLeft - paddingRight;
  const chartHeight = height - paddingTop - paddingBottom;

  const maxVal = Math.max(...data.map((d) => d.value), 5); // Ensure at least 5 for grid line scaling
  
  // Custom bar width or auto-calculated
  let barWidth = customBarWidth;
  let barGap = 6;

  if (!barWidth) {
    barWidth = (chartWidth - (data.length - 1) * barGap) / data.length;
  } else {
    // If custom width is provided, we center the bars across the chart width
    barGap = data.length > 1 ? (chartWidth - (data.length * barWidth)) / (data.length - 1) : 0;
  }

  // Prevent gap from being negative
  if (barGap < 0) barGap = 2;

  return (
    <View style={{ width, height }}>
      <Svg width={width} height={height}>
        {showGridLines && (
          <>
            {/* Top Line (Max) */}
            <Line x1={paddingLeft} y1={paddingTop} x2={width - paddingRight} y2={paddingTop} stroke="#353945" strokeWidth={1} />
            <SvgText x={paddingLeft - 8} y={paddingTop + 4} fill="#5F6368" fontSize={10} textAnchor="end">{Math.ceil(maxVal)}</SvgText>

            {/* Mid Line */}
            <Line x1={paddingLeft} y1={paddingTop + chartHeight / 2} x2={width - paddingRight} y2={paddingTop + chartHeight / 2} stroke="#353945" strokeWidth={1} />
            <SvgText x={paddingLeft - 8} y={paddingTop + chartHeight / 2 + 4} fill="#5F6368" fontSize={10} textAnchor="end">{Math.ceil(maxVal / 2)}</SvgText>

            {/* Bottom Line (Zero) */}
            <Line x1={paddingLeft} y1={paddingTop + chartHeight} x2={width - paddingRight} y2={paddingTop + chartHeight} stroke="#353945" strokeWidth={1} />
            <SvgText x={paddingLeft - 8} y={paddingTop + chartHeight + 4} fill="#5F6368" fontSize={10} textAnchor="end">0</SvgText>
          </>
        )}

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
