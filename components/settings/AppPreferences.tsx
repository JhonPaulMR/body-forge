import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';

interface AppPreferencesProps {
  weightUnit: 'kg' | 'lbs';
  setWeightUnit: (unit: 'kg' | 'lbs') => void;
  measurementUnit: 'cm' | 'in';
  setMeasurementUnit: (unit: 'cm' | 'in') => void;
}

export function AppPreferences({
  weightUnit,
  setWeightUnit,
  measurementUnit,
  setMeasurementUnit
}: AppPreferencesProps) {
  return (
    <View className="bg-forge-surface rounded-2xl p-4 border border-forge-border">
      <View className="flex-row justify-between items-center mb-4">
        <Text className="text-white font-medium text-base">Unidade de Peso</Text>
        <View className="flex-row bg-forge-bg rounded-lg p-1 border border-forge-border">
          {['kg', 'lbs'].map((unit) => (
            <TouchableOpacity
              key={unit}
              onPress={() => setWeightUnit(unit as 'kg' | 'lbs')}
              className={`px-4 py-1.5 rounded-md ${weightUnit === unit ? 'bg-forge-accent' : ''}`}
            >
              <Text className={`font-medium ${weightUnit === unit ? 'text-forge-bg' : 'text-forge-muted'}`}>
                {unit.toUpperCase()}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View className="h-[1px] bg-forge-border w-full mb-4" />

      <View className="flex-row justify-between items-center">
        <Text className="text-white font-medium text-base">Unidade de Medida</Text>
        <View className="flex-row bg-forge-bg rounded-lg p-1 border border-forge-border">
          {['cm', 'in'].map((unit) => (
            <TouchableOpacity
              key={unit}
              onPress={() => setMeasurementUnit(unit as 'cm' | 'in')}
              className={`px-4 py-1.5 rounded-md ${measurementUnit === unit ? 'bg-forge-accent' : ''}`}
            >
              <Text className={`font-medium ${measurementUnit === unit ? 'text-forge-bg' : 'text-forge-muted'}`}>
                {unit.toUpperCase()}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </View>
  );
}
