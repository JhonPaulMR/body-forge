import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  Image,
  Modal,
  Pressable,
  ScrollView,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams, useFocusEffect } from 'expo-router';
import { X, Search, ChevronDown, Check } from 'lucide-react-native';
import { ExerciseRepository } from '@/database/repositories/ExerciseRepository';
import { RoutineRepository } from '@/database/repositories/RoutineRepository';
import { muscleImages } from '@/constants/muscleImages';
import { parseMuscleGroup } from '@/services/muscleGroupUtils';
import { useSettingsStore } from '@/hooks/useSettingsStore';

interface Exercise {
  id: string;
  name: string;
  muscle_group: string;
  equipment: string;
  image_uri: string | null;
  gif_url?: string | null;
  body_part?: string;
  target?: string;
}

const toTitleCase = (str: string) => {
  return str.replace(
    /\w\S*/g,
    (txt) => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()
  );
};

export default function ExercisePickerScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { dayId, routineId, mode, replaceId, newlyCreatedId } = useLocalSearchParams<{ dayId: string; routineId: string; mode?: string; replaceId?: string; newlyCreatedId?: string }>();

  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [supersetIds, setSupersetIds] = useState<Set<string>>(new Set());
  const [alreadyAddedIds, setAlreadyAddedIds] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMuscle, setSelectedMuscle] = useState<string | null>(null);
  const [selectedEquipment, setSelectedEquipment] = useState<string | null>(null);
  const [showMuscleModal, setShowMuscleModal] = useState(false);
  const [showEquipmentModal, setShowEquipmentModal] = useState(false);

  useEffect(() => {
    loadExercises();
    loadAlreadyAdded();
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadExercises();
    }, [])
  );

  useEffect(() => {
    if (newlyCreatedId) {
      setSelectedIds(prev => new Set(prev).add(newlyCreatedId));
    }
  }, [newlyCreatedId]);

  const loadExercises = () => {
    try {
      const result = ExerciseRepository.getAllExercisesForPicker();
      setExercises(result as any);
    } catch (error) {
      console.error('Error loading exercises:', error);
    }
  };

  const loadAlreadyAdded = () => {
    if (mode === 'active') {
      const { useWorkoutStore } = require('@/hooks/useWorkoutStore');
      const activeExs = useWorkoutStore.getState().exercises;
      const ids = new Set<string>(activeExs.map((e: any) => e.exercise_id));
      if (replaceId) {
        // Find the exercise_id of the one we are replacing to allow it if needed,
        // but normally we don't care, we just want to prevent adding duplicates.
        // Let's just disable all currently active ones.
      }
      setAlreadyAddedIds(ids);
      return;
    }

    if (!dayId) return;
    try {
      const resultIds = RoutineRepository.getDayExercisesIds(dayId);
      setAlreadyAddedIds(new Set(resultIds));
    } catch (error) {
      console.error('Error loading existing exercises:', error);
    }
  };

  const getDisplayMuscle = (ex: Exercise) => {
    let primary = ex.body_part;
    if (primary && (primary.toLowerCase() === 'braços' || primary.toLowerCase() === 'pernas') && ex.target) {
      primary = ex.target;
    }
    if (primary) return primary;

    if (ex.muscle_group && ex.muscle_group.startsWith('{')) {
      const parsed = parseMuscleGroup(ex.muscle_group);
      return parsed.primaryString || 'Outros';
    }
    return ex.muscle_group || 'Outros';
  };

  const muscleGroups = useMemo(() => {
    return [...new Set(exercises.map(getDisplayMuscle).filter(Boolean))].sort();
  }, [exercises]);

  const equipmentTypes = useMemo(() => {
    return [...new Set(exercises.map((e) => e.equipment).filter(Boolean))].sort();
  }, [exercises]);

  const filteredExercises = useMemo(() => {
    return exercises.filter((ex) => {
      const matchesSearch = searchQuery === '' ||
        ex.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesMuscle = !selectedMuscle || getDisplayMuscle(ex) === selectedMuscle;
      const matchesEquipment = !selectedEquipment || ex.equipment === selectedEquipment;
      return matchesSearch && matchesMuscle && matchesEquipment;
    });
  }, [exercises, searchQuery, selectedMuscle, selectedEquipment]);

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const toggleSuperset = () => {
    if (selectedIds.size < 2) {
      return;
    }
    if (supersetIds.size > 0) {
      setSupersetIds(new Set());
    } else {
      setSupersetIds(new Set(selectedIds));
    }
  };

  const handleAddExercises = () => {
    if (selectedIds.size === 0) return;

    if (mode === 'active') {
      const { useWorkoutStore } = require('@/hooks/useWorkoutStore');
      const store = useWorkoutStore.getState();
      
      const newWorkoutExercises = Array.from(selectedIds).map(exId => {
        const baseEx = exercises.find(e => e.id === exId);
        return {
          id: 'ex_' + Math.random().toString(36).substr(2, 9),
          exercise_id: exId,
          name: baseEx?.name || 'Unknown',
          muscle_group: baseEx?.muscle_group || 'Peito',
          image_uri: baseEx?.gif_url || baseEx?.image_uri || null,
          target_sets: useSettingsStore.getState().defaultSets || 3,
          target_reps: '8-12',
          rest_time_seconds: useSettingsStore.getState().defaultRestTime,
          superset_id: supersetIds.has(exId) ? ('ss_' + Date.now()) : null,
          sets: Array.from({ length: useSettingsStore.getState().defaultSets || 3 }).map((_, i) => ({
            id: 'set_' + Math.random().toString(36).substring(2, 7),
            weight: 0,
            reps: 0,
            is_completed: false,
            is_warmup: false,
            is_dropset: false,
          })),
          previous_sets: []
        };
      });

      if (replaceId) {
         if (newWorkoutExercises.length === 1) {
            store.replaceExerciseInActive(replaceId, newWorkoutExercises[0]);
         } else {
            store.removeExercise(replaceId);
            store.addExercisesToActive(newWorkoutExercises);
         }
      } else {
         store.addExercisesToActive(newWorkoutExercises);
      }
      
      router.back();
      return;
    }

    if (!dayId) return;

      RoutineRepository.addExercisesToDay(dayId, selectedIds, supersetIds);

      router.back();
  };

  const renderFilterModal = (
    visible: boolean,
    onClose: () => void,
    options: string[],
    selected: string | null,
    onSelect: (val: string | null) => void,
    title: string,
  ) => (
    <Modal visible={visible} transparent animationType="fade">
      <Pressable className="flex-1 bg-black/60 justify-center items-center" onPress={onClose}>
        <View className="bg-forge-surface rounded-[20px] p-6 w-[80%] max-h-[60%]">
          <Text className="text-white text-lg font-extrabold mb-4">{title}</Text>
          <ScrollView className="w-full" showsVerticalScrollIndicator={false}>
            <TouchableOpacity
              className={`py-3 px-4 rounded-xl mb-1 ${!selected ? 'bg-forge-accent-bg' : ''}`}
              onPress={() => { onSelect(null); onClose(); }}
            >
              <Text className={`text-sm font-semibold ${!selected ? 'text-forge-accent' : 'text-forge-text-secondary'}`}>
                Todos
              </Text>
            </TouchableOpacity>
            {options.map((opt) => (
              <TouchableOpacity
                key={opt}
                className={`py-3 px-4 rounded-xl mb-1 ${selected === opt ? 'bg-forge-accent-bg' : ''}`}
                onPress={() => { onSelect(opt); onClose(); }}
              >
                <Text className={`text-sm font-semibold ${selected === opt ? 'text-forge-accent' : 'text-forge-text-secondary'}`}>
                  {opt}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </Pressable>
    </Modal>
  );

  const renderExerciseItem = ({ item }: { item: Exercise }) => {
    const isSelected = selectedIds.has(item.id);
    const isAlreadyAdded = alreadyAddedIds.has(item.id);
    const muscleData = parseMuscleGroup(item.muscle_group);
    const primaryDisplay = muscleData.primaryString;
    const imgUri = item.gif_url || item.image_uri || muscleImages[primaryDisplay] || muscleImages['Peito'];

    return (
      <TouchableOpacity
        className={`flex-row items-center py-3 px-4 rounded-xl mb-1.5 ${isAlreadyAdded ? 'opacity-40' : ''}`}
        activeOpacity={0.7}
        onPress={() => !isAlreadyAdded && toggleSelect(item.id)}
        disabled={isAlreadyAdded}
      >
        <Image source={{ uri: imgUri }} className="w-11 h-11 rounded-xl bg-forge-border" />
        <View className="flex-1 mx-3">
          <Text className="text-white text-[14px] font-bold mb-0.5">{toTitleCase(item.name)}</Text>
          <Text className="text-forge-muted-dark text-[10px] font-bold tracking-wide">
            {primaryDisplay?.toUpperCase()}
          </Text>
        </View>
        <View
          className={`w-6 h-6 rounded-full border-2 justify-center items-center ${
            isSelected
              ? 'bg-forge-green border-forge-green'
              : isAlreadyAdded
              ? 'border-forge-muted-dark bg-forge-muted-dark'
              : 'border-forge-border'
          }`}
        >
          {(isSelected || isAlreadyAdded) && <Check size={14} color="#FFF" />}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-forge-bg" edges={['top']}>
      {/* Header */}
      <View className="flex-row items-center justify-between px-5 py-3">
        <TouchableOpacity onPress={() => router.back()} className="w-9 h-9 rounded-xl bg-forge-surface justify-center items-center">
          <X size={20} color="#FFF" />
        </TouchableOpacity>
        <Text className="text-white text-base font-extrabold tracking-wide">ESCOLHER EXERCÍCIOS</Text>
        <TouchableOpacity onPress={() => router.push(`/exercises/create?fromPicker=true&dayId=${dayId || ''}&routineId=${routineId || ''}&mode=${mode || ''}` as any)}>
          <Text className="text-forge-accent text-sm font-extrabold tracking-tight">CRIAR</Text>
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      <View className="flex-row items-center bg-forge-surface rounded-xl mx-5 px-4 py-3 mb-3 gap-2.5">
        <Search size={18} color="#5F6368" />
        <TextInput
          className="flex-1 text-white text-sm font-medium"
          placeholder="Busca"
          placeholderTextColor="#5F6368"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {/* Filters */}
      <View className="flex-row px-5 gap-2.5 mb-4">
        <TouchableOpacity
          className="flex-row items-center bg-forge-surface px-3.5 py-2.5 rounded-[20px] gap-1.5 border border-forge-border"
          onPress={() => setShowMuscleModal(true)}
        >
          <Text className="text-forge-accent text-[10px] font-bold tracking-tight">
            {selectedMuscle?.toUpperCase() || 'TODOS OS MÚSCULOS'}
          </Text>
          <ChevronDown size={14} color="#A0C4FF" />
        </TouchableOpacity>
        <TouchableOpacity
          className="flex-row items-center bg-forge-surface px-3.5 py-2.5 rounded-[20px] gap-1.5 border border-forge-border"
          onPress={() => setShowEquipmentModal(true)}
        >
          <Text className="text-forge-accent text-[10px] font-bold tracking-tight">
            {selectedEquipment?.toUpperCase() || 'TODOS OS EQUIPAMENTOS'}
          </Text>
          <ChevronDown size={14} color="#A0C4FF" />
        </TouchableOpacity>
      </View>

      {/* Section Label */}
      <Text className="text-forge-muted-dark text-[11px] font-bold tracking-wide px-5 mb-2">
        {searchQuery || selectedMuscle || selectedEquipment
          ? `${filteredExercises.length} ENCONTRADOS`
          : 'CATÁLOGO'}
      </Text>

      {/* Exercise List */}
      <FlatList
        data={filteredExercises}
        keyExtractor={(item) => item.id}
        renderItem={renderExerciseItem}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 160 }}
        showsVerticalScrollIndicator={false}
      />

      {/* Bottom Actions */}
      <View 
        className="absolute bottom-0 left-0 right-0 bg-forge-bg px-5 pt-3 border-t border-forge-border"
        style={{ paddingBottom: Math.max(insets.bottom, 24) }}
      >
        {/* Superset Button */}
        <TouchableOpacity
          className={`flex-row items-center justify-center rounded-2xl py-3.5 mb-2.5 border ${
            supersetIds.size > 0 ? 'bg-forge-accent-bg border-forge-accent' : 'border-forge-border'
          } ${selectedIds.size < 2 ? 'opacity-40' : ''}`}
          onPress={toggleSuperset}
          disabled={selectedIds.size < 2}
        >
          <Text className={`text-sm font-extrabold tracking-tight ${supersetIds.size > 0 ? 'text-forge-accent' : 'text-forge-muted'}`}>
            ADICIONAR SUPERSÉRIES ({supersetIds.size})
          </Text>
        </TouchableOpacity>

        {/* Add Button */}
        <TouchableOpacity
          className={`flex-row items-center justify-center bg-forge-accent rounded-2xl py-4 ${selectedIds.size === 0 ? 'opacity-40' : ''}`}
          onPress={handleAddExercises}
          disabled={selectedIds.size === 0}
        >
          <Text className="text-forge-bg text-sm font-extrabold tracking-tight">
            ADICIONAR EXERCÍCIOS ({selectedIds.size})
          </Text>
        </TouchableOpacity>
      </View>

      {/* Filter Modals */}
      {renderFilterModal(
        showMuscleModal,
        () => setShowMuscleModal(false),
        muscleGroups,
        selectedMuscle,
        setSelectedMuscle,
        'Grupo Muscular',
      )}
      {renderFilterModal(
        showEquipmentModal,
        () => setShowEquipmentModal(false),
        equipmentTypes,
        selectedEquipment,
        setSelectedEquipment,
        'Equipamento',
      )}
    </SafeAreaView>
  );
}
