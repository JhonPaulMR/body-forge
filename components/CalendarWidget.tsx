import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Modal } from 'react-native';

interface CalendarWidgetProps {
  currentMonthStr: string;
  completedDays: number;
  weekDays: Date[];
  weeklyGoal: number;
  onUpdateGoal: (goal: number) => void;
}

export function CalendarWidget({ currentMonthStr, completedDays, weekDays, weeklyGoal, onUpdateGoal }: CalendarWidgetProps) {
  const todayStr = new Date().toISOString().split('T')[0];
  const [modalVisible, setModalVisible] = useState(false);

  // Array from 1 to 7
  const options = [1, 2, 3, 4, 5, 6, 7];

  return (
    <View className="mb-6 w-full">
      <Text className="text-forge-text-tertiary text-[13px] font-semibold tracking-wide">{currentMonthStr}</Text>
      
      <TouchableOpacity 
        className="flex-row items-center justify-between mt-1.5 mb-4"
        onPress={() => setModalVisible(true)}
      >
        <Text className="text-forge-orange text-[11px] font-bold tracking-tight">
          {completedDays}/{weeklyGoal} DIAS CONCLUÍDOS
        </Text>
        <View className="w-[60px] h-1 bg-forge-border rounded-sm">
          <View 
            className="h-1 bg-forge-green rounded-sm" 
            style={{ width: `${Math.min((completedDays / weeklyGoal) * 100, 100)}%` }} 
          />
        </View>
      </TouchableOpacity>

      <View className="flex-row justify-between w-full">
        {weekDays.map((date, i) => {
          const dStr = date.toISOString().split('T')[0];
          const isToday = dStr === todayStr;
          const dayNames = ['DOM', 'SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SÁB'];

          return (
            <View key={i} className={`py-2.5 px-3 rounded-lg items-center flex-1 mx-[2px] ${isToday ? 'bg-forge-accent' : 'bg-forge-surface'}`}>
              <Text className={`text-[11px] mb-1 font-semibold ${isToday ? 'text-forge-bg' : 'text-forge-muted'}`}>
                {dayNames[date.getDay()]}
              </Text>
              <Text className={`text-base font-bold ${isToday ? 'text-forge-bg' : 'text-forge-text-secondary'}`}>
                {date.getDate()}
              </Text>
            </View>
          );
        })}
      </View>

      <Modal
        visible={modalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
      >
        <View className="flex-1 bg-black/60 justify-center items-center px-6">
          <View className="bg-forge-surface w-full rounded-2xl p-6 border border-forge-border">
            <Text className="text-white text-lg font-bold text-center mb-2">Meta Semanal</Text>
            <Text className="text-forge-muted text-sm text-center mb-6">
              Quantos dias você pretende treinar por semana?
            </Text>
            
            <View className="flex-row flex-wrap justify-center gap-3 mb-6">
              {options.map((num) => (
                <TouchableOpacity
                  key={num}
                  className={`w-12 h-12 rounded-xl justify-center items-center ${
                    weeklyGoal === num 
                      ? 'bg-forge-accent' 
                      : 'bg-forge-bg border border-forge-border'
                  }`}
                  onPress={() => {
                    onUpdateGoal(num);
                    setModalVisible(false);
                  }}
                >
                  <Text 
                    className={`font-bold text-lg ${
                      weeklyGoal === num ? 'text-white' : 'text-forge-text-secondary'
                    }`}
                  >
                    {num}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity 
              className="py-3 bg-forge-bg rounded-xl items-center border border-forge-border"
              onPress={() => setModalVisible(false)}
            >
              <Text className="text-forge-text-secondary font-bold">Cancelar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}
