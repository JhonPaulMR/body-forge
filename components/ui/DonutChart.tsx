import React, { useRef, useCallback } from 'react';
import { View, PanResponder, Animated, Text } from 'react-native';
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
  showPercentages?: boolean;
}

export function DonutChart({
  data,
  size = 160,
  strokeWidth = 20,
  centerLabel,
  centerSubLabel,
  showPercentages = false,
}: DonutChartProps) {
  const radius = (size - strokeWidth) / 2;
  const center = size / 2;
  const total = data.reduce((sum, d) => sum + d.value, 0);

  // Rotation state — all refs, zero re-renders during drag
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const rotationDegrees = useRef(0);
  const initialRotation = useRef(0);
  const initialTouchAngle = useRef(0);

  // Center position in screen coordinates — measured once on layout
  const centerXRef = useRef(0);
  const centerYRef = useRef(0);
  const containerRef = useRef<View>(null);

  const handleLayout = useCallback(() => {
    // Use setTimeout(0) to ensure layout has settled (especially inside ScrollView)
    setTimeout(() => {
      containerRef.current?.measureInWindow((x, y, width, height) => {
        centerXRef.current = x + width / 2;
        centerYRef.current = y + height / 2;
      });
    }, 0);
  }, []);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onStartShouldSetPanResponderCapture: () => true,
      onMoveShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponderCapture: () => true,
      onPanResponderTerminationRequest: () => false,
      onPanResponderGrant: (_evt, gestureState) => {
        // Re-measure on every touch start to handle scroll offset changes
        containerRef.current?.measureInWindow((x, y, width, height) => {
          centerXRef.current = x + width / 2;
          centerYRef.current = y + height / 2;
        });

        const dx = gestureState.x0 - centerXRef.current;
        const dy = gestureState.y0 - centerYRef.current;
        initialTouchAngle.current = Math.atan2(dy, dx) * (180 / Math.PI);
        initialRotation.current = rotationDegrees.current;
      },
      onPanResponderMove: (_evt, gestureState) => {
        const dx = gestureState.moveX - centerXRef.current;
        const dy = gestureState.moveY - centerYRef.current;

        if (dx === 0 && dy === 0) return;

        const currentAngle = Math.atan2(dy, dx) * (180 / Math.PI);
        let delta = currentAngle - initialTouchAngle.current;

        // Normalize to [-180, 180]
        if (delta > 180) delta -= 360;
        if (delta < -180) delta += 360;

        const newRotation = initialRotation.current + delta;
        rotationDegrees.current = newRotation;
        rotateAnim.setValue(newRotation);
      },
    })
  ).current;

  // Animated interpolation — unlimited rotation range via extrapolate
  const rotateInterpolation = rotateAnim.interpolate({
    inputRange: [-360, 360],
    outputRange: ['-360deg', '360deg'],
    extrapolate: 'extend',
  });

  // Build segments at a fixed -90° start angle (top of circle)
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
    
    // Shift text to match the VISIBLE center of the segment due to overlapping rounded caps
    const shiftRad = data.length > 1 ? (strokeWidth / 2) / radius : 0;
    const midRad = startRad + ((angle * Math.PI) / 180) / 2;
    const visibleMidRad = midRad - shiftRad;
    
    const textX = center + radius * Math.cos(visibleMidRad);
    const textY = center + radius * Math.sin(visibleMidRad) + 4; // +4 for vertical alignment

    currentAngle += angle;

    return { ...segment, path, textX, textY, percent: Math.round((segment.value / total) * 100) };
  });

  return (
    <View
      ref={containerRef}
      onLayout={handleLayout}
      style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}
    >
      {/* Rotatable ring + percentage labels */}
      <Animated.View style={{ width: size, height: size, transform: [{ rotate: rotateInterpolation }] }}>
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
              key={`path-${i}`}
              d={seg.path}
              stroke={seg.color}
              strokeWidth={strokeWidth}
              fill="none"
              strokeLinecap="round"
            />
          ))}

          {/* Cover circle to force Seg 0's start cap to be on top of Seg N-1's end cap */}
          {data.length > 1 && segments.length > 0 && (
            <Circle
              cx={center + radius * Math.cos(-90 * Math.PI / 180)}
              cy={center + radius * Math.sin(-90 * Math.PI / 180)}
              r={strokeWidth / 2}
              fill={segments[0].color}
            />
          )}

          {segments.map((seg, i) => (
            <React.Fragment key={`text-${i}`}>
              {showPercentages && seg.percent >= 3 && (
                <SvgText
                  x={seg.textX}
                  y={seg.textY}
                  fill="#FFF"
                  fontSize={strokeWidth > 20 ? 9.5 : 8}
                  fontWeight="bold"
                  textAnchor="middle"
                >
                  {`${seg.percent}%`}
                </SvgText>
              )}
            </React.Fragment>
          ))}
        </Svg>
      </Animated.View>

      {/* Center text — stays upright regardless of rotation */}
      <View style={{ position: 'absolute', alignItems: 'center', justifyContent: 'center' }} pointerEvents="none">
        {centerLabel && (
          <Text style={{ color: '#FFF', fontSize: 28, fontWeight: 'bold', includeFontPadding: false }}>
            {centerLabel}
          </Text>
        )}
        {centerSubLabel && (
          <Text style={{ color: '#8A8F98', fontSize: 10, fontWeight: '600', letterSpacing: 1, marginTop: centerLabel ? -2 : 0, includeFontPadding: false }}>
            {centerSubLabel}
          </Text>
        )}
      </View>

      {/* Touch capture layer */}
      <View
        style={{ position: 'absolute', top: 0, left: 0, width: size, height: size, backgroundColor: 'transparent' }}
        {...panResponder.panHandlers}
      />
    </View>
  );
}
