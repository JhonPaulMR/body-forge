import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Alert,
  Modal,
  Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams, useFocusEffect } from 'expo-router';
import { ArrowLeft, Plus, MoreVertical, Trash2, Link } from 'lucide-react-native';
import { db } from '@/database/schema';

interface SetConfig {
  warmup: boolean;
  dropSet: boolean;
  dropSetGroupId?: string;
  untilFailure: boolean;
  minReps: number;
  maxReps: number;
  restTime: number;
}

interface ExerciseInfo {
  reId: string;
  name: string;
  muscle_group: string;
  target_sets: number;
  target_reps: string;
  rest_time_seconds: number;
  set_configs: string | null;
}

function parseSetConfigs(exercise: ExerciseInfo): SetConfig[] {
  if (exercise.set_configs) {
    try {
      return JSON.parse(exercise.set_configs);
    } catch (_) {}
  }
  const reps = (exercise.target_reps || '8-12').split('-');
  const minR = parseInt(reps[0]) || 8;
  const maxR = parseInt(reps[1] || reps[0]) || 12;
  const configs: SetConfig[] = [];
  for (let i = 0; i < exercise.target_sets; i++) {
    configs.push({
      warmup: false, dropSet: false, untilFailure: false,
      minReps: minR, maxReps: maxR,
      restTime: exercise.rest_time_seconds || 90,
    });
  }
  return configs;
}

function saveSetConfigsToDb(reId: string, configs: SetConfig[]) {
  try {
    db.runSync('UPDATE routine_exercises SET set_configs = ?, target_sets = ? WHERE id = ?',
      [JSON.stringify(configs), configs.length, reId]);
  } catch (e) {
    console.error('Error saving set configs:', e);
  }
}

