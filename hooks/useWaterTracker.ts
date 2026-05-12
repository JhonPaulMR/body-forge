import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import { useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Platform } from 'react-native';

const requestNotificationPermissions = async (): Promise<boolean> => {
  if (Platform.OS === 'android') {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.warn('Permissão para notificações foi negada.');
      return false;
    }
  }
  return true;
};

export function useWaterTracker() {
  const [waterIntake, setWaterIntake] = useState(0);
  const [waterGoal, setWaterGoal] = useState(3.0);
  const [showWaterModal, setShowWaterModal] = useState(false);
  const [waterGoalInput, setWaterGoalInput] = useState('');

  // Request notification permissions on mount
  useEffect(() => {
    (async () => {
      try {
        if (Notifications.setNotificationChannelAsync) {
          await Notifications.setNotificationChannelAsync('water-goal', {
            name: 'Meta de agua',
            importance: Notifications.AndroidImportance?.HIGH ?? 4,
            sound: 'default',
            vibrationPattern: [0, 250, 250, 250],
            lightColor: '#A0C4FF',
          });
        }
        await requestNotificationPermissions();
      } catch (e) {
        console.warn(e);
      }
    })();
  }, []);

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
    } catch (e) {
      console.error(e);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadWaterData();
    }, [])
  );

  const sendWaterGoalNotification = async () => {
    try {
      const allowed = await requestNotificationPermissions();
      if (!allowed) return;

      await Notifications.scheduleNotificationAsync({
        content: {
          title: 'Parabéns! 💧',
          body: 'Você atingiu sua meta diária de água!',
          sound: true,
          channelId: 'water-goal',
        } as any,
        trigger: null, // fires immediately
      });
    } catch (e) {
      console.warn(e);
    }
  };

  const updateWater = async (amount: number) => {
    const newVal = Math.max(0, waterIntake + amount);
    if (newVal >= waterGoal && waterIntake < waterGoal && amount > 0) {
      sendWaterGoalNotification();
    }
    setWaterIntake(newVal);
    await AsyncStorage.setItem('water_intake', newVal.toString());
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
    saveWaterGoal
  };
}
