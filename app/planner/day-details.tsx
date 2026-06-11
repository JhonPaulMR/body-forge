import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  Dimensions,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams, useFocusEffect } from 'expo-router';
import { ArrowLeft, Play, Activity, Clock, Zap } from 'lucide-react-native';
import { RoutineRepository } from '@/database/repositories/RoutineRepository';
import { muscleImages } from '@/constants/muscleImages';
import { parseMuscleGroup } from '@/services/muscleGroupUtils';
import { toTitleCase } from '@/utils/stringUtils';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface Routine {
  id: string;
  name: string;
  description: string | null;
  cover_image_uri: string | null;
}

interface RoutineDay {
  id: string;
  routine_id: string;
  day_name: string;
  order_index: number;
}

interface DayExerciseInfo {
  id: string;
  name: string;
  muscle_group: string;
  image_uri: string | null;
  target_sets: number;
  target_reps: string;
  rest_time_seconds: number;
  superset_id: string | null;
  set_configs?: string | null;
}

export default function DayDetailsScreen() {
  const router = useRouter();
  const { dayId, routineId } = useLocalSearchParams<{ dayId: string; routineId: string }>();
  const insets = useSafeAreaInsets();

  const [routine, setRoutine] = useState<Routine | null>(null);
  const [day, setDay] = useState<RoutineDay | null>(null);
  const [exercises, setExercises] = useState<DayExerciseInfo[]>([]);
  
  const [subtitle, setSubtitle] = useState('WORKOUT DETAILS');
  const [estimatedTime, setEstimatedTime] = useState(0);
  const [estimatedCalories, setEstimatedCalories] = useState(0);

  useFocusEffect(
    useCallback(() => {
      if (dayId && routineId) {
        loadData();
      }
    }, [dayId, routineId])
  );

  const loadData = () => {
    try {
      // 1. Fetch Routine
      const r = RoutineRepository.getRoutine(routineId as string);
      setRoutine(r as any || null);

      // 2. Fetch Day
      const d = RoutineRepository.getRoutineDay(dayId as string);
      setDay(d as any || null);

      // 3. Fetch Exercises for the Day
      const exs = RoutineRepository.getDayExercises(dayId as string);
      setExercises(exs as any);

      // 4. Calculate Dynamics (Subtitle, Time, Calories)
      calculateDynamics(exs);

    } catch (error) {
      console.error('Error loading day details:', error);
    }
  };

  const calculateDynamics = (exs: DayExerciseInfo[]) => {
    if (!exs || exs.length === 0) {
      setSubtitle('NO EXERCISES YET');
      setEstimatedTime(0);
      setEstimatedCalories(0);
      return;
    }

    // --- Time & Calories Calculation ---
    let totalMinutes = 0;
    
    exs.forEach(ex => {
      // 1 minute per set (execution time)
      totalMinutes += ex.target_sets;
      
      let isSpecialSet = false;
      try {
        if (ex.set_configs) {
          const configs = JSON.parse(ex.set_configs);
          if (Array.isArray(configs)) {
            isSpecialSet = configs.some(c => c.type === 'dropset');
          }
        }
      } catch (e) {
        console.warn('Failed to parse set_configs', e);
      }

      if (ex.superset_id) {
        isSpecialSet = true;
      }

      // Rest Time
      const restMinutes = (ex.rest_time_seconds || 0) / 60;
      if (isSpecialSet) {
        // Rest only once after the exercise/superset completes
        totalMinutes += restMinutes;
      } else {
        // Rest after every set
        totalMinutes += (ex.target_sets * restMinutes);
      }
    });

    const finalTime = Math.ceil(totalMinutes);
    setEstimatedTime(finalTime);
    // Calories: average ~7.5 kcal per minute of training
    setEstimatedCalories(Math.ceil(finalTime * 7.5));

    // --- Muscle Group Subtitle Calculation ---
    const upperMuscles = ['peito', 'costas', 'ombro', 'ombros', 'bíceps', 'biceps', 'tríceps', 'triceps', 'antebraco', 'antebraço', 'abdômen', 'abdomen', 'trapézio', 'trapezio', 'lombar'];
    const lowerMuscles = ['quadríceps', 'quadriceps', 'posterior de coxa', 'posterior', 'glúteo', 'glúteos', 'gluteo', 'gluteos', 'panturrilha', 'panturrilhas', 'perna', 'pernas'];

    let hasUpper = false;
    let hasLower = false;
    
    // Map to aggregate sets by muscle group
    const muscleVolume: Record<string, number> = {};

    exs.forEach(ex => {
      const muscleData = parseMuscleGroup(ex.muscle_group);
      const muscle = muscleData.primaryString;
      if (!muscle) return;
      
      const muscleLower = muscle.toLowerCase();
      
      if (upperMuscles.includes(muscleLower)) hasUpper = true;
      if (lowerMuscles.includes(muscleLower)) hasLower = true;

      if (!muscleVolume[muscle]) {
        muscleVolume[muscle] = 0;
      }
      // Add volume (number of sets)
      muscleVolume[muscle] += ex.target_sets;
    });

    if (hasUpper && hasLower) {
      setSubtitle('FULL BODY');
    } else {
      // Sort muscle groups by volume (descending)
      const sortedMuscles = Object.keys(muscleVolume).sort((a, b) => muscleVolume[b] - muscleVolume[a]);
      
      if (sortedMuscles.length > 0) {
        // Get top 2
        const topMuscles = sortedMuscles.slice(0, 2).map(m => m.toUpperCase());
        setSubtitle(topMuscles.join(' & '));
      } else {
        setSubtitle('WORKOUT DETAILS');
      }
    }
  };

  if (!routine || !day) {
    return (
      <SafeAreaView className="flex-1 bg-forge-bg">
        <Text className="text-forge-muted text-base text-center mt-[100px]">Carregando...</Text>
      </SafeAreaView>
    );
  }

  const coverImage = routine.cover_image_uri || 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=1000';

  return (
    <SafeAreaView className="flex-1 bg-forge-bg" edges={['top']}>
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120 }}>
        
        {/* Hero Section */}
        <View className="bg-forge-surface-hover" style={{ width: SCREEN_WIDTH, height: 280 }}>
          <Image
            source={{ uri: coverImage }}
            className="w-full h-full opacity-50"
            resizeMode="cover"
          />
          {/* Dark Overlay Gradient simulation */}
          <View className="absolute inset-0" style={{ backgroundColor: 'rgba(22,24,28,0.65)' }} />
          <View className="absolute bottom-0 left-0 right-0 h-32" style={{ backgroundColor: '#16181C', opacity: 0.8 }} />

          {/* Top Bar */}
          <View className="absolute top-4 left-0 right-0 flex-row items-center px-4">
            <TouchableOpacity
              className="w-10 h-10 rounded-full justify-center items-center"
              style={{ backgroundColor: 'rgba(28,30,38,0.7)' }}
              onPress={() => router.back()}
            >
              <ArrowLeft size={22} color="#FFF" />
            </TouchableOpacity>
          </View>

          {/* Title Area */}
          <View className="absolute bottom-6 left-5 right-5">
            <Text className="text-forge-accent text-xs font-black tracking-widest mb-1.5 uppercase">
              {subtitle}
            </Text>
            <View className="flex-row justify-between items-end">
              <Text className="text-white text-[32px] font-black leading-10 flex-1 mr-4">
                {day.day_name}
              </Text>
              
              <View className="items-end gap-1.5">
                <View className="flex-row items-center gap-1.5">
                  <Zap size={12} color="#EF4444" />
                  <Text className="text-forge-muted-dark text-xs font-bold">{estimatedCalories} kcal</Text>
                </View>
                <View className="flex-row items-center gap-1.5">
                  <Clock size={12} color="#8A8F98" />
                  <Text className="text-forge-muted-dark text-xs font-bold">{estimatedTime} min</Text>
                </View>
              </View>
            </View>
          </View>
        </View>

        {/* Tab Bar (Static Overview) */}
        <View className="flex-row px-5 border-b border-forge-border">
          <View className="py-4 mr-6 border-b-2 border-forge-accent">
            <Text className="text-[13px] font-bold tracking-widest text-forge-accent">
              OVERVIEW
            </Text>
          </View>
        </View>

        {/* Exercises List */}
        <View className="px-5 pt-6 gap-3">
          {exercises.length === 0 ? (
            <View className="items-center justify-center py-10 bg-forge-surface rounded-2xl">
              <Activity size={32} color="#4A5060" />
              <Text className="text-forge-muted font-semibold mt-4">Nenhum exercício adicionado</Text>
            </View>
          ) : (
            exercises.map((ex, index) => {
              const muscleData = parseMuscleGroup(ex.muscle_group);
              const primaryDisplay = muscleData.primaryString;
              const imgUri = ex.image_uri || muscleImages[primaryDisplay] || muscleImages['Peito'] || coverImage;
              return (
                <View 
                  key={ex.id + index} 
                  className="bg-forge-surface rounded-2xl flex-row overflow-hidden items-center p-3 gap-4"
                >
                  <Image
                    source={{ uri: imgUri }}
                    className="w-20 h-20 rounded-xl bg-forge-surface-hover"
                    resizeMode="cover"
                  />
                
                <View className="flex-1 py-1">
                  <Text className="text-white text-base font-bold mb-1.5" numberOfLines={2}>
                    {toTitleCase(ex.name)}
                  </Text>
                  <Text className="text-forge-muted text-xs font-semibold">
                    {ex.target_sets} sets
                  </Text>
                </View>
              </View>
              );
            })
          )}
        </View>

      </ScrollView>

      <View 
        className="absolute bottom-0 left-0 right-0 px-5 pt-4 bg-forge-bg border-t border-forge-border/30"
        style={{ paddingBottom: Math.max(insets.bottom, 24) }}
      >
        <TouchableOpacity 
          className="flex-row items-center justify-center bg-forge-accent rounded-2xl py-4 gap-2 shadow-sm"
          onPress={() => {
            router.push(`/(tabs)/treino?dayId=${dayId}&routineId=${routineId}`);
          }}
        >
          <Text className="text-forge-bg text-[15px] font-extrabold tracking-wide">START WORKOUT</Text>
          <Play size={18} color="#1A1D24" fill="#1A1D24" />
        </TouchableOpacity>
      </View>

    </SafeAreaView>
  );
}