export default function EditExerciseScreen() {
  const router = useRouter();
  const { reId, dayId } = useLocalSearchParams<{ reId: string; dayId: string }>();

  const [exerciseName, setExerciseName] = useState('');
  const [setConfigs, setSetConfigs] = useState<SetConfig[]>([]);
  const [menuSetIndex, setMenuSetIndex] = useState<number | null>(null);

  useFocusEffect(
    useCallback(() => {
      loadExercise();
    }, [reId])
  );

  const loadExercise = () => {
    try {
      const result = db.getFirstSync<ExerciseInfo>(
        `SELECT re.id as reId, e.name, e.muscle_group, re.target_sets, re.target_reps,
                re.rest_time_seconds, re.set_configs
         FROM routine_exercises re
         JOIN exercises e ON re.exercise_id = e.id
         WHERE re.id = ?`,
        [reId]
      );
      if (result) {
        setExerciseName(result.name);
        setSetConfigs(parseSetConfigs(result));
      }
    } catch (error) {
      console.error('Error loading exercise:', error);
    }
  };

  const formatRestTime = (seconds: number): string => {
    const min = Math.floor(seconds / 60);
    const sec = seconds % 60;
    return `${min}:${String(sec).padStart(2, '0')}`;
  };

  const handleAddSet = () => {
    const lastConfig = setConfigs[setConfigs.length - 1] || {
      warmup: false, dropSet: false, untilFailure: false,
      minReps: 8, maxReps: 12, restTime: 90,
    };
    const newConfigs = [...setConfigs, { ...lastConfig, warmup: false, dropSet: false, dropSetGroupId: undefined }];
    setSetConfigs(newConfigs);
    saveSetConfigsToDb(reId, newConfigs);
  };

  // "Add drop set" — creates NEW independent pair
  const handleAddDropSet = (index: number) => {
    const config = setConfigs[index];
    const groupId = 'dsg_' + Date.now();
    const newConfigs = [...setConfigs];
    // Mark current set as dropSet with new unique groupId
    newConfigs[index] = { ...config, dropSet: true, dropSetGroupId: groupId };
    // Insert duplicate after it with same groupId
    const dupSet: SetConfig = { ...config, dropSet: true, dropSetGroupId: groupId };
    newConfigs.splice(index + 1, 0, dupSet);
    setSetConfigs(newConfigs);
    saveSetConfigsToDb(reId, newConfigs);
    setMenuSetIndex(null);
  };

  const handleDeleteSet = (index: number) => {
    if (setConfigs.length <= 1) {
      Alert.alert('Erro', 'O exercício precisa ter pelo menos 1 série.');
      setMenuSetIndex(null);
      return;
    }
    const newConfigs = setConfigs.filter((_, i) => i !== index);
    setSetConfigs(newConfigs);
    saveSetConfigsToDb(reId, newConfigs);
    setMenuSetIndex(null);
  };

  const handleSave = () => {
    saveSetConfigsToDb(reId, setConfigs);
    router.back();
  };

  const navigateToEditSet = (index: number) => {
    const config = setConfigs[index];
    router.push(`/planner/edit-set?reId=${reId}&setIndex=${index}&totalSets=${setConfigs.length}&configJson=${encodeURIComponent(JSON.stringify(config))}` as any);
  };

  // Determine if set connects to the next set (same dropSetGroupId)
  const connectsBelow = (index: number): boolean => {
    if (index >= setConfigs.length - 1) return false;
    const current = setConfigs[index];
    const next = setConfigs[index + 1];
    if (!current.dropSet || !next.dropSet) return false;
    if (!current.dropSetGroupId || !next.dropSetGroupId) return false;
    return current.dropSetGroupId === next.dropSetGroupId;
  };

  const connectsAbove = (index: number): boolean => {
    if (index === 0) return false;
    const current = setConfigs[index];
    const prev = setConfigs[index - 1];
    if (!current.dropSet || !prev.dropSet) return false;
    if (!current.dropSetGroupId || !prev.dropSetGroupId) return false;
    return current.dropSetGroupId === prev.dropSetGroupId;
  };

  return (
    <SafeAreaView className="flex-1 bg-forge-bg" edges={['top']}>
      <View className="flex-row items-center justify-between px-5 py-3">
        <TouchableOpacity onPress={() => router.back()} className="w-9 h-9 rounded-xl bg-forge-surface justify-center items-center">
          <ArrowLeft size={20} color="#FFF" />
        </TouchableOpacity>
        <Text className="text-white text-sm font-extrabold tracking-wide">EDIT SESSION</Text>
        <TouchableOpacity onPress={handleSave}>
          <Text className="text-forge-accent text-sm font-extrabold tracking-tight">SAVE</Text>
        </TouchableOpacity>
      </View>

      <ScrollView className="flex-1 px-5" showsVerticalScrollIndicator={false}>
        <Text className="text-forge-muted text-[10px] font-bold tracking-widest mb-1.5 mt-4">CURRENT EXERCISE</Text>
        <Text className="text-white text-[28px] font-black leading-8 mb-8">{exerciseName}</Text>

        {setConfigs.map((config, index) => {
          const hasLineBelow = connectsBelow(index);
          const hasLineAbove = connectsAbove(index);
          const isDropSet = config.dropSet;

          return (
            <View key={index}>
              {/* Set row: circle + card */}
              <View className="flex-row items-start">
                {/* Left column: circle + connecting lines */}
                <View className="w-8 items-center mr-3">
                  {/* Line from above (if connected) */}
                  {hasLineAbove && (
                    <View className="w-[2px] h-3 bg-purple-400" />
                  )}
                  {!hasLineAbove && <View className="h-3" />}

                  {/* Circle */}
                  <View className={`w-7 h-7 rounded-full justify-center items-center ${
                    isDropSet ? 'border-2 border-purple-400' : 'border-2 border-forge-border'
                  }`}>
                    <Text className={`text-xs font-bold ${isDropSet ? 'text-purple-400' : 'text-forge-muted'}`}>
                      {index + 1}
                    </Text>
                  </View>

                  {/* Line below (if connected) */}
                  {hasLineBelow && (
                    <View className="w-[2px] flex-1 bg-purple-400 min-h-[20px]" />
                  )}
                </View>

                {/* Card */}
                <View className="flex-1 bg-forge-surface rounded-xl px-4 py-3 mb-2">
                  <TouchableOpacity
                    className="flex-row items-center justify-between"
                    onPress={() => navigateToEditSet(index)}
                  >
                    <View className="flex-1">
                      <Text className="text-white text-sm font-bold">Set {index + 1}</Text>
                      <Text className="text-forge-muted text-[11px] font-medium">
                        {config.dropSet ? 'Drop set · ' : ''}
                        {formatRestTime(config.restTime)} rest
                      </Text>
                    </View>
                    <TouchableOpacity className="p-1" onPress={() => setMenuSetIndex(index)}>
                      <MoreVertical size={16} color="#5F6368" />
                    </TouchableOpacity>
                  </TouchableOpacity>

                  {/* Badges */}
                  {(config.warmup || config.untilFailure) && (
                    <View className="flex-row gap-2 mt-1.5 flex-wrap">
                      {config.warmup && (
                        <View className="bg-orange-500/20 px-2 py-0.5 rounded-md">
                          <Text className="text-orange-400 text-[8px] font-bold">🔥 WARMUP</Text>
                        </View>
                      )}
                      {config.untilFailure && (
                        <View className="bg-red-500/20 px-2 py-0.5 rounded-md">
                          <Text className="text-red-400 text-[8px] font-bold">⚡ FAILURE</Text>
                        </View>
                      )}
                    </View>
                  )}
                </View>
              </View>
            </View>
          );
        })}

        {/* Add Set */}
        <TouchableOpacity
          className="flex-row items-center justify-center border border-dashed border-forge-border rounded-xl py-4 mt-3 gap-2 ml-11"
          onPress={handleAddSet}
        >
          <Plus size={16} color="#5F6368" />
          <Text className="text-forge-muted text-xs font-bold tracking-wide">Add set</Text>
        </TouchableOpacity>

        <View className="h-[80px]" />
      </ScrollView>

      {/* Set Menu */}
      <Modal visible={menuSetIndex !== null} transparent animationType="fade">
        <Pressable className="flex-1 bg-black/60 justify-center items-center" onPress={() => setMenuSetIndex(null)}>
          <View className="bg-forge-surface rounded-[16px] w-[200px] py-2">
            <TouchableOpacity
              className="flex-row items-center px-4 py-3.5 gap-3"
              onPress={() => { if (menuSetIndex !== null) { navigateToEditSet(menuSetIndex); setMenuSetIndex(null); } }}
            >
              <Text className="text-white text-sm font-semibold">Editar</Text>
            </TouchableOpacity>
            <View className="h-[1px] bg-forge-border mx-3" />
            <TouchableOpacity
              className="flex-row items-center px-4 py-3.5 gap-3"
              onPress={() => menuSetIndex !== null && handleAddDropSet(menuSetIndex)}
            >
              <Link size={14} color="#A78BFA" />
              <Text className="text-white text-sm font-semibold">Add drop set</Text>
            </TouchableOpacity>
            <View className="h-[1px] bg-forge-border mx-3" />
            <TouchableOpacity
              className="flex-row items-center px-4 py-3.5 gap-3"
              onPress={() => menuSetIndex !== null && handleDeleteSet(menuSetIndex)}
            >
              <Trash2 size={14} color="#EF4444" />
              <Text className="text-red-400 text-sm font-semibold">Delete</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}
