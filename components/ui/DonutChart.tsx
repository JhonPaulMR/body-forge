import React from 'react';
import { View } from 'react-native';
import Svg, { Path, Circle, Text as SvgText } from 'react-native-svg';

interface DonutSegment {
  value: number;
  color: string;
  label: string;
}

interface DonutChartProps {
  data: DonutSegment[];
  size?: number;
  strokeWidth?: number;
  centerLabel?: string;
  centerSubLabel?: string;
}

export function DonutChart({
  data,
  size = 160,
  strokeWidth = 20,
  centerLabel,
  centerSubLabel,
}: DonutChartProps) {
  const radius = (size - strokeWidth) / 2;
  const center = size / 2;
  const total = data.reduce((sum, d) => sum + d.value, 0);

  let currentAngle = -90;

  const segments = data.map((segment) => {
    const angle = (segment.value / total) * 360;
    const startRad = (currentAngle * Math.PI) / 180;
    const endRad = ((currentAngle + angle) * Math.PI) / 180;

    const x1 = center + radius * Math.cos(startRad);
    const y1 = center + radius * Math.sin(startRad);
    const x2 = center + radius * Math.cos(endRad);
    const y2 = center + radius * Math.sin(endRad);

    const largeArc = angle > 180 ? 1 : 0;

    const path = `M ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2}`;
    currentAngle += angle;

    return { ...segment, path };
  });

  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size}>
        <Circle
          cx={center}
          cy={center}
          r={radius}
          stroke="#2A2D35"
          strokeWidth={strokeWidth}
          fill="none"
        />

        {segments.map((seg, i) => (
          <Path
            key={i}
            d={seg.path}
            stroke={seg.color}
            strokeWidth={strokeWidth}
            fill="none"
            strokeLinecap="round"
          />
        ))}

        {centerLabel && (
          <SvgText
            x={center}
            y={centerSubLabel ? center - 4 : center + 4}
            fill="#FFF"
            fontSize={28}
            fontWeight="bold"
            textAnchor="middle"
          >
            {centerLabel}
          </SvgText>
        )}
        {centerSubLabel && (
          <SvgText
            x={center}
            y={center + 18}
            fill="#5F6368"
            fontSize={10}
            fontWeight="600"
            textAnchor="middle"
            letterSpacing={1}
          >
            {centerSubLabel}
          </SvgText>
        )}
      </Svg>
    </View>
  );
}
