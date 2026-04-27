import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  Image,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, FileText, ExternalLink, ChevronRight } from 'lucide-react-native';
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

interface SetRecord {
  weight: number;
  reps: number;
  rpe: number | null;
  set_order: number;
  is_completed: number;
  volume: number;
}

interface SessionHistory {
  date: string;
  sets: SetRecord[];
  isPersonalRecord: boolean;
}

const muscleImages: Record<string, string> = {
  'Peito': 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?q=80&w=600',
  'Costas': 'https://images.unsplash.com/photo-1603287681836-b174ce5074c2?q=80&w=600',
  'Pernas': 'https://images.unsplash.com/photo-1574680096145-d05b474e2155?q=80&w=600',
  'Ombros': 'https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?q=80&w=600',
  'Bíceps': 'https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?q=80&w=600',
  'Tríceps': 'https://images.unsplash.com/photo-1530822847156-5df684ec5ee1?q=80&w=600',
  'Abdômen': 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?q=80&w=600',
};

const muscleDetailImages: Record<string, string> = {
  'Peito': 'https://images.unsplash.com/photo-1579758629938-03607ccdbaba?q=80&w=300',
  'Costas': 'https://images.unsplash.com/photo-1603287681836-b174ce5074c2?q=80&w=300',
  'Pernas': 'https://images.unsplash.com/photo-1574680096145-d05b474e2155?q=80&w=300',
  'Ombros': 'https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?q=80&w=300',
  'Bíceps': 'https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?q=80&w=300',
  'Tríceps': 'https://images.unsplash.com/photo-1530822847156-5df684ec5ee1?q=80&w=300',
  'Abdômen': 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?q=80&w=300',
};

