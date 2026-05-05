import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, FlatList, Image, Modal, Alert } from 'react-native';
import { X } from 'lucide-react-native';

interface DayExercise {
  id: string;
  exercise_id: string;
  order_index: number;
  superset_id: string | null;
  target_sets: number;
  target_reps: string;
  rest_time_seconds: number;
  name: string;
  muscle_group: string;
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

interface Props {
  visible: boolean;
  onClose: () => void;
  dayExercises: DayExercise[];
  onSaveSuperset: (selections: string[]) => void;
}

export default function CreateSupersetModal({ visible, onClose, dayExercises, onSaveSuperset }: Props) {
  const [selections, setSelections] = useState<string[]>([]);

  useEffect(() => {
    if (visible) {
      setSelections([]); // Reset selections on open
    }
  }, [visible]);

  const toggleSelection = (exId: string) => {
    setSelections((prev) => prev.includes(exId) ? prev.filter((id) => id !== exId) : [...prev, exId]);
  };

  const handleSave = () => {
    if (selections.length < 2) {
      Alert.alert('Erro', 'Selecione pelo menos 2 exercícios.');
      return;
    }
    onSaveSuperset(selections);
  };

  const availableExercises = dayExercises.filter(ex => !ex.superset_id);

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View className="flex-1 bg-black/60 justify-end">
        <View className="bg-forge-surface rounded-t-[24px] pt-5 pb-8 px-5 max-h-[75%]">
          <View className="flex-row items-center justify-between mb-2">
            <TouchableOpacity onPress={onClose}><X size={22} color="#FFF" /></TouchableOpacity>
            <Text className="text-white text-sm font-extrabold tracking-wide">CREATE SUPERSET</Text>
            <View className="w-[22px]" />
          </View>
          <Text className="text-forge-muted text-[12px] mb-4">Select the exercises you want to superset.</Text>
          <FlatList
            data={availableExercises}
            keyExtractor={(ex) => ex.id}
            showsVerticalScrollIndicator={false}
            renderItem={({ item: ex }) => {
              const selectionIndex = selections.indexOf(ex.id);
              const isSelected = selectionIndex >= 0;
              const imgUri = ex.image_uri || muscleImages[ex.muscle_group] || muscleImages['Peito'];
              return (
                <TouchableOpacity
                  className={`flex-row items-center py-3.5 px-3 rounded-xl mb-2 ${isSelected ? 'bg-forge-accent-bg border border-forge-accent' : 'bg-forge-bg'}`}
                  activeOpacity={0.7} onPress={() => toggleSelection(ex.id)}
                >
                  <Image source={{ uri: imgUri }} className="w-11 h-11 rounded-xl bg-forge-border mr-3" />
                  <View className="flex-1">
                    <Text className="text-white text-[14px] font-bold">{ex.name}</Text>
                    <Text className="text-forge-muted text-[10px] font-medium">{ex.muscle_group} • {ex.target_sets} Sets</Text>
                  </View>
                  <View className={`w-7 h-7 rounded-full justify-center items-center ${isSelected ? 'bg-forge-accent' : 'border-2 border-forge-border'}`}>
                    {isSelected && <Text className="text-forge-bg text-xs font-extrabold">{selectionIndex + 1}</Text>}
                  </View>
                </TouchableOpacity>
              );
            }}
            ListEmptyComponent={
              <Text className="text-forge-muted text-center mt-6">Nenhum exercício disponível para agrupamento.</Text>
            }
          />
          <TouchableOpacity
            className={`bg-forge-accent rounded-2xl py-4 items-center mt-4 ${selections.length < 2 ? 'opacity-40' : ''}`}
            disabled={selections.length < 2} onPress={handleSave}
          >
            <Text className="text-forge-bg text-sm font-extrabold tracking-wide">SAVE SUPERSET</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}
