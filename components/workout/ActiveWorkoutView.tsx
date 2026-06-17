import React, { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import { View, Text, TouchableOpacity, Dimensions, Alert, FlatList, Animated, BackHandler } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { Image } from 'expo-image';
import { toTitleCase } from '@/utils/stringUtils';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams, useFocusEffect } from 'expo-router';
import { ArrowLeft, Plus, MoreVertical, X } from 'lucide-react-native';
import { useWorkoutStore, WorkoutExercise } from '@/hooks/useWorkoutStore';
import { useNavbarStore } from '@/hooks/useNavbarStore';
import { SessionRepository } from '@/database/repositories/SessionRepository';
import { RoutineRepository } from '@/database/repositories/RoutineRepository';
import { SupersetPagerCard } from './SupersetPagerCard';
import { HistoryModal, NotesModal, CreateSupersetModal, ActionMenuModal } from './ActiveWorkoutModals';
import TimePadModal from '@/components/ui/TimePadModal';
import { WorkoutTimer } from './WorkoutTimer';
import { ActiveWorkoutHeader } from './ActiveWorkoutHeader';
import { useShallow } from 'zustand/react/shallow';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const formatTime = (seconds: number) => {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
};

export function ActiveWorkoutView() {
  const router = useRouter();
  const { dayId } = useLocalSearchParams<{ dayId: string }>();
  const setNavbarVisible = useNavbarStore(state => state.setVisible);
  const insets = useSafeAreaInsets();
  
  const { 
    isActive, exercises, restTimer,
    startWorkout, stopRestTimer, addRestTime
  } = useWorkoutStore(useShallow(state => ({
    isActive: state.isActive,
    exercises: state.exercises,
    restTimer: state.restTimer,
    startWorkout: state.startWorkout,
    stopRestTimer: state.stopRestTimer,
    addRestTime: state.addRestTime
  })));

  const [isLoading, setIsLoading] = useState(!isActive);
  const [activeExerciseIndex, setActiveExerciseIndex] = useState<number | null>(null);

  // Viewability config for instant dot updates
  const viewabilityConfig = useRef({ viewAreaCoveragePercentThreshold: 50 }).current;
  const onViewableItemsChanged = useCallback(({ viewableItems }: any) => {
    if (viewableItems.length > 0) {
      setActiveExerciseIndex(viewableItems[0].index);
    }
  }, []);

  // Modals state
  const [historyModal, setHistoryModal] = useState<{ exercise: WorkoutExercise } | null>(null);
  const [notesModal, setNotesModal] = useState<{ exercise: WorkoutExercise } | null>(null);
  const [restModal, setRestModal] = useState<{ exercise: WorkoutExercise } | null>(null);
  const [createSupersetModal, setCreateSupersetModal] = useState<{ exerciseId: string } | null>(null);

  // General list menu state
  const [actionMenu, setActionMenu] = useState<{
    options: { label: string; onPress: () => void; destructive?: boolean }[];
  } | null>(null);

  // Rest Timer Animation State
  const slideAnim = useRef(new Animated.Value(150)).current;
  const [localRestRemaining, setLocalRestRemaining] = useState(0);

  // Scroll direction tracking
  const lastScrollY = useRef(0);

  // Ocultar navbar SEMPRE que o treino estiver ativo (tanto na lista quanto no pager)
  useFocusEffect(
    useCallback(() => {
      if (isActive) {
        setNavbarVisible(false);
      }
      return () => setNavbarVisible(true);
    }, [isActive, setNavbarVisible])
  );

  // Também esconder quando entrar no pager (View B)
  useEffect(() => {
    if (activeExerciseIndex !== null) {
      setNavbarVisible(false);
    }
  }, [activeExerciseIndex, setNavbarVisible]);

  const handleScroll = (event: any) => {
    const { layoutMeasurement, contentOffset, contentSize } = event.nativeEvent;
    const currentY = contentOffset.y;
    const isAtBottom = layoutMeasurement.height + currentY >= contentSize.height - 40;
    const isScrollingUp = currentY < lastScrollY.current - 5;

    if (isAtBottom) {
      setNavbarVisible(true);
    } else if (isScrollingUp) {
      setNavbarVisible(false);
    }

    lastScrollY.current = currentY;
  };

  // Global Time Interval — uses getState() to avoid re-render subscription
  useEffect(() => {
    if (!isActive) return;
    const interval = setInterval(() => {
      useWorkoutStore.getState().incrementTime();
    }, 1000);
    return () => clearInterval(interval);
  }, [isActive]);

  // Local Rest Timer Interval & Animation
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (restTimer.isActive && restTimer.restEndTime) {
      Animated.timing(slideAnim, { toValue: 0, duration: 300, useNativeDriver: true }).start();
      
      interval = setInterval(() => {
        const remaining = Math.max(0, Math.ceil((restTimer.restEndTime! - Date.now()) / 1000));
        setLocalRestRemaining(remaining);
        if (remaining <= 0) {
          stopRestTimer();
        }
      }, 500);
    } else {
      Animated.timing(slideAnim, { toValue: 150, duration: 300, useNativeDriver: true }).start();
    }
    return () => clearInterval(interval);
  }, [restTimer.isActive, restTimer.restEndTime]);

  // Initialization
  useEffect(() => {
    if (isActive) {
      setIsLoading(false);
      return;
    }
    if (!dayId) return;

    try {
      const newSessionId = 'sess_' + Date.now().toString();
      SessionRepository.createSession(newSessionId, 'user_1', dayId);

      const exs = RoutineRepository.getDayExercises(dayId);

      const parsedExercises: WorkoutExercise[] = exs.map((ex) => {
        const previousSets = SessionRepository.getPreviousSetsForExercise(ex.exercise_id);

        const initialSets = [];
        const numSets = ex.target_sets || 1;
        let parsedConfigs: any[] = [];
        if (ex.set_configs) {
          try {
            parsedConfigs = JSON.parse(ex.set_configs);
          } catch (e) {
            console.warn('Failed to parse set_configs', e);
          }
        }

        for (let i = 0; i < numSets; i++) {
          const config = parsedConfigs[i] || {};
          initialSets.push({
            id: 'set_' + Math.random().toString(36).substring(2, 7),
            weight: previousSets[i]?.weight || 0,
            reps: previousSets[i]?.reps || 0,
            is_completed: false,
            is_warmup: !!config.warmup,
            is_dropset: !!config.dropSet,
            is_to_failure: !!config.untilFailure,
            dropset_group_id: config.dropSetGroupId,
          });
        }

        return {
          id: ex.id,
          exercise_id: ex.exercise_id,
          name: ex.name,
          muscle_group: ex.muscle_group,
          image_uri: ex.image_uri,
          target_sets: ex.target_sets,
          target_reps: ex.target_reps,
          rest_time_seconds: ex.rest_time_seconds || 60,
          superset_id: ex.superset_id,
          sets: initialSets,
          previous_sets: previousSets,
        };
      });

      startWorkout(newSessionId, dayId, parsedExercises);
      router.setParams({ dayId: '' });
      setIsLoading(false);

    } catch (error) {
      console.error('Error initializing workout:', error);
      Alert.alert('Erro', 'Não foi possível iniciar o treino.');
      router.back();
    }
  }, [dayId, isActive]);

  // Agrupar supersets — memoized
  const pagerBlocks = useMemo(() => {
    const blocks: WorkoutExercise[][] = [];
    exercises.forEach(ex => {
      if (ex.superset_id) {
        const lastBlock = blocks[blocks.length - 1];
        if (lastBlock && lastBlock[0].superset_id === ex.superset_id) {
          lastBlock.push(ex);
        } else {
          blocks.push([ex]);
        }
      } else {
        blocks.push([ex]);
      }
    });
    return blocks;
  }, [exercises]);

  // Memoized modal handlers
  const onOpenHistory = useCallback((ex: WorkoutExercise) => setHistoryModal({ exercise: ex }), []);
  const onOpenNotes = useCallback((ex: WorkoutExercise) => setNotesModal({ exercise: ex }), []);
  const onOpenRest = useCallback((ex: WorkoutExercise) => setRestModal({ exercise: ex }), []);

  const handleFinish = useCallback(() => {
    router.push(`/workout/summary`);
  }, [router]);

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-forge-bg justify-center items-center">
        <Text className="text-white">Carregando Treino...</Text>
      </SafeAreaView>
    );
  }

  // --- VIEW A: LISTAGEM GERAL DE EXERCÍCIOS ---
  if (activeExerciseIndex === null) {
    return (
      <SafeAreaView className="flex-1 bg-forge-bg" edges={['top']}>
        <ActiveWorkoutHeader onFinish={handleFinish} />

        <View className="flex-1">
          <FlashList 
            data={pagerBlocks}
            contentContainerStyle={{ paddingBottom: 100, padding: 16 }}
            onScroll={handleScroll}
            scrollEventThrottle={16}
            ListEmptyComponent={
              <View className="flex-1 items-center justify-center py-20 px-6">
                <Text className="text-forge-muted text-base font-medium text-center">
                  Nenhum exercício adicionado ainda
                </Text>
              </View>
            }
            renderItem={({ item: block, index: blockIndex }) => {
              const isSuperset = block.length > 1;
              return (
                <View className="mb-4">
                  {isSuperset && (
                    <View className="flex-row items-center justify-between mb-3 ml-2">
                      <Text className="text-forge-muted text-xs font-bold tracking-widest uppercase">
                        Superset • {block.length} Exercícios
                      </Text>
                      <TouchableOpacity 
                        className="p-2"
                        onPress={() => setActionMenu({
                          options: [
                            { 
                              label: 'Remover superset', 
                              onPress: () => {
                                const ssId = block[0].superset_id;
                                if (ssId) useWorkoutStore.getState().removeSuperset(ssId);
                              } 
                            },
                            { 
                              label: 'Excluir', 
                              destructive: true, 
                              onPress: () => {
                                block.forEach(e => useWorkoutStore.getState().removeExercise(e.id));
                              } 
                            }
                          ]
                        })}
                      >
                        <MoreVertical size={16} color="#8A8F98" />
                      </TouchableOpacity>
                    </View>
                  )}
                  
                  <View className={isSuperset ? "pl-3 border-l-2 border-[#A0C4FF]" : ""}>
                    {block.map((ex, exIndex) => {
                      const completedSets = ex.sets.filter(s => s.is_completed).length;
                      const globalIndex = exercises.findIndex(e => e.id === ex.id) + 1;

                      return (
                        <View 
                          key={ex.id}
                          className={`bg-forge-surface p-4 rounded-2xl flex-row items-center gap-4 ${isSuperset && exIndex > 0 ? 'mt-3' : ''}`}
                        >
                          <TouchableOpacity 
                            className="flex-row items-center gap-4 flex-1"
                            onPress={() => setActiveExerciseIndex(blockIndex)}
                          >
                            <View className="w-12 h-12 bg-forge-bg border border-forge-border rounded-xl items-center justify-center overflow-hidden">
                              {ex.image_uri ? (
                                <Image source={{ uri: ex.image_uri }} style={{ width: '100%', height: '100%' }} contentFit="cover" cachePolicy="disk" />
                              ) : (
                                <Text className="text-[#A0C4FF] font-bold">{globalIndex}</Text>
                              )}
                            </View>
                            <View className="flex-1 pr-2">
                              <Text className="text-white font-bold text-sm mb-1 leading-tight" numberOfLines={2}>
                                {toTitleCase(ex.name)}
                              </Text>
                              <Text className="text-forge-muted text-xs">
                                {completedSets}/{ex.sets.length} séries completas
                              </Text>
                            </View>
                          </TouchableOpacity>
                          <TouchableOpacity 
                            className="p-2" 
                            onPress={() => setActionMenu({
                              options: [
                                { label: 'Criar superset', onPress: () => setCreateSupersetModal({ exerciseId: ex.id }) },
                                { label: 'Substituir', onPress: () => router.push({ pathname: '/planner/exercise-picker', params: { dayId: dayId || '', mode: 'active', replaceId: ex.id } }) },
                                { label: 'Excluir', destructive: true, onPress: () => useWorkoutStore.getState().removeExercise(ex.id) }
                              ]
                            })}
                          >
                            <MoreVertical size={20} color="#8A8F98" />
                          </TouchableOpacity>
                        </View>
                      );
                    })}
                  </View>
                </View>
              );
            }}
          />
        </View>

        <View 
          className="p-4 bg-forge-bg border-t border-forge-border"
          style={{ paddingBottom: Math.max(insets.bottom, 16) }}
        >
          <TouchableOpacity 
            className="bg-[#A0C4FF] py-4 rounded-xl items-center justify-center"
            onPress={() => router.push({ pathname: '/planner/exercise-picker', params: { dayId: dayId || '', mode: 'active' } })}
          >
            <Text className="text-forge-bg font-black tracking-wide text-sm">Adicionar Exercícios</Text>
          </TouchableOpacity>
        </View>

        {/* Modais da view geral */}
        {createSupersetModal && (
          <CreateSupersetModal 
            visible={true}
            currentExerciseId={createSupersetModal.exerciseId}
            exercises={exercises}
            onClose={() => setCreateSupersetModal(null)}
            onSave={(ids: string[]) => useWorkoutStore.getState().createSuperset(ids)}
          />
        )}

        <ActionMenuModal 
          visible={!!actionMenu} 
          onClose={() => setActionMenu(null)} 
          options={actionMenu?.options || []} 
        />
      </SafeAreaView>
    );
  }

  // --- VIEW B: PAGER DOS EXERCÍCIOS ESPECÍFICOS ---
  return (
    <SafeAreaView className="flex-1 bg-forge-bg" edges={['top']}>
      {/* Cabeçalho do Pager */}
      <View className="px-4 pt-4 pb-4 border-b border-forge-border/30">
        <View className="flex-row items-center justify-between mb-2">
          <TouchableOpacity 
            className="p-2 bg-forge-surface border border-forge-border rounded-xl"
            onPress={() => setActiveExerciseIndex(null)}
          >
            <ArrowLeft size={20} color="#8A8F98" />
          </TouchableOpacity>
          <View className="items-center">
            <Text className="text-forge-muted text-[10px] font-bold tracking-widest mb-1 uppercase">Tempo de Treino</Text>
            <WorkoutTimer className="text-[#A0C4FF] text-[40px] font-black leading-none tracking-tight" />
          </View>
          <View className="w-10" />
        </View>
        
        {/* Dots */}
        <View className="flex-row justify-center gap-1.5 h-2">
          {pagerBlocks.map((_, i) => (
            <View 
              key={i} 
              className={`h-1.5 rounded-full ${i === activeExerciseIndex ? 'w-4 bg-[#A0C4FF]' : 'w-1.5 bg-forge-border'}`} 
            />
          ))}
        </View>
      </View>

      <FlatList
        data={pagerBlocks}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        initialScrollIndex={activeExerciseIndex}
        keyExtractor={(_, index) => `pager_block_${index}`}
        windowSize={3}
        maxToRenderPerBatch={2}
        getItemLayout={(data, index) => ({ length: SCREEN_WIDTH, offset: SCREEN_WIDTH * index, index })}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        renderItem={({ item }) => (
          <View style={{ width: SCREEN_WIDTH }} className="px-6 py-4">
            <SupersetPagerCard 
              block={item} 
              onOpenHistory={onOpenHistory}
              onOpenNotes={onOpenNotes}
              onOpenRest={onOpenRest}
            />
          </View>
        )}
      />

      {/* Popup de Descanso Animado (Sticky Bottom) */}
      <Animated.View 
        style={{ transform: [{ translateY: slideAnim }], bottom: Math.max(insets.bottom + 8, 24) }}
        className="absolute left-6 right-6 bg-forge-surface border border-forge-border rounded-2xl p-4 flex-row items-center justify-between shadow-lg"
      >
        <View className="flex-row items-center gap-3">
          <View className="w-12 h-12 rounded-full border-2 border-forge-accent items-center justify-center bg-forge-bg">
            <Text className="text-white font-bold text-xs">{localRestRemaining}s</Text>
          </View>
          <View>
            <Text className="text-white font-bold text-sm">DESCANSO ATIVO</Text>
            <Text className="text-forge-accent font-medium text-xs">
              {formatTime(restTimer.totalSeconds - localRestRemaining)} / {formatTime(restTimer.totalSeconds)}
            </Text>
          </View>
        </View>
        <View className="flex-row gap-2">
          <TouchableOpacity onPress={() => addRestTime(15)} className="p-2 bg-forge-surface-hover rounded-lg">
            <Plus size={16} color="#8A8F98" />
          </TouchableOpacity>
          <TouchableOpacity onPress={stopRestTimer} className="p-2 bg-[#EF4444]/20 rounded-lg">
            <X size={16} color="#EF4444" />
          </TouchableOpacity>
        </View>
      </Animated.View>

      {/* Modais */}
      <HistoryModal 
        exercise={historyModal?.exercise || null} 
        visible={!!historyModal} 
        onClose={() => setHistoryModal(null)} 
      />
      <NotesModal 
        exercise={notesModal?.exercise || null} 
        visible={!!notesModal} 
        onClose={() => setNotesModal(null)} 
      />
      <TimePadModal 
        visible={!!restModal} 
        initialSeconds={restModal?.exercise?.rest_time_seconds || 60}
        onConfirm={(secs) => {
          if (restModal?.exercise) {
            useWorkoutStore.getState().replaceExerciseInActive(restModal.exercise.id, {
              ...restModal.exercise,
              rest_time_seconds: secs
            });
          }
          setRestModal(null);
        }}
        onCancel={() => setRestModal(null)}
      />

      <ActionMenuModal 
        visible={!!actionMenu} 
        onClose={() => setActionMenu(null)} 
        options={actionMenu?.options || []} 
      />
    </SafeAreaView>
  );
}
