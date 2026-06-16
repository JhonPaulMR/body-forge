import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';

interface WorkoutPreferencesProps {
  defaultRestTime: number;
  setDefaultRestTime: (time: number) => void;
  defaultSets: number;
  setDefaultSets: (sets: number) => void;
  weightIncrement: number;
  setWeightIncrement: (val: number) => void;
  weightUnit: 'kg' | 'lbs';
}

export function WorkoutPreferences({
  defaultRestTime,
  setDefaultRestTime,
  defaultSets,
  setDefaultSets,
  weightIncrement,
  setWeightIncrement,
  weightUnit
}: WorkoutPreferencesProps) {
  return (
    <View className="bg-forge-surface rounded-2xl p-4 border border-forge-border">
      <View className="flex-row justify-between items-center mb-4">
        <View>
          <Text className="text-white font-medium text-base">Descanso Padrão</Text>
          <Text className="text-forge-text-secondary text-sm">Tempo inicial do cronômetro</Text>
        </View>
        <View className="flex-row bg-forge-bg rounded-lg p-1 border border-forge-border">
          {[60, 90, 120].map((time) => (
            <TouchableOpacity
              key={time}
              onPress={() => setDefaultRestTime(time)}
              className={`px-3 py-1.5 rounded-md ${defaultRestTime === time ? 'bg-forge-accent' : ''}`}
            >
              <Text className={`font-medium ${defaultRestTime === time ? 'text-forge-bg' : 'text-forge-muted'}`}>
                {time}s
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View className="h-[1px] bg-forge-border w-full mb-4" />

      <View className="flex-row justify-between items-center mb-4">
        <View>
          <Text className="text-white font-medium text-base">Séries Padrão</Text>
          <Text className="text-forge-text-secondary text-sm">Quantidade inicial ao adicionar</Text>
        </View>
        <View className="flex-row bg-forge-bg rounded-lg p-1 border border-forge-border">
          {[3, 4, 5].map((sets) => (
            <TouchableOpacity
              key={sets}
              onPress={() => setDefaultSets(sets)}
              className={`px-3 py-1.5 rounded-md ${defaultSets === sets ? 'bg-forge-accent' : ''}`}
            >
              <Text className={`font-medium ${defaultSets === sets ? 'text-forge-bg' : 'text-forge-muted'}`}>
                {sets}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View className="h-[1px] bg-forge-border w-full mb-4" />

      <View className="flex-row justify-between items-center">
        <View>
          <Text className="text-white font-medium text-base">Incremento de Carga</Text>
          <Text className="text-forge-text-secondary text-sm">Ajuste dos botões +/-</Text>
        </View>
        <View className="flex-row bg-forge-bg rounded-lg p-1 border border-forge-border">
          {(weightUnit === 'lbs' ? [2.5, 5, 10] : [1, 2.5, 5]).map((val) => (
            <TouchableOpacity
              key={val}
              onPress={() => setWeightIncrement(val)}
              className={`px-3 py-1.5 rounded-md ${weightIncrement === val ? 'bg-forge-accent' : ''}`}
            >
              <Text className={`font-medium ${weightIncrement === val ? 'text-forge-bg' : 'text-forge-muted'}`}>
                {val}{weightUnit}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </View>
  );
}