const mockHistory: SessionHistory[] = [
  {
    date: 'QUARTA-FEIRA, 21 DE JANEIRO',
    isPersonalRecord: true,
    sets: [
      { weight: 75, reps: 9, rpe: null, set_order: 1, is_completed: 1, volume: 675 },
      { weight: 75, reps: 8, rpe: null, set_order: 2, is_completed: 1, volume: 600 },
      { weight: 70, reps: 10, rpe: null, set_order: 3, is_completed: 1, volume: 700 },
    ],
  },
  {
    date: 'SEGUNDA-FEIRA, 19 DE JANEIRO',
    isPersonalRecord: false,
    sets: [
      { weight: 70, reps: 12, rpe: null, set_order: 1, is_completed: 1, volume: 840 },
      { weight: 70, reps: 10, rpe: null, set_order: 2, is_completed: 1, volume: 700 },
    ],
  },
];

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function ExerciseDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [exercise, setExercise] = useState<Exercise | null>(null);
  const [activeTab, setActiveTab] = useState<'resumo' | 'historico'>('resumo');

  useEffect(() => {
    if (id) {
      loadExercise(id);
    }
  }, [id]);

  const loadExercise = (exerciseId: string) => {
    try {
      const result = db.getFirstSync<Exercise>(
        'SELECT * FROM exercises WHERE id = ?',
        [exerciseId]
      );
      setExercise(result);
    } catch (error) {
      console.error('Error loading exercise:', error);
    }
  };

  if (!exercise) {
    return (
      <SafeAreaView className="flex-1 bg-forge-bg">
        <Text className="text-forge-muted text-base text-center mt-[100px]">Carregando...</Text>
      </SafeAreaView>
    );
  }

  const heroImage = exercise.image_uri || muscleImages[exercise.muscle_group] || muscleImages['Peito'];
  const muscleDetailImage = muscleDetailImages[exercise.muscle_group] || muscleDetailImages['Peito'];

  const exerciseType = exercise.equipment === 'Peso Corporal' ? 'CALISTENIA' : 'FORÇA';

  return (
    <SafeAreaView className="flex-1 bg-forge-bg" edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View className="bg-forge-surface-hover" style={{ width: SCREEN_WIDTH, height: 220 }}>
          <Image source={{ uri: heroImage }} className="w-full h-full opacity-50" />
          <View className="absolute inset-0" style={{ backgroundColor: 'rgba(22,24,28,0.3)' }} />
          <TouchableOpacity
            className="absolute top-3 left-4 w-10 h-10 rounded-xl justify-center items-center"
            style={{ backgroundColor: 'rgba(28,30,38,0.8)' }}
            onPress={() => router.back()}
          >
            <ArrowLeft size={22} color="#FFF" />
          </TouchableOpacity>
        </View>

        <View className="flex-row px-5 border-b border-forge-border mb-5">
          <TouchableOpacity
            className={`py-4 mr-6 ${activeTab === 'resumo' ? 'border-b-2 border-white' : ''}`}
            onPress={() => setActiveTab('resumo')}
          >
            <Text className={`text-[13px] font-bold tracking-wide ${activeTab === 'resumo' ? 'text-white' : 'text-forge-muted-dark'}`}>
              RESUMO
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            className={`py-4 mr-6 ${activeTab === 'historico' ? 'border-b-2 border-white' : ''}`}
            onPress={() => setActiveTab('historico')}
          >
            <Text className={`text-[13px] font-bold tracking-wide ${activeTab === 'historico' ? 'text-white' : 'text-forge-muted-dark'}`}>
              HISTÓRICO
            </Text>
          </TouchableOpacity>
        </View>

        <View className="px-5">
          {activeTab === 'resumo' ? (
            <>
              <Text className="text-white text-[26px] font-black mb-2 leading-8">
                {exercise.name.toUpperCase()}
              </Text>
              <View className="flex-row items-center gap-2 mb-6">
                <Text className="text-forge-accent text-[11px] font-bold tracking-wide">{exerciseType}</Text>
                <Text className="text-forge-muted-dark text-sm">·</Text>
                <Text className="text-forge-accent text-[11px] font-bold tracking-wide">{exercise.equipment?.toUpperCase()}</Text>
              </View>

              <Text className="text-forge-muted text-[11px] font-bold tracking-wide mb-2">INSTRUÇÕES</Text>
              <Text className="text-forge-text-secondary text-sm leading-[22px] mb-6">
                {exercise.instructions || 'Nenhuma instrução disponível para este exercício.'}
              </Text>

              <View className="bg-forge-surface rounded-2xl p-4 mb-3">
                <Text className="text-forge-muted text-[10px] font-bold tracking-wide mb-3">MÚSCULOS PRIMÁRIOS</Text>
                <View className="flex-row items-center gap-4">
                  <Image source={{ uri: muscleDetailImage }} className="w-[60px] h-[60px] rounded-xl bg-forge-border" />
                  <View>
                    <Text className="text-white text-lg font-extrabold mb-0.5">{exercise.muscle_group}</Text>
                    <Text className="text-forge-muted-dark text-[11px] font-semibold">Grupo principal</Text>
                  </View>
                </View>
              </View>

              <View className="bg-forge-surface rounded-2xl p-4 mb-4">
                <Text className="text-forge-muted text-[10px] font-bold tracking-wide mb-2">VOLUME SEMANAL</Text>
                <View className="flex-row items-baseline gap-1.5 mb-3">
                  <Text className="text-white text-[36px] font-black">12</Text>
                  <Text className="text-forge-muted text-sm font-semibold">Séries</Text>
                </View>
                <View className="h-1 bg-forge-border-light rounded-sm">
                  <View className="h-1 w-[70%] bg-forge-orange rounded-sm" />
                </View>
              </View>

              <TouchableOpacity className="flex-row items-center py-4 gap-3 border-b border-forge-border">
                <FileText size={18} color="#A0C4FF" />
                <Text className="text-white text-sm font-semibold">Visualizar notas</Text>
                <ChevronRight size={18} color="#5F6368" style={{ marginLeft: 'auto' }} />
              </TouchableOpacity>

              <TouchableOpacity className="flex-row items-center py-4 gap-3 border-b border-forge-border">
                <ExternalLink size={18} color="#A0C4FF" />
                <Text className="text-white text-sm font-semibold">Visualizar no YouTube</Text>
                <ExternalLink size={14} color="#5F6368" style={{ marginLeft: 'auto' }} />
              </TouchableOpacity>
            </>
          ) : (
            <>
              <Text className="text-forge-muted text-[11px] font-bold tracking-wide mb-1">HISTÓRICO DO EXERCÍCIO</Text>
              <Text className="text-white text-2xl font-black mb-6">{exercise.name}</Text>

              {mockHistory.map((session, sIdx) => (
                <View key={sIdx} className="mb-6">
                  <View className="flex-row justify-between items-center mb-3">
                    <Text className="text-white text-[13px] font-extrabold tracking-tight flex-1">{session.date}</Text>
                    {session.isPersonalRecord && (
                      <View className="bg-forge-green-bg px-3 py-1.5 rounded-lg">
                        <Text className="text-forge-green text-[9px] font-extrabold tracking-tight text-center">NOVO RECORDE{'\n'}PESSOAL</Text>
                      </View>
                    )}
                  </View>

                  {session.sets.map((set, setIdx) => (
                    <View key={setIdx} className="bg-forge-surface rounded-xl p-4 mb-2 flex-row items-center flex-wrap">
                      <View className="w-8 h-8 rounded-2xl bg-forge-border-light justify-center items-center mr-4">
                        <Text className="text-white text-sm font-extrabold">{set.set_order}</Text>
                      </View>
                      <View className="flex-1 flex-row items-baseline gap-2">
                        <Text className="text-white text-[22px] font-black">{set.weight}</Text>
                        <Text className="text-forge-muted text-[13px] font-semibold"> kg</Text>
                        <Text className="text-forge-muted-dark text-lg font-semibold">×</Text>
                        <Text className="text-white text-[22px] font-black">{set.reps}</Text>
                        <Text className="text-forge-muted text-[13px] font-semibold"> reps</Text>
                      </View>
                      {set.volume > 0 && (
                        <Text className="text-forge-muted-dark text-[9px] font-bold tracking-tight mt-1 w-full pl-12">VOLUME: {set.volume} KG</Text>
                      )}
                    </View>
                  ))}
                </View>
              ))}

              <View className="bg-forge-surface rounded-2xl p-5">
                <Text className="text-forge-muted text-[10px] font-bold tracking-wide mb-2">TENDÊNCIA MENSAL</Text>
                <Text className="text-white text-xl font-extrabold mb-2">Progresso de Carga</Text>
                <Text className="text-forge-text-secondary text-[13px] leading-5">
                  Sua força no {exercise.name} aumentou 8% nas últimas 4 semanas.
                </Text>
              </View>
            </>
          )}

          <View className="h-10" />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
