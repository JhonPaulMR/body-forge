import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Dimensions,
  Alert,
  Image,
  Modal,
  Pressable,
} from 'react-native';
import { FlatList as GHFlatList } from 'react-native-gesture-handler';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams, useFocusEffect } from 'expo-router';
import { X, Plus, Dumbbell, Camera, MoreVertical, Copy, Trash2 } from 'lucide-react-native';

// Imported components
import CoverImagePickerModal from '@/components/planner/CoverImagePickerModal';
import { ExerciseMenu, SupersetMenu, DayMenu } from '@/components/planner/PlannerActionMenus';
import DayCard from '@/components/planner/DayCard';
import CreateSupersetModal from '@/components/planner/CreateSupersetModal';
import { RoutineRepository, RoutineDay, DayExercise, RenderItem } from '@/database/repositories/RoutineRepository';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = SCREEN_WIDTH - 40;
const CARD_MARGIN = 10;

export default function PlannerScreen() {
  const router = useRouter();
  const { routineId } = useLocalSearchParams<{ routineId?: string }>();

  const [planName, setPlanName] = useState('');
  const [description, setDescription] = useState('');
  const [coverImageUri, setCoverImageUri] = useState<string | null>(null);
  const [savedRoutineId, setSavedRoutineId] = useState<string | null>(routineId || null);
  const [isBuiltin, setIsBuiltin] = useState(false);
  const [days, setDays] = useState<RoutineDay[]>([]);
  const [dayExercises, setDayExercises] = useState<Record<string, DayExercise[]>>({});
  const [activeDayIndex, setActiveDayIndex] = useState(0);

  const [menuExercise, setMenuExercise] = useState<{ ex: DayExercise; dayId: string; inSuperset: boolean } | null>(null);
  const [menuDay, setMenuDay] = useState<RoutineDay | null>(null);
  const [menuSuperset, setMenuSuperset] = useState<{ supersetId: string; dayId: string } | null>(null);
  const [supersetPopup, setSupersetPopup] = useState<{ dayId: string } | null>(null);
  const [showCoverPicker, setShowCoverPicker] = useState(false);

  // Confirmation Modals
  const [showDuplicateConfirm, setShowDuplicateConfirm] = useState(false);
  const [showDeleteDayConfirm, setShowDeleteDayConfirm] = useState<string | null>(null);
  const [showDeleteSupersetConfirm, setShowDeleteSupersetConfirm] = useState<string | null>(null);

  const [isDragging, setIsDragging] = useState(false);
  const [cardAreaHeight, setCardAreaHeight] = useState(400);

  const scrollRef = useRef<GHFlatList>(null);
  const insets = useSafeAreaInsets();

  // ---- Data Loading ----

  useEffect(() => {
    if (routineId) {
      const routine = RoutineRepository.loadRoutineData(routineId);
      if (routine) {
        setPlanName(routine.name);
        setDescription(routine.description || '');
        setCoverImageUri(routine.cover_image_uri);
        setIsBuiltin(routine.is_builtin === 1);
      }
      refreshDays(routineId);
    }
  }, [routineId]);

  useFocusEffect(
    useCallback(() => {
      if (savedRoutineId) refreshDays(savedRoutineId);
    }, [savedRoutineId])
  );

  const refreshDays = (rId: string) => {
    const { days: d, exerciseMap } = RoutineRepository.loadDaysAndExercises(rId);
    setDays(d);
    setDayExercises(exerciseMap);
  };

  // ---- Ensure Routine Saved ----

  const ensureRoutineSaved = (): string | null => {
    const id = RoutineRepository.saveRoutine(savedRoutineId, planName, description, coverImageUri);
    if (id && !savedRoutineId) setSavedRoutineId(id);
    return id;
  };

  const handleSave = () => {
    if (!planName.trim()) { Alert.alert('Erro', 'Insira um nome para o plano.'); return; }
    ensureRoutineSaved();
    router.back();
  };

  const handleDuplicateRoutine = () => {
    setShowDuplicateConfirm(true);
  };

  // ---- Day Actions ----

  const handleAddDay = () => {
    const id = ensureRoutineSaved();
    if (!id) return;
    RoutineRepository.addDay(id);
    refreshDays(id);
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 200);
  };

  const handleAddExercises = (dayId: string) => {
    const id = ensureRoutineSaved();
    if (!id) return;
    router.push(`/planner/exercise-picker?dayId=${dayId}&routineId=${id}` as any);
  };

  const handleDuplicateDay = (day: RoutineDay) => {
    if (!savedRoutineId) return;
    RoutineRepository.duplicateDay(day, savedRoutineId, dayExercises[day.id] || []);
    refreshDays(savedRoutineId);
    setMenuDay(null);
  };

  const handleDeleteDay = (dayId: string) => {
    setShowDeleteDayConfirm(dayId);
  };

  // ---- Exercise Actions ----

  const handleDuplicateExercise = (ex: DayExercise, dayId: string) => {
    RoutineRepository.duplicateExercise(ex, dayId);
    if (savedRoutineId) refreshDays(savedRoutineId);
    setMenuExercise(null);
  };

  const handleDeleteExercise = (reId: string) => {
    RoutineRepository.deleteExercise(reId);
    if (savedRoutineId) refreshDays(savedRoutineId);
    setMenuExercise(null);
  };

  const handleRemoveFromSuperset = (ex: DayExercise) => {
    RoutineRepository.removeFromSuperset(ex.id);
    if (savedRoutineId) refreshDays(savedRoutineId);
    setMenuExercise(null);
  };

  // ---- Superset Actions ----

  const openSupersetPopup = (dayId: string) => { setSupersetPopup({ dayId }); setMenuExercise(null); };

  const saveSupersetFromPopup = (selections: string[]) => {
    if (!supersetPopup || selections.length < 2) return;
    RoutineRepository.createSuperset(supersetPopup.dayId, selections, dayExercises[supersetPopup.dayId] || []);
    if (savedRoutineId) refreshDays(savedRoutineId);
    setSupersetPopup(null);
  };

  const handleDissolveSuperset = (supersetId: string) => {
    RoutineRepository.dissolveSuperset(supersetId);
    if (savedRoutineId) refreshDays(savedRoutineId);
    setMenuSuperset(null);
  };

  const handleDeleteSuperset = (supersetId: string) => {
    setShowDeleteSupersetConfirm(supersetId);
  };

  // ---- Drag & Scroll ----

  const handleDragEnd = (data: RenderItem[], dayId: string) => {
    RoutineRepository.reorderExercises(data);
    if (savedRoutineId) refreshDays(savedRoutineId);
  };

  const onScroll = (event: any) => {
    const offset = event.nativeEvent.contentOffset.x;
    const index = Math.round(offset / (CARD_WIDTH + CARD_MARGIN * 2));
    if (index !== activeDayIndex && index >= 0 && index < days.length) setActiveDayIndex(index);
  };

  const renderDayCardComponent = ({ item: day }: { item: RoutineDay }) => (
    <DayCard
      day={day}
      exercises={dayExercises[day.id] || []}
      cardAreaHeight={cardAreaHeight}
      onMenuDay={isBuiltin ? undefined : setMenuDay}
      onAddExercises={isBuiltin ? undefined : handleAddExercises}
      onDragBegin={() => setIsDragging(true)}
      onDragEnd={(data) => { setIsDragging(false); handleDragEnd(data, day.id); }}
      onMenuExercise={isBuiltin ? undefined : (ex, dayId, inSuperset) => setMenuExercise({ ex, dayId, inSuperset })}
      onMenuSuperset={isBuiltin ? undefined : (supersetId, dayId) => setMenuSuperset({ supersetId, dayId })}
      onDayUpdated={(dayId) => {
        if (savedRoutineId) refreshDays(savedRoutineId);
      }}
      isReadOnly={isBuiltin}
    />
  );

  return (
    <SafeAreaView className="flex-1 bg-forge-bg" edges={['top']}>
      {/* Header */}
      <View className="flex-row items-center justify-between px-5 py-3">
        <TouchableOpacity onPress={() => router.back()} className="w-9 h-9 rounded-xl bg-forge-surface justify-center items-center">
          <X size={20} color="#FFF" />
        </TouchableOpacity>
        <Text className="text-white text-base font-extrabold tracking-wide">
          {isBuiltin ? 'VISUALIZAR PLANO' : 'CONSTRUIR PLANO'}
        </Text>
        {isBuiltin ? (
          <TouchableOpacity onPress={handleDuplicateRoutine}>
            <MoreVertical size={24} color="#FFF" />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity onPress={handleSave}>
            <Text className="text-forge-accent text-sm font-extrabold tracking-tight">SALVAR</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Cover Image (compact) */}
      <View className="h-[100px] mx-5 rounded-[16px] bg-forge-surface-hover mb-3 justify-center items-center overflow-hidden">
        {coverImageUri ? (
          <Image source={{ uri: coverImageUri }} className="w-full h-full absolute opacity-60" />
        ) : (
          <View className="w-12 h-12 rounded-full bg-forge-border/50 justify-center items-center">
            <Dumbbell size={24} color="#5F6368" />
          </View>
        )}
        {!isBuiltin && (
          <TouchableOpacity
            className="absolute bottom-2 right-2 w-8 h-8 rounded-full bg-forge-surface justify-center items-center"
            onPress={() => setShowCoverPicker(true)}
          >
            <Camera size={16} color="#A0C4FF" />
          </TouchableOpacity>
        )}
      </View>

      {/* Name */}
      <View className="px-5 mb-3">
        {isBuiltin ? (
          <View>
            <Text className="text-white text-2xl font-black mb-2">{planName}</Text>
            {description ? (
              <Text className="text-forge-muted text-sm leading-5">{description}</Text>
            ) : null}
          </View>
        ) : (
          <>
            <Text className="text-forge-muted text-[10px] font-bold tracking-widest mb-1">NOME *</Text>
            <TextInput
              className="border-b border-forge-border pb-2 text-white text-lg font-bold"
              placeholder="Meu Plano de Treino"
              placeholderTextColor="#5F6368"
              value={planName}
              onChangeText={setPlanName}
            />
          </>
        )}
      </View>

      {/* Day Cards Area */}
      {days.length > 0 ? (
        <View className="flex-1" onLayout={(e) => setCardAreaHeight(e.nativeEvent.layout.height - 50)}>
          <GHFlatList
            ref={scrollRef}
            data={days}
            keyExtractor={(item) => item.id}
            horizontal
            pagingEnabled={false}
            snapToInterval={CARD_WIDTH + CARD_MARGIN * 2}
            snapToAlignment="center"
            decelerationRate="fast"
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 10 }}
            renderItem={renderDayCardComponent}
            onScroll={onScroll}
            scrollEventThrottle={16}
            scrollEnabled={!isDragging}
            style={{ flex: 1 }}
          />
          <View className="flex-row justify-center items-center mt-2 gap-1.5">
            {days.map((_, i) => (
              <View key={i} className={`h-2 rounded-full ${i === activeDayIndex ? 'bg-forge-accent w-5' : 'bg-forge-border w-2'}`} />
            ))}
          </View>
          <Text className="text-forge-muted-dark text-[10px] font-semibold tracking-wide text-center mt-1.5 mb-2">
            DESLIZE PARA VER OUTROS DIAS
          </Text>
        </View>
      ) : (
        <View className="flex-1 items-center justify-center px-5">
          <View className="w-20 h-20 rounded-2xl bg-forge-surface border border-dashed border-forge-border-light justify-center items-center mb-5">
            <Dumbbell size={32} color="#5F6368" />
          </View>
          <Text className="text-white text-lg font-extrabold mb-2">Seu plano está vazio</Text>
          <Text className="text-forge-muted text-[13px] text-center leading-5 px-8">
            Toque em + para adicionar um{'\n'}treino no seu plano
          </Text>
        </View>
      )}

      {/* FAB */}
      {!isBuiltin && (
        <TouchableOpacity
          className="absolute right-6 w-14 h-14 rounded-2xl bg-forge-accent justify-center items-center"
          style={{ elevation: 8, shadowColor: '#A0C4FF', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, bottom: Math.max(24, insets.bottom + 16) }}
          activeOpacity={0.8}
          onPress={handleAddDay}
        >
          <Plus size={24} color="#FFF" />
        </TouchableOpacity>
      )}

      <ExerciseMenu
        visible={!!menuExercise}
        onClose={() => setMenuExercise(null)}
        inSuperset={menuExercise?.inSuperset || false}
        onReplace={() => {
          if (menuExercise) {
            setMenuExercise(null);
            handleAddExercises(menuExercise.dayId);
          }
        }}
        onRemoveFromSuperset={() => menuExercise && handleRemoveFromSuperset(menuExercise.ex)}
        onCreateSuperset={() => menuExercise && openSupersetPopup(menuExercise.dayId)}
        onDuplicate={() => menuExercise && handleDuplicateExercise(menuExercise.ex, menuExercise.dayId)}
        onDelete={() => menuExercise && handleDeleteExercise(menuExercise.ex.id)}
      />

      <SupersetMenu
        visible={!!menuSuperset}
        onClose={() => setMenuSuperset(null)}
        onDissolve={() => menuSuperset && handleDissolveSuperset(menuSuperset.supersetId)}
        onDelete={() => menuSuperset && handleDeleteSuperset(menuSuperset.supersetId)}
      />

      <DayMenu
        visible={!!menuDay}
        onClose={() => setMenuDay(null)}
        onDuplicate={() => menuDay && handleDuplicateDay(menuDay)}
        onDelete={() => menuDay && handleDeleteDay(menuDay.id)}
      />

      <CreateSupersetModal
        visible={!!supersetPopup}
        onClose={() => setSupersetPopup(null)}
        dayExercises={supersetPopup ? (dayExercises[supersetPopup.dayId] || []) : []}
        onSaveSuperset={saveSupersetFromPopup}
      />

      <CoverImagePickerModal
        visible={showCoverPicker}
        onClose={() => setShowCoverPicker(false)}
        onSelectCover={setCoverImageUri}
      />

      {/* Confirmation Modals */}
      
      {/* Duplicate Routine Modal */}
      <Modal visible={showDuplicateConfirm} transparent animationType="fade">
        <Pressable className="flex-1 bg-black/60 justify-end" onPress={() => setShowDuplicateConfirm(false)}>
          <Pressable className="bg-forge-surface rounded-t-3xl px-5 pt-5 pb-10">
            <View className="items-center px-4 py-2">
              <View className="w-16 h-16 rounded-full bg-forge-accent/10 justify-center items-center mb-5">
                <Copy size={28} color="#A0C4FF" />
              </View>
              <Text className="text-white text-xl font-black mb-2 text-center">Duplicar Plano?</Text>
              <Text className="text-forge-muted text-sm text-center mb-8 leading-5">
                Deseja duplicar este plano para a sua biblioteca (Seus Planos)?
              </Text>
              
              <View className="flex-row gap-3 w-full">
                <TouchableOpacity 
                  className="flex-1 py-4 rounded-xl bg-forge-bg border border-forge-border items-center"
                  onPress={() => setShowDuplicateConfirm(false)}
                >
                  <Text className="text-white text-sm font-bold tracking-wide">CANCELAR</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  className="flex-1 py-4 rounded-xl bg-forge-accent items-center"
                  onPress={() => {
                    if (savedRoutineId) {
                      const newId = RoutineRepository.duplicateRoutine(savedRoutineId);
                      router.replace({ pathname: '/planner', params: { routineId: newId } } as any);
                    }
                    setShowDuplicateConfirm(false);
                  }}
                >
                  <Text className="text-forge-bg text-sm font-bold tracking-wide">DUPLICAR</Text>
                </TouchableOpacity>
              </View>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      {/* Delete Day Modal */}
      <Modal visible={!!showDeleteDayConfirm} transparent animationType="fade">
        <Pressable className="flex-1 bg-black/60 justify-end" onPress={() => setShowDeleteDayConfirm(null)}>
          <Pressable className="bg-forge-surface rounded-t-3xl px-5 pt-5 pb-10">
            <View className="items-center px-4 py-2">
              <View className="w-16 h-16 rounded-full bg-red-500/10 justify-center items-center mb-5">
                <Trash2 size={28} color="#EF4444" />
              </View>
              <Text className="text-white text-xl font-black mb-2 text-center">Excluir Dia?</Text>
              <Text className="text-forge-muted text-sm text-center mb-8 leading-5">
                Deseja excluir este dia e todos os seus exercícios permanentemente?
              </Text>
              
              <View className="flex-row gap-3 w-full">
                <TouchableOpacity 
                  className="flex-1 py-4 rounded-xl bg-forge-bg border border-forge-border items-center"
                  onPress={() => setShowDeleteDayConfirm(null)}
                >
                  <Text className="text-white text-sm font-bold tracking-wide">CANCELAR</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  className="flex-1 py-4 rounded-xl bg-red-500 items-center"
                  onPress={() => {
                    if (showDeleteDayConfirm) {
                      RoutineRepository.deleteDay(showDeleteDayConfirm);
                      if (savedRoutineId) refreshDays(savedRoutineId);
                      setActiveDayIndex(Math.max(0, activeDayIndex - 1));
                      setMenuDay(null);
                    }
                    setShowDeleteDayConfirm(null);
                  }}
                >
                  <Text className="text-white text-sm font-bold tracking-wide">EXCLUIR</Text>
                </TouchableOpacity>
              </View>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      {/* Delete Superset Modal */}
      <Modal visible={!!showDeleteSupersetConfirm} transparent animationType="fade">
        <Pressable className="flex-1 bg-black/60 justify-end" onPress={() => setShowDeleteSupersetConfirm(null)}>
          <Pressable className="bg-forge-surface rounded-t-3xl px-5 pt-5 pb-10">
            <View className="items-center px-4 py-2">
              <View className="w-16 h-16 rounded-full bg-red-500/10 justify-center items-center mb-5">
                <Trash2 size={28} color="#EF4444" />
              </View>
              <Text className="text-white text-xl font-black mb-2 text-center">Excluir Superset?</Text>
              <Text className="text-forge-muted text-sm text-center mb-8 leading-5">
                Deseja excluir todos os exercícios deste superset permanentemente?
              </Text>
              
              <View className="flex-row gap-3 w-full">
                <TouchableOpacity 
                  className="flex-1 py-4 rounded-xl bg-forge-bg border border-forge-border items-center"
                  onPress={() => setShowDeleteSupersetConfirm(null)}
                >
                  <Text className="text-white text-sm font-bold tracking-wide">CANCELAR</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  className="flex-1 py-4 rounded-xl bg-red-500 items-center"
                  onPress={() => {
                    if (showDeleteSupersetConfirm) {
                      RoutineRepository.deleteSupersetExercises(showDeleteSupersetConfirm);
                      if (savedRoutineId) refreshDays(savedRoutineId);
                      setMenuSuperset(null);
                    }
                    setShowDeleteSupersetConfirm(null);
                  }}
                >
                  <Text className="text-white text-sm font-bold tracking-wide">EXCLUIR</Text>
                </TouchableOpacity>
              </View>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}
