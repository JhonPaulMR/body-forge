import React from 'react';
import { View, Text, Switch } from 'react-native';

interface NotificationPreferencesProps {
  restTimerEnabled: boolean;
  toggleRestTimerEnabled: () => void;
  restTimerVibration: boolean;
  toggleRestTimerVibration: () => void;
  restTimerSound: boolean;
  toggleRestTimerSound: () => void;
  dailyReminders: boolean;
  toggleDailyReminders: () => void;
}

export function NotificationPreferences({
  restTimerEnabled,
  toggleRestTimerEnabled,
  restTimerVibration,
  toggleRestTimerVibration,
  restTimerSound,
  toggleRestTimerSound,
  dailyReminders,
  toggleDailyReminders
}: NotificationPreferencesProps) {
  return (
    <View className="bg-forge-surface rounded-2xl p-4 border border-forge-border">
      <View className="flex-row justify-between items-center mb-4">
        <Text className="text-white font-medium text-base">Alertas de Descanso</Text>
        <Switch
          value={restTimerEnabled}
          onValueChange={toggleRestTimerEnabled}
          trackColor={{ false: '#3E414A', true: '#A0C4FF' }}
          thumbColor={restTimerEnabled ? '#2D3038' : '#A0A0A0'}
        />
      </View>

      <View className="flex-row justify-between items-center mb-4">
        <Text className="text-white font-medium text-base">Vibração no Cronômetro</Text>
        <Switch
          value={restTimerVibration}
          onValueChange={toggleRestTimerVibration}
          trackColor={{ false: '#3E414A', true: '#A0C4FF' }}
          thumbColor={restTimerVibration ? '#2D3038' : '#A0A0A0'}
          disabled={!restTimerEnabled}
        />
      </View>

      <View className="flex-row justify-between items-center mb-4">
        <Text className="text-white font-medium text-base">Som no Cronômetro</Text>
        <Switch
          value={restTimerSound}
          onValueChange={toggleRestTimerSound}
          trackColor={{ false: '#3E414A', true: '#A0C4FF' }}
          thumbColor={restTimerSound ? '#2D3038' : '#A0A0A0'}
          disabled={!restTimerEnabled}
        />
      </View>

      <View className="flex-row justify-between items-center">
        <Text className="text-white font-medium text-base">Lembretes Diários</Text>
        <Switch
          value={dailyReminders}
          onValueChange={toggleDailyReminders}
          trackColor={{ false: '#3E414A', true: '#A0C4FF' }}
          thumbColor={dailyReminders ? '#2D3038' : '#A0A0A0'}
        />
      </View>
    </View>
  );
}
