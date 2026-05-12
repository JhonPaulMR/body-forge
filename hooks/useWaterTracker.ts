import { useState, useCallback, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from 'expo-router';
import * as Notifications from 'expo-notifications';

export function useWaterTracker() {
  const [waterIntake, setWaterIntake] = useState(0);
  const [waterGoal, setWaterGoal] = useState(3.0);
  const [showWaterModal, setShowWaterModal] = useState(false);
  const [waterGoalInput, setWaterGoalInput] = useState('');

  // Request notification permissions on mount
  useEffect(() => {
    (async () => {
      const { status } = await Notifications.requestPermissionsAsync();
      if (status !== 'granted') {
        console.log('Notification permission not granted');
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
    await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Parabéns! 💧',
        body: 'Você atingiu sua meta diária de água!',
        sound: true,
      },
      trigger: null, // fires immediately
    });
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
