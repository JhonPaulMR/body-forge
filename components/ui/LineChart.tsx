import React from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, { Path, Circle, Line, Text as SvgText, Defs, LinearGradient, Stop } from 'react-native-svg';

interface DataPoint {
  label: string;
  value: number;
}

interface LineChartProps {
  data: DataPoint[];
  width?: number;
  height?: number;
  lineColor?: string;
  dotColor?: string;
  gridColor?: string;
  fillGradient?: boolean;
  showDots?: boolean;
  showLabels?: boolean;
  showYLabels?: boolean;
}

export function LineChart({
  data,
  width = 300,
  height = 160,
  lineColor = '#A0C4FF',
  dotColor = '#A0C4FF',
  gridColor = '#2A2D35',
  fillGradient = true,
  showDots = true,
  showLabels = true,
  showYLabels = true,
}: LineChartProps) {
  if (data.length === 0) return null;

  const paddingLeft = showYLabels ? 40 : 16;
  const paddingRight = 16;
  const paddingTop = 16;
  const paddingBottom = showLabels ? 28 : 16;

  const chartWidth = width - paddingLeft - paddingRight;
  const chartHeight = height - paddingTop - paddingBottom;

  const values = data.map((d) => d.value);
  const minVal = Math.min(...values);
  const maxVal = Math.max(...values);
  const range = maxVal - minVal || 1;
  const adjustedMin = minVal - range * 0.1;
  const adjustedMax = maxVal + range * 0.1;
  const adjustedRange = adjustedMax - adjustedMin;

  const getX = (index: number) =>
    paddingLeft + (index / (data.length - 1)) * chartWidth;
  const getY = (value: number) =>
    paddingTop + chartHeight - ((value - adjustedMin) / adjustedRange) * chartHeight;

  let linePath = '';
  data.forEach((point, i) => {
    const x = getX(i);
    const y = getY(point.value);
    linePath += i === 0 ? `M ${x} ${y}` : ` L ${x} ${y}`;
  });

  const fillPath = `${linePath} L ${getX(data.length - 1)} ${paddingTop + chartHeight} L ${getX(0)} ${paddingTop + chartHeight} Z`;

  const gridLines = [0, 0.5, 1].map((ratio) => {
    const val = adjustedMin + ratio * adjustedRange;
    return { y: getY(val), label: val.toFixed(1) };
  });

  return (
    <View style={{ width, height }}>
      <Svg width={width} height={height}>
        <Defs>
          <LinearGradient id="fillGrad" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0%" stopColor={lineColor} stopOpacity={0.3} />
            <Stop offset="100%" stopColor={lineColor} stopOpacity={0} />
          </LinearGradient>
        </Defs>

        {gridLines.map((gl, i) => (
          <React.Fragment key={i}>
            <Line
              x1={paddingLeft}
              y1={gl.y}
              x2={width - paddingRight}
              y2={gl.y}
              stroke={gridColor}
              strokeWidth={0.5}
              strokeDasharray="4 4"
            />
            {showYLabels && (
              <SvgText
                x={paddingLeft - 6}
                y={gl.y + 4}
                fill="#5F6368"
                fontSize={10}
                textAnchor="end"
              >
                {gl.label}
              </SvgText>
            )}
          </React.Fragment>
        ))}

        {fillGradient && (
          <Path d={fillPath} fill="url(#fillGrad)" />
        )}

        <Path
          d={linePath}
          stroke={lineColor}
          strokeWidth={2.5}
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {showDots &&
          data.map((point, i) => (
            <Circle
              key={i}
              cx={getX(i)}
              cy={getY(point.value)}
              r={4}
              fill="#16181C"
              stroke={dotColor}
              strokeWidth={2}
            />
          ))}

        {showLabels &&
          data.map((point, i) => (
            <SvgText
              key={i}
              x={getX(i)}
              y={height - 4}
              fill="#5F6368"
              fontSize={9}
              textAnchor="middle"
            >
              {point.label}
            </SvgText>
          ))}
      </Svg>
    </View>
  );
}
