import MuscleSelectionModal, { getMuscleById } from '@/components/exercises/MuscleSelectionModal';
import { ExerciseRepository } from '@/database/repositories/ExerciseRepository';
import * as ImagePicker from 'expo-image-picker';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Camera, ChevronDown, Plus, X } from 'lucide-react-native';
import React, { useState } from 'react';
import {
    Alert,
    Image,
    ScrollView,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const CATEGORIES = [
  'Peso e reps',
  'Peso corporal assistido e reps',
  'Reps',
  'Distancia e tempo',
  'Tempo',
];

export default function CreateExerciseScreen() {
  const router = useRouter();
  const { fromPicker, dayId, routineId, mode } = useLocalSearchParams<{ fromPicker?: string, dayId?: string, routineId?: string, mode?: string }>();
  const [name, setName] = useState('');
  const [instructions, setInstructions] = useState('');
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [category, setCategory] = useState(CATEGORIES[0]);
  
  const [primaryMuscles, setPrimaryMuscles] = useState<string[]>([]);
  const [secondaryMuscles, setSecondaryMuscles] = useState<string[]>([]);
  
  const [showPrimaryModal, setShowPrimaryModal] = useState(false);
  const [showSecondaryModal, setShowSecondaryModal] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);

  const handlePickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.All,
      allowsEditing: true,
      aspect: [16, 9],
      quality: 0.8,
      videoMaxDuration: 60,
    });

    if (!result.canceled) {
      setImageUri(result.assets[0].uri);
    }
  };

  const handleSave = () => {
    if (!name.trim()) {
      Alert.alert('Erro', 'Por favor, insira o nome do exercício.');
      return;
    }

    if (primaryMuscles.length === 0) {
      Alert.alert('Erro', 'Por favor, selecione pelo menos um músculo primário.');
      return;
    }

    try {
      // Create a UUID - using a simple math random for simplicity as crypto might not be available
      const id = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
      
      const primaryMuscleObj = getMuscleById(primaryMuscles[0]);
      
      const muscleGroupData = {
        primary: primaryMuscles,
        secondary: secondaryMuscles,
        // We also store a top level primary string for backwards compatibility with the rest of the app that expects a simple string
        primaryString: primaryMuscleObj?.name || 'Vários'
      };

      ExerciseRepository.createCustomExercise({
        id,
        name: name.trim(),
        muscleGroupData: JSON.stringify(muscleGroupData),
        category,
        instructions: instructions.trim(),
        imageUri
      });

      if (fromPicker === 'true') {
        router.navigate({ 
          pathname: '/planner/exercise-picker', 
          params: { dayId, routineId, mode, newlyCreatedId: id } 
        } as any);
      } else {
        router.back();
      }
    } catch (error) {
      console.error('Error saving exercise:', error);
      Alert.alert('Erro', 'Não foi possível salvar o exercício.');
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-forge-bg" edges={['top']}>
      {/* Header */}
      <View className="flex-row items-center justify-between px-5 py-3 border-b border-forge-surface">
        <TouchableOpacity onPress={() => router.back()} className="w-9 h-9 items-center justify-center">
          <X size={24} color="#FFF" />
        </TouchableOpacity>
        <Text className="text-white text-base font-extrabold tracking-wide uppercase">CRIAR EXERCÍCIO</Text>
        <TouchableOpacity onPress={handleSave} className="h-9 justify-center">
          <Text className="text-forge-accent text-sm font-bold tracking-wide">SAVE</Text>
        </TouchableOpacity>
      </View>

      <ScrollView 
        className="flex-1 px-5 pt-6" 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }}
      >
        {/* Image Picker */}
        <TouchableOpacity 
          onPress={handlePickImage}
          className="w-full aspect-video bg-forge-surface rounded-2xl items-center justify-center overflow-hidden mb-8"
        >
          {imageUri ? (
            <Image source={{ uri: imageUri }} className="w-full h-full" />
          ) : (
            <View className="items-center">
              <View className="w-14 h-14 bg-forge-accent/10 rounded-2xl items-center justify-center mb-3">
                <Camera size={28} color="#A0C4FF" />
              </View>
              <Text className="text-forge-muted-dark text-xs font-bold tracking-widest uppercase">
                ADICIONAR FOTO OU VÍDEO
              </Text>
            </View>
          )}
        </TouchableOpacity>

        {/* Name Input */}
        <View className="mb-6">
          <Text className="text-forge-muted-dark text-[10px] font-bold tracking-widest uppercase mb-2">
            NOME <Text className="text-forge-accent">*</Text>
          </Text>
          <TextInput
            className="text-white text-base font-medium py-3 border-b border-forge-surface"
            placeholder="Ex: Supino Reto"
            placeholderTextColor="#5F6368"
            value={name}
            onChangeText={setName}
          />
        </View>

        {/* Instructions Input */}
        <View className="mb-8">
          <Text className="text-forge-muted-dark text-[10px] font-bold tracking-widest uppercase mb-2">
            INSTRUÇÕES (OPCIONAL)
          </Text>
          <TextInput
            className="text-white text-sm font-medium py-3 border-b border-forge-surface min-h-[80px]"
            placeholder="Adicione notas sobre a execução..."
            placeholderTextColor="#5F6368"
            value={instructions}
            onChangeText={setInstructions}
            multiline
            textAlignVertical="top"
          />
        </View>

        {/* Category */}
        <View className="mb-10">
          <Text className="text-forge-muted-dark text-[10px] font-bold tracking-widest uppercase mb-2">
            CATEGORIA
          </Text>
          <TouchableOpacity 
            className="flex-row items-center justify-between py-3 border-b border-forge-surface"
            onPress={() => setShowCategoryModal(true)}
          >
            <Text className="text-white text-base font-medium">{category}</Text>
            <ChevronDown size={20} color="#5F6368" />
          </TouchableOpacity>
        </View>

        {/* Target Muscles */}
        <View className="mb-12">
          <Text className="text-white text-base font-extrabold tracking-wide uppercase mb-2">
            MÚSCULOS ALVO
          </Text>
          <Text className="text-forge-muted-dark text-xs font-medium leading-5 mb-6">
            Selecionar músculos primários e secundários melhora as estatísticas e o mapa de calor dos seus treinos.
          </Text>

          {/* Primary Muscles Button */}
          <TouchableOpacity 
            className="bg-forge-surface rounded-2xl p-4 flex-row items-center justify-between mb-3"
            onPress={() => setShowPrimaryModal(true)}
          >
            <View className="flex-1">
              <Text className="text-white text-sm font-bold uppercase tracking-wide mb-1">
                MÚSCULOS PRIMÁRIOS
              </Text>
              <Text className="text-forge-muted-dark text-xs">
                {primaryMuscles.length > 0 
                  ? primaryMuscles.map(id => getMuscleById(id)?.name).filter(Boolean).join(', ')
                  : 'Selecione o grupo principal'}
              </Text>
            </View>
            <View className="w-10 h-10 bg-forge-bg rounded-xl items-center justify-center ml-3">
              <Plus size={20} color="#A0C4FF" />
            </View>
          </TouchableOpacity>

          {/* Secondary Muscles Button */}
          <TouchableOpacity 
            className="bg-forge-surface rounded-2xl p-4 flex-row items-center justify-between"
            onPress={() => setShowSecondaryModal(true)}
          >
            <View className="flex-1">
              <Text className="text-white text-sm font-bold uppercase tracking-wide mb-1">
                MÚSCULOS SECUNDÁRIOS
              </Text>
              <Text className="text-forge-muted-dark text-xs">
                {secondaryMuscles.length > 0 
                  ? secondaryMuscles.map(id => getMuscleById(id)?.name).filter(Boolean).join(', ')
                  : 'Selecione grupos auxiliares'}
              </Text>
            </View>
            <View className="w-10 h-10 bg-forge-bg rounded-xl items-center justify-center ml-3">
              <Plus size={20} color="#A0C4FF" />
            </View>
          </TouchableOpacity>
        </View>

      </ScrollView>

      {/* Modals */}
      <MuscleSelectionModal
        visible={showPrimaryModal}
        onClose={() => setShowPrimaryModal(false)}
        title="PRIMARY MUSCLES"
        selectedMuscles={primaryMuscles}
        onSelect={(id) => {
          if (primaryMuscles.includes(id)) {
            setPrimaryMuscles(primaryMuscles.filter(m => m !== id));
          } else {
            setPrimaryMuscles([...primaryMuscles, id]);
          }
          setShowPrimaryModal(false); // Auto-close as requested
        }}
        multiple={true} // Allow multiple
      />

      <MuscleSelectionModal
        visible={showSecondaryModal}
        onClose={() => setShowSecondaryModal(false)}
        title="SECONDARY MUSCLES"
        selectedMuscles={secondaryMuscles}
        onSelect={(id) => {
          if (secondaryMuscles.includes(id)) {
            setSecondaryMuscles(secondaryMuscles.filter(m => m !== id));
          } else {
            setSecondaryMuscles([...secondaryMuscles, id]);
          }
          setShowSecondaryModal(false); // Auto-close as requested
        }}
        multiple={true} // Allow multiple
      />

      {/* Simple Category Select Modal - in a real app might use ActionSheet or Picker */}
      {showCategoryModal && (
        <View className="absolute inset-0 bg-black/60 justify-end z-50">
          <TouchableOpacity className="flex-1" onPress={() => setShowCategoryModal(false)} />
          <View className="bg-forge-surface rounded-t-3xl pt-6 pb-10 px-5">
            <View className="flex-row items-center justify-between mb-6">
              <Text className="text-white text-lg font-bold">Categoria</Text>
              <TouchableOpacity onPress={() => setShowCategoryModal(false)}>
                <X size={24} color="#5F6368" />
              </TouchableOpacity>
            </View>
            {CATEGORIES.map(cat => (
              <TouchableOpacity 
                key={cat} 
                className={`py-4 border-b border-forge-bg ${category === cat ? 'bg-forge-accent/10 px-4 rounded-xl border-b-0' : ''}`}
                onPress={() => {
                  setCategory(cat);
                  setShowCategoryModal(false);
                }}
              >
                <Text className={`text-base ${category === cat ? 'text-forge-accent font-bold' : 'text-white'}`}>
                  {cat}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

    </SafeAreaView>
  );
}
