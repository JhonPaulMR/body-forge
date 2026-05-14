import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Platform } from 'react-native';
import { scheduleImmediateLocalNotification, areLocalNotificationsAvailable } from '@/services/notificationService';

export default function useWaterTracker() {
  const [waterIntake, setWaterIntake] = useState(0);
  const [waterGoal, setWaterGoal] = useState(3.0);
  const [showWaterModal, setShowWaterModal] = useState(false);
  const [waterGoalInput, setWaterGoalInput] = useState('');
  const [localNotificationsAvailable, setLocalNotificationsAvailable] = useState<boolean | null>(null);

  const loadWaterData = async () => {
    try {
      const todayStr = new Date().toISOString().split('T')[0];
      const lastReset = await AsyncStorage.getItem('water_last_reset');
      const goalStr = await AsyncStorage.getItem('water_goal');
      const intakeStr = await AsyncStorage.getItem('water_intake');

      if (goalStr) setWaterGoal(parseFloat(goalStr));

      if (lastReset !== todayStr) {
        setWaterIntake(0);
        await AsyncStorage.setItem('water_last_reset', todayStr);
        await AsyncStorage.setItem('water_intake', '0');
      } else {
        if (intakeStr) setWaterIntake(parseFloat(intakeStr));
      }

      // Verifica disponibilidade de notificações
      const available = await areLocalNotificationsAvailable();
      setLocalNotificationsAvailable(available);
    } catch (e) {
      console.error(e);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadWaterData();
    }, [])
  );

  const updateWater = async (amount: number) => {
    const prevVal = waterIntake;
    const newVal = Math.max(0, waterIntake + amount);
    setWaterIntake(newVal);
    await AsyncStorage.setItem('water_intake', newVal.toString());

    if (amount > 0 && prevVal < waterGoal && newVal >= waterGoal) {
      await scheduleImmediateLocalNotification({
        title: 'Meta de água atingida! 💧',
        body: `Parabéns! Você alcançou sua meta diária de ${waterGoal}L de água.`,
      });
    }
  };

  const saveWaterGoal = async () => {
    const parsed = parseFloat(waterGoalInput);
    if (!isNaN(parsed) && parsed > 0) {
      setWaterGoal(parsed);
      await AsyncStorage.setItem('water_goal', parsed.toString());
      setShowWaterModal(false);
    }
  };

  return {
    waterIntake,
    waterGoal,
    showWaterModal,
    setShowWaterModal,
    waterGoalInput,
    setWaterGoalInput,
    updateWater,
    saveWaterGoal,
    localNotificationsAvailable
  };
}
