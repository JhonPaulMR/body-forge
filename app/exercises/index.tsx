import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  Image,
  Modal,
  Pressable,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import { ArrowLeft, Search, ChevronDown, Plus } from 'lucide-react-native';
import { db } from '@/database/schema';
import { getMuscleById } from '@/components/exercises/MuscleSelectionModal';
import { muscleImages } from '@/constants/muscleImages';
import { parseMuscleGroup } from '@/services/muscleGroupUtils';

interface Exercise {
  id: string;
  name: string;
  muscle_group: string;
  equipment: string;
  instructions: string | null;
  image_uri: string | null;
  gif_url?: string | null;
  body_part?: string;
  target?: string;
  is_custom: number;
}

export default function ExercisesListScreen() {
  const router = useRouter();
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMuscle, setSelectedMuscle] = useState<string | null>(null);
  const [selectedEquipment, setSelectedEquipment] = useState<string | null>(null);
  const [showMuscleModal, setShowMuscleModal] = useState(false);
  const [showEquipmentModal, setShowEquipmentModal] = useState(false);

  useFocusEffect(
    useCallback(() => {
      loadExercises();
    }, [])
  );

  const loadExercises = () => {
    try {
      const result = db.getAllSync<Exercise>('SELECT * FROM exercises ORDER BY muscle_group, name');
      setExercises(result);
    } catch (error) {
      console.error('Error loading exercises:', error);
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
    const groups = [...new Set(exercises.map(getDisplayMuscle).filter(Boolean))];
    return groups.sort();
  }, [exercises]);

  const equipmentTypes = useMemo(() => {
    const types = [...new Set(exercises.map((e) => e.equipment).filter(Boolean))];
    return types.sort();
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

  const toTitleCase = (str: string) => {
    return str.replace(
      /\w\S*/g,
      (txt) => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()
    );
  };

  const renderExerciseItem = ({ item }: { item: Exercise }) => {
    const muscleData = parseMuscleGroup(item.muscle_group);
    const primaryDisplay = muscleData.primaryString;

    const imageUri = item.gif_url || item.image_uri || muscleImages[primaryDisplay] || muscleImages['Peito'];
    
    return (
      <TouchableOpacity
        className="flex-row items-center bg-forge-surface rounded-2xl mb-2.5 overflow-hidden"
        activeOpacity={0.7}
        onPress={() => router.push(`/exercises/${item.id}` as any)}
      >
        <Image source={{ uri: imageUri }} className="w-[70px] h-[70px] bg-forge-border" />
        <View className="flex-1 px-4 py-3.5">
          <Text className="text-white text-[15px] font-bold mb-1">{toTitleCase(item.name)}</Text>
          <Text className="text-forge-accent text-[10px] font-bold tracking-wide">
            {primaryDisplay?.toUpperCase()}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-forge-bg" edges={['top']}>
      <View className="flex-row items-center justify-between px-5 py-3">
        <TouchableOpacity onPress={() => router.back()} className="w-9 h-9 rounded-xl bg-forge-surface justify-center items-center">
          <ArrowLeft size={22} color="#FFF" />
        </TouchableOpacity>
        <Text className="text-white text-base font-extrabold tracking-wide">EXERCÍCIOS</Text>
        <View className="w-9" />
      </View>

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

      <View className="flex-row px-5 gap-2.5 mb-4">
        <TouchableOpacity
          className="flex-row items-center bg-forge-surface px-3.5 py-2.5 rounded-[20px] gap-1.5 border border-forge-border"
          onPress={() => setShowMuscleModal(true)}
        >
          <Text className="text-forge-accent text-[10px] font-bold tracking-tight">
            {selectedMuscle || 'TODOS OS MÚSCULOS'}
          </Text>
          <ChevronDown size={14} color="#A0C4FF" />
        </TouchableOpacity>
        <TouchableOpacity
          className="flex-row items-center bg-forge-surface px-3.5 py-2.5 rounded-[20px] gap-1.5 border border-forge-border"
          onPress={() => setShowEquipmentModal(true)}
        >
          <Text className="text-forge-accent text-[10px] font-bold tracking-tight">
            {selectedEquipment || 'TODOS OS EQUIPAMENTOS'}
          </Text>
          <ChevronDown size={14} color="#A0C4FF" />
        </TouchableOpacity>
      </View>

      <Text className="text-forge-muted-dark text-[11px] font-bold tracking-wide px-5 mb-3">
        {selectedMuscle || selectedEquipment
          ? `${filteredExercises.length} EXERCÍCIOS ENCONTRADOS`
          : 'TODOS OS EXERCÍCIOS'}
      </Text>

      <FlatList
        data={filteredExercises}
        keyExtractor={(item) => item.id}
        renderItem={renderExerciseItem}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
      />

      <TouchableOpacity
        className="absolute bottom-24 right-6 w-14 h-14 rounded-2xl bg-forge-accent justify-center items-center"
        style={{ elevation: 8, shadowColor: '#A0C4FF', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8 }}
        activeOpacity={0.8}
        onPress={() => router.push('/exercises/create')}
      >
        <Plus size={24} color="#FFF" />
      </TouchableOpacity>

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
