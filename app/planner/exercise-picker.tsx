import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  Image,
  Modal,
  Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { X, Search, ChevronDown, Check } from 'lucide-react-native';
import { db } from '@/database/schema';

interface Exercise {
  id: string;
  name: string;
  muscle_group: string;
  equipment: string;
  image_uri: string | null;
}

const muscleImages: Record<string, string> = {
  'Peito': 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?q=80&w=200',
  'Costas': 'https://images.unsplash.com/photo-1603287681836-b174ce5074c2?q=80&w=200',
  'Pernas': 'https://images.unsplash.com/photo-1574680096145-d05b474e2155?q=80&w=200',
  'Ombros': 'https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?q=80&w=200',
  'Bíceps': 'https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?q=80&w=200',
  'Tríceps': 'https://images.unsplash.com/photo-1530822847156-5df684ec5ee1?q=80&w=200',
  'Abdômen': 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?q=80&w=200',
};

export default function ExercisePickerScreen() {
  const router = useRouter();
  const { dayId, routineId } = useLocalSearchParams<{ dayId: string; routineId: string }>();

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

  const loadExercises = () => {
    try {
      const result = db.getAllSync<Exercise>(
        'SELECT id, name, muscle_group, equipment, image_uri FROM exercises ORDER BY muscle_group, name'
      );
      setExercises(result);
    } catch (error) {
      console.error('Error loading exercises:', error);
    }
  };

  const loadAlreadyAdded = () => {
    if (!dayId) return;
    try {
      const result = db.getAllSync<{ exercise_id: string }>(
        'SELECT exercise_id FROM routine_exercises WHERE routine_day_id = ?',
        [dayId]
      );
      setAlreadyAddedIds(new Set(result.map((r) => r.exercise_id)));
    } catch (error) {
      console.error('Error loading existing exercises:', error);
    }
  };

  const muscleGroups = useMemo(() => {
    return [...new Set(exercises.map((e) => e.muscle_group).filter(Boolean))].sort();
  }, [exercises]);

  const equipmentTypes = useMemo(() => {
    return [...new Set(exercises.map((e) => e.equipment).filter(Boolean))].sort();
  }, [exercises]);

  const filteredExercises = useMemo(() => {
    return exercises.filter((ex) => {
      const matchesSearch = searchQuery === '' ||
        ex.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesMuscle = !selectedMuscle || ex.muscle_group === selectedMuscle;
      const matchesEquipment = !selectedEquipment || ex.equipment === selectedEquipment;
      return matchesSearch && matchesMuscle && matchesEquipment;
    });
  }, [exercises, searchQuery, selectedMuscle, selectedEquipment]);

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
        // Also remove from superset if it was there
        setSupersetIds((sp) => {
          const nsp = new Set(sp);
          nsp.delete(id);
          return nsp;
        });
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
    if (selectedIds.size === 0 || !dayId) return;

    try {
      const maxIdx = db.getFirstSync<{ max_idx: number }>(
        'SELECT COALESCE(MAX(order_index), 0) as max_idx FROM routine_exercises WHERE routine_day_id = ?',
        [dayId]
      );
      let nextIndex = (maxIdx?.max_idx || 0) + 1;

      const supersetGroupId = supersetIds.size >= 2 ? 'ss_' + Date.now() : null;

      const stmt = db.prepareSync(
        `INSERT INTO routine_exercises
          (id, routine_day_id, exercise_id, order_index, superset_id, target_sets, target_reps, rest_time_seconds)
         VALUES (?, ?, ?, ?, ?, 3, '8-12', 90)`
      );

      for (const exId of selectedIds) {
        const reId = 're_' + Date.now() + '_' + nextIndex;
        const ssId = supersetIds.has(exId) ? supersetGroupId : null;
        stmt.executeSync([reId, dayId, exId, nextIndex, ssId]);
        nextIndex++;
      }

      router.back();
    } catch (error) {
      console.error('Error adding exercises:', error);
    }
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
        </View>
      </Pressable>
    </Modal>
  );

  const renderExerciseItem = ({ item }: { item: Exercise }) => {
    const isSelected = selectedIds.has(item.id);
    const isAlreadyAdded = alreadyAddedIds.has(item.id);
    const imgUri = item.image_uri || muscleImages[item.muscle_group] || muscleImages['Peito'];

    return (
      <TouchableOpacity
        className={`flex-row items-center py-3 px-4 rounded-xl mb-1.5 ${isAlreadyAdded ? 'opacity-40' : ''}`}
        activeOpacity={0.7}
        onPress={() => !isAlreadyAdded && toggleSelect(item.id)}
        disabled={isAlreadyAdded}
      >
        <Image source={{ uri: imgUri }} className="w-11 h-11 rounded-xl bg-forge-border" />
        <View className="flex-1 mx-3">
          <Text className="text-white text-[14px] font-bold mb-0.5">{item.name}</Text>
          <Text className="text-forge-muted-dark text-[10px] font-bold tracking-wide">
            {item.muscle_group?.toUpperCase()}
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
        <TouchableOpacity>
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
      <View className="absolute bottom-0 left-0 right-0 bg-forge-bg px-5 pt-3 pb-8 border-t border-forge-border">
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
