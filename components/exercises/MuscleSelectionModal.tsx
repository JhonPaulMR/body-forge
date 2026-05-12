import React from 'react';
import { View, Text, Modal, TouchableOpacity, ScrollView } from 'react-native';
import { X, Activity } from 'lucide-react-native';
import Body from 'react-native-body-highlighter';

export interface MuscleGroupItem {
  id: string;
  name: string;
  slug: string;
  side: 'front' | 'back';
}

export const MUSCLE_GROUPS = {
  upper: [
    { id: 'chest', name: 'Peito', slug: 'chest', side: 'front' },
    { id: 'shoulders', name: 'Ombros', slug: 'deltoids', side: 'front' },
    { id: 'traps', name: 'Trapézio', slug: 'trapezius', side: 'back' },
    { id: 'lats', name: 'Grande Dorsal', slug: 'upper-back', side: 'back' },
    { id: 'middle_back', name: 'Meio das Costas', slug: 'upper-back', side: 'back' },
    { id: 'lower_back', name: 'Lombar', slug: 'lower-back', side: 'back' },
    { id: 'biceps', name: 'Bíceps', slug: 'biceps', side: 'front' },
    { id: 'triceps', name: 'Tríceps', slug: 'triceps', side: 'back' },
    { id: 'forearms', name: 'Antebraços', slug: 'forearm', side: 'front' },
    { id: 'abs', name: 'Abdominais', slug: 'abs', side: 'front' },
  ] as MuscleGroupItem[],
  lower: [
    { id: 'quads', name: 'Quadríceps', slug: 'quadriceps', side: 'front' },
    { id: 'hamstrings', name: 'Isquiotibiais', slug: 'hamstring', side: 'back' },
    { id: 'glutes', name: 'Glúteos', slug: 'gluteal', side: 'back' },
    { id: 'abductors', name: 'Abdutores', slug: 'gluteal', side: 'back' },
    { id: 'adductors', name: 'Adutores', slug: 'adductors', side: 'front' },
    { id: 'calves', name: 'Panturrilha', slug: 'calves', side: 'back' },
  ] as MuscleGroupItem[],
  other: [
    { id: 'cardio', name: 'Cardio', slug: '', side: 'front' },
  ] as MuscleGroupItem[],
};

export const getMuscleById = (id: string): MuscleGroupItem | undefined => {
  const allMuscles = [...MUSCLE_GROUPS.upper, ...MUSCLE_GROUPS.lower, ...MUSCLE_GROUPS.other];
  return allMuscles.find(m => m.id === id);
};

interface MuscleSelectionModalProps {
  visible: boolean;
  onClose: () => void;
  title: string;
  selectedMuscles: string[];
  onSelect: (muscleId: string) => void;
  multiple?: boolean;
}

export default function MuscleSelectionModal({
  visible,
  onClose,
  title,
  selectedMuscles,
  onSelect,
  multiple = false,
}: MuscleSelectionModalProps) {
  const handleSelect = (muscleId: string) => {
    onSelect(muscleId);
    if (!multiple) {
      onClose();
    }
  };

  const renderMuscleItem = (item: MuscleGroupItem, category: 'upper' | 'lower' | 'other') => {
    const isSelected = selectedMuscles.includes(item.id);
    const bodyData = item.slug ? [{ slug: item.slug as any, intensity: 1 }] : [];

    // Adjust position based on category
    let translateY = 0;
    if (category === 'upper') {
      translateY = 10;
    } else if (category === 'lower') {
      translateY = -90;
    }

    return (
      <TouchableOpacity
        key={item.id}
        onPress={() => handleSelect(item.id)}
        className={`w-[22%] aspect-[3/4] mb-4 items-center justify-center rounded-xl border ${
          isSelected ? 'bg-forge-accent/20 border-forge-accent' : 'bg-forge-surface border-forge-border'
        }`}
      >
        <View className="flex-1 justify-center items-center overflow-hidden pt-2" pointerEvents="none">
          {item.slug ? (
            <View style={{ transform: [{ scale: 0.35 }, { translateY }] }}>
              <Body
                data={bodyData}
                side={item.side}
                gender="male"
                scale={1}
                colors={['#A0C4FF', '#4FACFE']}
                border="#5F6368"
              />
            </View>
          ) : (
            <Activity size={20} color="#8A8F98" />
          )}
        </View>
        <Text
          className={`text-[9px] font-bold text-center uppercase tracking-wider mb-2 px-1 ${
            isSelected ? 'text-forge-accent' : 'text-forge-muted-dark'
          }`}
          numberOfLines={2}
        >
          {item.name}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="formSheet">
      <View className="flex-1 bg-forge-bg">
        <View className="flex-row items-center justify-between px-5 py-4 border-b border-forge-surface">
          <Text className="text-white text-base font-extrabold tracking-wide uppercase">
            {title}
          </Text>
          <TouchableOpacity
            onPress={onClose}
            className="w-8 h-8 items-center justify-center rounded-full bg-forge-surface"
          >
            <X size={18} color="#A0C4FF" />
          </TouchableOpacity>
        </View>

        <ScrollView 
          className="flex-1 px-5 pt-6" 
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 100 }}
        >
          <Text className="text-white text-xs font-bold uppercase tracking-wider mb-4">
            Upper Body
          </Text>
          <View className="flex-row flex-wrap justify-start gap-[4%]">
            {MUSCLE_GROUPS.upper.map(m => renderMuscleItem(m, 'upper'))}
          </View>

          <Text className="text-white text-xs font-bold uppercase tracking-wider mb-4 mt-2">
            Lower Body
          </Text>
          <View className="flex-row flex-wrap justify-start gap-[4%]">
            {MUSCLE_GROUPS.lower.map(m => renderMuscleItem(m, 'lower'))}
          </View>

          <Text className="text-white text-xs font-bold uppercase tracking-wider mb-4 mt-2">
            Other
          </Text>
          <View className="flex-row flex-wrap justify-start gap-[4%] mb-12">
            {MUSCLE_GROUPS.other.map(m => renderMuscleItem(m, 'other'))}
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
}
