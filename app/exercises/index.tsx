import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  Image,
  Modal,
  Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ArrowLeft, Search, ChevronDown, Plus } from 'lucide-react-native';
import { db } from '@/database/schema';

interface Exercise {
  id: string;
  name: string;
  muscle_group: string;
  equipment: string;
  instructions: string | null;
  image_uri: string | null;
  is_custom: number;
}

const muscleImages: Record<string, string> = {
  'Peito': 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?q=80&w=400',
  'Costas': 'https://images.unsplash.com/photo-1603287681836-b174ce5074c2?q=80&w=400',
  'Pernas': 'https://images.unsplash.com/photo-1574680096145-d05b474e2155?q=80&w=400',
  'Ombros': 'https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?q=80&w=400',
  'Bíceps': 'https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?q=80&w=400',
  'Tríceps': 'https://images.unsplash.com/photo-1530822847156-5df684ec5ee1?q=80&w=400',
  'Abdômen': 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?q=80&w=400',
};

export default function ExercisesListScreen() {
  const router = useRouter();
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMuscle, setSelectedMuscle] = useState<string | null>(null);
  const [selectedEquipment, setSelectedEquipment] = useState<string | null>(null);
  const [showMuscleModal, setShowMuscleModal] = useState(false);
  const [showEquipmentModal, setShowEquipmentModal] = useState(false);

  useEffect(() => {
    loadExercises();
  }, []);

  const loadExercises = () => {
    try {
      const result = db.getAllSync<Exercise>('SELECT * FROM exercises ORDER BY muscle_group, name');
      setExercises(result);
    } catch (error) {
      console.error('Error loading exercises:', error);
    }
  };

  const muscleGroups = useMemo(() => {
    const groups = [...new Set(exercises.map((e) => e.muscle_group).filter(Boolean))];
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
      const matchesMuscle = !selectedMuscle || ex.muscle_group === selectedMuscle;
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
      <Pressable style={styles.modalOverlay} onPress={onClose}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>{title}</Text>
          <TouchableOpacity
            style={[styles.modalOption, !selected && styles.modalOptionActive]}
            onPress={() => { onSelect(null); onClose(); }}
          >
            <Text style={[styles.modalOptionText, !selected && styles.modalOptionTextActive]}>
              Todos
            </Text>
          </TouchableOpacity>
          {options.map((opt) => (
            <TouchableOpacity
              key={opt}
              style={[styles.modalOption, selected === opt && styles.modalOptionActive]}
              onPress={() => { onSelect(opt); onClose(); }}
            >
              <Text style={[styles.modalOptionText, selected === opt && styles.modalOptionTextActive]}>
                {opt}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </Pressable>
    </Modal>
  );

  const renderExerciseItem = ({ item }: { item: Exercise }) => {
    const imageUri = item.image_uri || muscleImages[item.muscle_group] || muscleImages['Peito'];
    return (
      <TouchableOpacity
        style={styles.exerciseCard}
        activeOpacity={0.7}
        onPress={() => router.push(`/exercises/${item.id}` as any)}
      >
        <Image source={{ uri: imageUri }} style={styles.exerciseImage} />
        <View style={styles.exerciseInfo}>
          <Text style={styles.exerciseName}>{item.name}</Text>
          <Text style={styles.exerciseMuscle}>{item.muscle_group?.toUpperCase()}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={22} color="#FFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>EXERCÍCIOS</Text>
        <View style={{ width: 36 }} />
      </View>

      <View style={styles.searchContainer}>
        <Search size={18} color="#5F6368" />
        <TextInput
          style={styles.searchInput}
          placeholder="Busca"
          placeholderTextColor="#5F6368"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      <View style={styles.filtersRow}>
        <TouchableOpacity
          style={styles.filterChip}
          onPress={() => setShowMuscleModal(true)}
        >
          <Text style={styles.filterText}>
            {selectedMuscle || 'TODOS OS MÚSCULOS'}
          </Text>
          <ChevronDown size={14} color="#A0C4FF" />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.filterChip}
          onPress={() => setShowEquipmentModal(true)}
        >
          <Text style={styles.filterText}>
            {selectedEquipment || 'TODOS OS EQUIPAMENTOS'}
          </Text>
          <ChevronDown size={14} color="#A0C4FF" />
        </TouchableOpacity>
      </View>

      <Text style={styles.sectionLabel}>
        {selectedMuscle || selectedEquipment
          ? `${filteredExercises.length} EXERCÍCIOS ENCONTRADOS`
          : 'TODOS OS EXERCÍCIOS'}
      </Text>

      <FlatList
        data={filteredExercises}
        keyExtractor={(item) => item.id}
        renderItem={renderExerciseItem}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />

      <TouchableOpacity style={styles.fab} activeOpacity={0.8}>
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#16181C',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: '#1C1E26',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 1,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1C1E26',
    borderRadius: 12,
    marginHorizontal: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 12,
    gap: 10,
  },
  searchInput: {
    flex: 1,
    color: '#FFF',
    fontSize: 14,
    fontWeight: '500',
  },
  filtersRow: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 10,
    marginBottom: 16,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1C1E26',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 20,
    gap: 6,
    borderWidth: 1,
    borderColor: '#2A2D35',
  },
  filterText: {
    color: '#A0C4FF',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  sectionLabel: {
    color: '#5F6368',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  exerciseCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1C1E26',
    borderRadius: 16,
    marginBottom: 10,
    overflow: 'hidden',
  },
  exerciseImage: {
    width: 70,
    height: 70,
    backgroundColor: '#2A2D35',
  },
  exerciseInfo: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  exerciseName: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 4,
  },
  exerciseMuscle: {
    color: '#5F6368',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1,
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: '#A0C4FF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#A0C4FF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#1C1E26',
    borderRadius: 20,
    padding: 24,
    width: '80%',
    maxHeight: '60%',
  },
  modalTitle: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 16,
  },
  modalOption: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginBottom: 4,
  },
  modalOptionActive: {
    backgroundColor: '#252B3B',
  },
  modalOptionText: {
    color: '#CCC',
    fontSize: 14,
    fontWeight: '600',
  },
  modalOptionTextActive: {
    color: '#A0C4FF',
  },
});
