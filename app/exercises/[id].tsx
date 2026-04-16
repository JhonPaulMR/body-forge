import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
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
      <SafeAreaView style={styles.container}>
        <Text style={styles.loadingText}>Carregando...</Text>
      </SafeAreaView>
    );
  }

  const heroImage = exercise.image_uri || muscleImages[exercise.muscle_group] || muscleImages['Peito'];
  const muscleDetailImage = muscleDetailImages[exercise.muscle_group] || muscleDetailImages['Peito'];

  const exerciseType = exercise.equipment === 'Peso Corporal' ? 'CALISTENIA' : 'FORÇA';

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.heroContainer}>
          <Image source={{ uri: heroImage }} style={styles.heroImage} />
          <View style={styles.heroOverlay} />
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <ArrowLeft size={22} color="#FFF" />
          </TouchableOpacity>
        </View>

        <View style={styles.tabsContainer}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'resumo' && styles.tabActive]}
            onPress={() => setActiveTab('resumo')}
          >
            <Text style={[styles.tabText, activeTab === 'resumo' && styles.tabTextActive]}>
              RESUMO
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'historico' && styles.tabActive]}
            onPress={() => setActiveTab('historico')}
          >
            <Text style={[styles.tabText, activeTab === 'historico' && styles.tabTextActive]}>
              HISTÓRICO
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.content}>
          {activeTab === 'resumo' ? (
            <>
              <Text style={styles.exerciseTitle}>
                {exercise.name.toUpperCase()}
              </Text>
              <View style={styles.tagsRow}>
                <Text style={styles.tag}>{exerciseType}</Text>
                <Text style={styles.tagSeparator}>·</Text>
                <Text style={styles.tag}>{exercise.equipment?.toUpperCase()}</Text>
              </View>

              <Text style={styles.instructionsLabel}>INSTRUÇÕES</Text>
              <Text style={styles.instructionsText}>
                {exercise.instructions || 'Nenhuma instrução disponível para este exercício.'}
              </Text>

              <View style={styles.musclesCard}>
                <Text style={styles.musclesCardTitle}>MÚSCULOS PRIMÁRIOS</Text>
                <View style={styles.musclesCardContent}>
                  <Image source={{ uri: muscleDetailImage }} style={styles.muscleImage} />
                  <View>
                    <Text style={styles.muscleName}>{exercise.muscle_group}</Text>
                    <Text style={styles.muscleSubtext}>Grupo principal</Text>
                  </View>
                </View>
              </View>

              <View style={styles.volumeCard}>
                <Text style={styles.volumeLabel}>VOLUME SEMANAL</Text>
                <View style={styles.volumeValue}>
                  <Text style={styles.volumeNumber}>12</Text>
                  <Text style={styles.volumeUnit}>Séries</Text>
                </View>
                <View style={styles.volumeBar}>
                  <View style={styles.volumeBarFill} />
                </View>
              </View>

              <TouchableOpacity style={styles.linkItem}>
                <FileText size={18} color="#A0C4FF" />
                <Text style={styles.linkText}>Visualizar notas</Text>
                <ChevronRight size={18} color="#5F6368" style={{ marginLeft: 'auto' }} />
              </TouchableOpacity>

              <TouchableOpacity style={styles.linkItem}>
                <ExternalLink size={18} color="#A0C4FF" />
                <Text style={styles.linkText}>Visualizar no YouTube</Text>
                <ExternalLink size={14} color="#5F6368" style={{ marginLeft: 'auto' }} />
              </TouchableOpacity>
            </>
          ) : (
            <>
              <Text style={styles.historyTitle}>HISTÓRICO DO EXERCÍCIO</Text>
              <Text style={styles.historyExerciseName}>{exercise.name}</Text>

              {mockHistory.map((session, sIdx) => (
                <View key={sIdx} style={styles.historySession}>
                  <View style={styles.historyDateRow}>
                    <Text style={styles.historyDate}>{session.date}</Text>
                    {session.isPersonalRecord && (
                      <View style={styles.prBadge}>
                        <Text style={styles.prBadgeText}>NOVO RECORDE{'\n'}PESSOAL</Text>
                      </View>
                    )}
                  </View>

                  {session.sets.map((set, setIdx) => (
                    <View key={setIdx} style={styles.setRow}>
                      <View style={styles.setNumber}>
                        <Text style={styles.setNumberText}>{set.set_order}</Text>
                      </View>
                      <View style={styles.setDetails}>
                        <Text style={styles.setWeight}>
                          <Text style={styles.setWeightBold}>{set.weight}</Text>
                          <Text style={styles.setWeightUnit}> kg</Text>
                        </Text>
                        <Text style={styles.setSeparator}>×</Text>
                        <Text style={styles.setWeight}>
                          <Text style={styles.setWeightBold}>{set.reps}</Text>
                          <Text style={styles.setWeightUnit}> reps</Text>
                        </Text>
                      </View>
                      {set.volume > 0 && (
                        <Text style={styles.setVolume}>VOLUME: {set.volume} KG</Text>
                      )}
                    </View>
                  ))}
                </View>
              ))}

              <View style={styles.trendCard}>
                <Text style={styles.trendLabel}>TENDÊNCIA MENSAL</Text>
                <Text style={styles.trendTitle}>Progresso de Carga</Text>
                <Text style={styles.trendDescription}>
                  Sua força no {exercise.name} aumentou 8% nas últimas 4 semanas.
                </Text>
              </View>
            </>
          )}

          <View style={{ height: 40 }} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#16181C',
  },
  loadingText: {
    color: '#888',
    fontSize: 16,
    textAlign: 'center',
    marginTop: 100,
  },
  heroContainer: {
    width: SCREEN_WIDTH,
    height: 220,
    backgroundColor: '#22242A',
  },
  heroImage: {
    width: '100%',
    height: '100%',
    opacity: 0.5,
  },
  heroOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(22,24,28,0.3)',
  },
  backButton: {
    position: 'absolute',
    top: 12,
    left: 16,
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(28,30,38,0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#2A2D35',
    marginBottom: 20,
  },
  tab: {
    paddingVertical: 16,
    marginRight: 24,
  },
  tabActive: {
    borderBottomWidth: 2,
    borderBottomColor: '#FFF',
  },
  tabText: {
    color: '#5F6368',
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 1,
  },
  tabTextActive: {
    color: '#FFF',
  },
  content: {
    paddingHorizontal: 20,
  },
  exerciseTitle: {
    color: '#FFF',
    fontSize: 26,
    fontWeight: '900',
    marginBottom: 8,
    lineHeight: 32,
  },
  tagsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 24,
  },
  tag: {
    color: '#A0C4FF',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
  },
  tagSeparator: {
    color: '#5F6368',
    fontSize: 14,
  },
  instructionsLabel: {
    color: '#888',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
    marginBottom: 8,
  },
  instructionsText: {
    color: '#CCC',
    fontSize: 14,
    lineHeight: 22,
    marginBottom: 24,
  },
  musclesCard: {
    backgroundColor: '#1C1E26',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  musclesCardTitle: {
    color: '#888',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1,
    marginBottom: 12,
  },
  musclesCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  muscleImage: {
    width: 60,
    height: 60,
    borderRadius: 12,
    backgroundColor: '#2A2D35',
  },
  muscleName: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 2,
  },
  muscleSubtext: {
    color: '#5F6368',
    fontSize: 11,
    fontWeight: '600',
  },
  volumeCard: {
    backgroundColor: '#1C1E26',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  volumeLabel: {
    color: '#888',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1,
    marginBottom: 8,
  },
  volumeValue: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 6,
    marginBottom: 12,
  },
  volumeNumber: {
    color: '#FFF',
    fontSize: 36,
    fontWeight: '900',
  },
  volumeUnit: {
    color: '#888',
    fontSize: 14,
    fontWeight: '600',
  },
  volumeBar: {
    height: 4,
    backgroundColor: '#353945',
    borderRadius: 2,
  },
  volumeBarFill: {
    height: 4,
    width: '70%',
    backgroundColor: '#FFA07A',
    borderRadius: 2,
  },
  linkItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#2A2D35',
  },
  linkText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '600',
  },
  historyTitle: {
    color: '#888',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
    marginBottom: 4,
  },
  historyExerciseName: {
    color: '#FFF',
    fontSize: 24,
    fontWeight: '900',
    marginBottom: 24,
  },
  historySession: {
    marginBottom: 24,
  },
  historyDateRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  historyDate: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.5,
    flex: 1,
  },
  prBadge: {
    backgroundColor: '#1A4D3A',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  prBadgeText: {
    color: '#4ADE80',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
    textAlign: 'center',
  },
  setRow: {
    backgroundColor: '#1C1E26',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  setNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#353945',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  setNumberText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '800',
  },
  setDetails: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 8,
  },
  setWeight: {
    flexDirection: 'row',
  },
  setWeightBold: {
    color: '#FFF',
    fontSize: 22,
    fontWeight: '900',
  },
  setWeightUnit: {
    color: '#888',
    fontSize: 13,
    fontWeight: '600',
  },
  setSeparator: {
    color: '#5F6368',
    fontSize: 18,
    fontWeight: '600',
  },
  setVolume: {
    color: '#5F6368',
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.5,
    marginTop: 4,
    width: '100%',
    paddingLeft: 48,
  },
  trendCard: {
    backgroundColor: '#1C1E26',
    borderRadius: 16,
    padding: 20,
  },
  trendLabel: {
    color: '#888',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1,
    marginBottom: 8,
  },
  trendTitle: {
    color: '#FFF',
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 8,
  },
  trendDescription: {
    color: '#CCC',
    fontSize: 13,
    lineHeight: 20,
  },
});
