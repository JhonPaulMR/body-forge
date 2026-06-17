import { MediaCarousel } from '@/components/exercises/MediaCarousel';
import { toTitleCase } from '@/utils/stringUtils';
import { MediaOptionsMenu } from '@/components/exercises/MediaOptionsMenu';
import { MuscleCard } from '@/components/exercises/MuscleCard';
import { getMuscleById } from '@/components/exercises/MuscleSelectionModal';
import { muscleImages, muscleStringMap } from '@/constants/muscleImages';
import { ExerciseMediaRepository, ExerciseMedia } from '@/database/repositories/ExerciseMediaRepository';
import { Exercise, getExerciseById, getExerciseStats, ExerciseStats } from '@/services/exerciseService';
import { ExerciseNotesModal } from '@/components/exercises/ExerciseNotesModal';
import { ExerciseOptionsMenu } from '@/components/exercises/ExerciseOptionsMenu';
import { useSettingsStore } from '@/hooks/useSettingsStore';
import { getDisplayWeight } from '@/utils/units';
import * as ImagePicker from 'expo-image-picker';
import { useLocalSearchParams, useRouter, useFocusEffect } from 'expo-router';
import { ArrowLeft, ChevronRight, FileText, TrendingUp, Minus, MoreVertical } from 'lucide-react-native';
import React, { useEffect, useState, useCallback } from 'react';
import {
  Modal,
  Pressable,
  Dimensions,
  Alert,
  ScrollView,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';



const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function ExerciseDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const [exercise, setExercise] = useState<Exercise | null>(null);
  const [stats, setStats] = useState<ExerciseStats>({ weeklyVolume: 0, history: [], trendMessage: '', trendDirection: 'neutral' });
  const [activeTab, setActiveTab] = useState<'resumo' | 'historico'>('resumo');
  const [isNotesVisible, setIsNotesVisible] = useState(false);
  const weightUnit = useSettingsStore(state => state.weightUnit);

  // Media states
  const [exerciseMedia, setExerciseMedia] = useState<ExerciseMedia[]>([]);
  const [isMenuVisible, setIsMenuVisible] = useState(false);
  const [selectedMedia, setSelectedMedia] = useState<ExerciseMedia | null>(null);

  // Exercise options state
  const [isExerciseMenuVisible, setIsExerciseMenuVisible] = useState(false);

  const loadMedia = () => {
    if (id) {
      const media = ExerciseMediaRepository.getMediaForExercise(id as string);
      setExerciseMedia(media);
    }
  };

  const requestMediaPermission = async (): Promise<boolean> => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permissão necessária', 'Permita o acesso à galeria para adicionar mídia.');
      return false;
    }
    return true;
  };

  const pickMedia = async (
    mode: 'all' | 'image' | 'video'
  ): Promise<{ uri: string; type: 'image' | 'video'; fileName?: string | null } | null> => {
    const hasPermission = await requestMediaPermission();
    if (!hasPermission) return null;

    const mediaTypes =
      mode === 'image'
        ? ImagePicker.MediaTypeOptions.Images
        : mode === 'video'
        ? ImagePicker.MediaTypeOptions.Videos
        : ImagePicker.MediaTypeOptions.All;

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes,
      quality: mode === 'image' ? 0.9 : 1,
      allowsEditing: true,
      aspect: [16, 9],
      videoMaxDuration: 60,
    });

    const asset = result.canceled ? null : result.assets?.[0];
    if (!asset?.uri || !asset.type) return null;
    if (asset.type !== 'image' && asset.type !== 'video') return null;

    return { uri: asset.uri, type: asset.type, fileName: asset.fileName };
  };

  const handleAddMedia = async () => {
    if (!exercise) return;
    const media = await pickMedia('all');
    if (!media) return;
    await ExerciseMediaRepository.addMedia(exercise.id, {
      uri: media.uri,
      type: media.type === 'video' ? 'video' : 'image',
      fileName: media.fileName
    });
    loadMedia();
  };

  const handleReplaceMedia = async () => {
    if (!selectedMedia) return;
    const mediaResult = await pickMedia(selectedMedia.media_type);
    if (mediaResult) {
      await ExerciseMediaRepository.replaceMedia(selectedMedia.id, mediaResult.uri, mediaResult.fileName);
      loadMedia();
    }
  };

  const handleDeleteMedia = async () => {
    if (!selectedMedia) return;
    await ExerciseMediaRepository.deleteMedia(selectedMedia.id);
    setSelectedMedia(null);
    loadMedia();
  };

  const handleDeleteExercise = () => {
    if (!exercise) return;
    try {
      // Import on demand to avoid circular deps or heavy init
      const { ExerciseRepository } = require('@/database/repositories/ExerciseRepository');
      ExerciseRepository.deleteCustomExercise(exercise.id);
      router.back();
    } catch (e) {
      console.error('Error deleting exercise:', e);
    }
  };

  useFocusEffect(
    useCallback(() => {
      if (id) {
        const result = getExerciseById(id as string);
        setExercise(result);
        const exStats = getExerciseStats(id as string);
        setStats(exStats);
        loadMedia();
      }
    }, [id])
  );

  if (!exercise) {
    return (
      <SafeAreaView className="flex-1 bg-forge-bg">
        <Text className="text-forge-muted text-base text-center mt-[100px]">Carregando...</Text>
      </SafeAreaView>
    );
  }

  const heroImage = exercise.gif_url || exercise.image_uri || muscleImages[exercise.muscle_group] || muscleImages['Peito'];
  const exerciseType = exercise.equipment === 'Peso Corporal' ? 'CALISTENIA' : 'FORÇA';

  let parsedMuscleData: { primary: string[], secondary: string[], primaryString: string } | null = null;
  try { parsedMuscleData = JSON.parse(exercise.muscle_group); } catch (e) {}

  const primaryIds = parsedMuscleData ? parsedMuscleData.primary : [];
  const secondaryIds = parsedMuscleData ? parsedMuscleData.secondary : [];
  let derivedPrimary = exercise.body_part || exercise.muscle_group;
  let derivedSecondary = exercise.target;

  if (
    derivedPrimary &&
    (derivedPrimary.toLowerCase() === 'braços' || derivedPrimary.toLowerCase() === 'pernas') &&
    derivedSecondary
  ) {
    derivedPrimary = derivedSecondary;
    derivedSecondary = undefined;
  }

  const primaryDisplayString = parsedMuscleData ? parsedMuscleData.primaryString : derivedPrimary;

  // Build body highlighter data
  const bodyData: any[] = [];
  let mainSide: 'front' | 'back' = 'front';
  
  let hasValidParsedData = false;

  if (parsedMuscleData && parsedMuscleData.primary.length > 0) {
    hasValidParsedData = true;
    primaryIds.forEach(mId => {
      const muscle = getMuscleById(mId);
      if (muscle && muscle.slug) {
        bodyData.push({ slug: muscle.slug, intensity: 1 });
        mainSide = muscle.side;
      }
    });
    secondaryIds.forEach(mId => {
      const muscle = getMuscleById(mId);
      if (muscle && muscle.slug) {
        bodyData.push({ slug: muscle.slug, intensity: 2 });
      }
    });
  } else {
    const mapped = muscleStringMap[primaryDisplayString];
    if (mapped) {
      bodyData.push({ slug: mapped.slug, intensity: 1 });
      mainSide = mapped.side;
    }
  }

  const parseInstructions = (text: string | null) => {
    if (!text) return 'Nenhuma instrução disponível para este exercício.';
    try {
      const parsed = JSON.parse(text);
      if (Array.isArray(parsed)) {
        return parsed.map((step, idx) => `${idx + 1}. ${step}`).join('\n\n');
      }
    } catch (e) {}
    return text;
  };

  return (
    <SafeAreaView className="flex-1 bg-forge-bg" edges={['top']}>
      <ScrollView 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: Math.max(insets.bottom, 24) }}
      >
        <View className="relative">
          <MediaCarousel
            heroImageUri={heroImage}
            exerciseMedia={exerciseMedia}
            onMenuPress={(item) => {
              if (item.type === 'hero') {
                setSelectedMedia(null);
              } else {
                const current = exerciseMedia.find(media => media.id === item.mediaId) || null;
                setSelectedMedia(current);
              }
              setIsMenuVisible(true);
            }}
          />
          <TouchableOpacity
            className="absolute top-3 left-4 w-10 h-10 rounded-xl justify-center items-center"
            style={{ backgroundColor: 'rgba(28,30,38,0.8)', zIndex: 10 }}
            onPress={() => router.back()}
          >
            <ArrowLeft size={22} color="#FFF" />
          </TouchableOpacity>
        </View>

        {/* Tabs */}
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
              <View className="flex-row items-start justify-between mb-2">
                <Text className="text-white text-[26px] font-black leading-8 flex-1">
                  {toTitleCase(exercise.name).toUpperCase()}
                </Text>
                {exercise.is_custom === 1 && (
                  <TouchableOpacity onPress={() => setIsExerciseMenuVisible(true)} className="w-10 h-10 items-center justify-end flex-row">
                    <MoreVertical size={24} color="#FFF" />
                  </TouchableOpacity>
                )}
              </View>
              <View className="flex-row items-center gap-2 mb-6">
                <Text className="text-forge-accent text-[11px] font-bold tracking-wide">{exerciseType}</Text>
                <Text className="text-forge-muted-dark text-sm">·</Text>
                <Text className="text-forge-accent text-[11px] font-bold tracking-wide">{exercise.equipment?.toUpperCase()}</Text>
              </View>

              <Text className="text-forge-muted text-[11px] font-bold tracking-wide mb-2">INSTRUÇÕES</Text>
              <Text className="text-forge-text-secondary text-sm leading-[22px] mb-6">
                {parseInstructions(exercise.instructions)}
              </Text>

              {/* Músculos Primários */}
              <Text className="text-forge-muted text-[11px] font-bold tracking-wide mb-3 mt-2">MÚSCULOS PRIMÁRIOS</Text>
              {hasValidParsedData 
                ? primaryIds.map((muscleId: string) => <MuscleCard key={muscleId} muscleId={muscleId} stringFallback={null} type="primary" />)
                : <MuscleCard muscleId={null} stringFallback={derivedPrimary} type="primary" />
              }

              {/* Músculos Secundários */}
              {(hasValidParsedData ? secondaryIds.length > 0 : (!!derivedSecondary && derivedSecondary.toLowerCase() !== derivedPrimary?.toLowerCase())) && (
                <>
                  <Text className="text-forge-muted text-[11px] font-bold tracking-wide mb-3 mt-2">MÚSCULOS SECUNDÁRIOS</Text>
                  {hasValidParsedData 
                    ? secondaryIds.map((muscleId: string) => <MuscleCard key={muscleId} muscleId={muscleId} stringFallback={null} type="secondary" />)
                    : <MuscleCard muscleId={null} stringFallback={derivedSecondary!} type="secondary" />
                  }
                </>
              )}

              <View className="bg-forge-surface rounded-2xl p-4 mb-4">
                <Text className="text-forge-muted text-[10px] font-bold tracking-wide mb-2">VOLUME SEMANAL</Text>
                <View className="flex-row items-baseline gap-1.5 mb-3">
                  <Text className="text-white text-[36px] font-black">{stats.weeklyVolume}</Text>
                  <Text className="text-forge-muted text-sm font-semibold">Séries</Text>
                </View>
                <View className="h-1 bg-forge-border-light rounded-sm overflow-hidden">
                  <View 
                    className="h-1 bg-forge-orange rounded-sm" 
                    style={{ width: `${Math.min((stats.weeklyVolume / 12) * 100, 100)}%` }}
                  />
                </View>
              </View>

              <TouchableOpacity 
                className="flex-row items-center py-4 gap-3 border-b border-forge-border"
                onPress={() => setIsNotesVisible(true)}
              >
                <FileText size={18} color="#A0C4FF" />
                <Text className="text-white text-sm font-semibold">Visualizar notas</Text>
                <ChevronRight size={18} color="#5F6368" style={{ marginLeft: 'auto' }} />
              </TouchableOpacity>

            </>
          ) : (
            <>
              <Text className="text-forge-muted text-[11px] font-bold tracking-wide mb-1">HISTÓRICO DO EXERCÍCIO</Text>
              <Text className="text-white text-2xl font-black mb-6">{toTitleCase(exercise.name)}</Text>

              {stats.history.length === 0 ? (
                <Text className="text-forge-muted text-center mt-8 mb-8">Nenhum histórico encontrado para este exercício.</Text>
              ) : (
                stats.history.map((session, sIdx) => (
                  <View key={sIdx} className="mb-6">
                    <View className="flex-row justify-between items-center mb-3">
                      <Text className="text-white text-[13px] font-extrabold tracking-tight flex-1">{session.date}</Text>
                      {!!session.isPersonalRecord && (
                        <View className="bg-forge-green-bg px-3 py-1.5 rounded-lg">
                          <Text className="text-forge-green text-[9px] font-extrabold tracking-tight text-center">NOVO RECORDE{'\n'}PESSOAL</Text>
                        </View>
                      )}
                    </View>

                    {session.sets.map((set, setIdx) => {
                      const volume = (set.weight || 0) * (set.reps || 0);
                      return (
                        <View key={setIdx} className={`bg-forge-surface rounded-xl p-4 mb-2 flex-row items-center flex-wrap ${set.is_dropset ? 'opacity-80 ml-4' : ''}`}>
                          <View className={`w-8 h-8 rounded-2xl ${set.is_warmup ? 'bg-[#F59E0B]/20' : 'bg-forge-border-light'} justify-center items-center mr-4`}>
                            <Text className={`text-sm font-extrabold ${set.is_warmup ? 'text-[#F59E0B]' : 'text-white'}`}>{setIdx + 1}</Text>
                          </View>
                          <View className="flex-1 flex-row items-baseline gap-2">
                            <Text className="text-white text-[22px] font-black">{getDisplayWeight(set.weight || 0, weightUnit)}</Text>
                            <Text className="text-forge-muted text-[13px] font-semibold"> {weightUnit}</Text>
                            <Text className="text-forge-muted-dark text-lg font-semibold">×</Text>
                            <Text className="text-white text-[22px] font-black">{set.reps || 0}</Text>
                            <Text className="text-forge-muted text-[13px] font-semibold"> reps</Text>
                          </View>
                          {!!set.is_to_failure && (
                            <Text className="text-[#EF4444] font-bold text-[10px] ml-2 uppercase">Falha</Text>
                          )}
                          {volume > 0 && (
                            <Text className="text-forge-muted-dark text-[9px] font-bold tracking-tight mt-1 w-full pl-12">VOLUME: {getDisplayWeight(volume, weightUnit)} {weightUnit.toUpperCase()}</Text>
                          )}
                        </View>
                      );
                    })}
                  </View>
                ))
              )}

              <View className="bg-forge-surface rounded-2xl p-5">
                <View className="flex-row items-center gap-2 mb-2">
                  <Text className="text-forge-muted text-[10px] font-bold tracking-wide">TENDÊNCIA</Text>
                  {stats.trendDirection === 'up' && <TrendingUp size={14} color="#10B981" />}
                  {stats.trendDirection === 'down' && (
                    <View style={{ transform: [{ scaleY: -1 }] }}>
                      <TrendingUp size={14} color="#EF4444" />
                    </View>
                  )}
                  {stats.trendDirection === 'neutral' && <Minus size={14} color="#8A8F98" />}
                </View>
                <Text className="text-white text-xl font-extrabold mb-2">Progresso de Carga</Text>
                <Text className="text-forge-text-secondary text-[13px] leading-5">
                  {stats.trendMessage}
                </Text>
              </View>
            </>
          )}

          <View className="h-10" />
        </View>
      </ScrollView>

      {/* Modals */}
      <MediaOptionsMenu
        visible={isMenuVisible}
        onClose={() => setIsMenuVisible(false)}
        onAddMedia={() => {
          setIsMenuVisible(false);
          handleAddMedia();
        }}
        canReplace={!!selectedMedia}
        onReplaceMedia={() => {
          setIsMenuVisible(false);
          handleReplaceMedia();
        }}
        canDelete={!!selectedMedia}
        onDelete={() => {
          setIsMenuVisible(false);
          handleDeleteMedia();
        }}
      />

      {exercise && (
        <ExerciseNotesModal
          exerciseId={exercise.id}
          exerciseName={exercise.name}
          visible={isNotesVisible}
          onClose={() => setIsNotesVisible(false)}
        />
      )}

      {/* Exercise Options Modal */}
      {exercise && exercise.is_custom === 1 && (
        <ExerciseOptionsMenu
          visible={isExerciseMenuVisible}
          onClose={() => setIsExerciseMenuVisible(false)}
          exerciseId={exercise.id}
          exerciseName={exercise.name}
          onDelete={() => {
            setIsExerciseMenuVisible(false);
            handleDeleteExercise();
          }}
        />
      )}
    </SafeAreaView>
  );
}
