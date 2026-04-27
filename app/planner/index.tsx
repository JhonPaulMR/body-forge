import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Dimensions,
  Alert,
  FlatList,
  Modal,
  Pressable,
  Image,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { FlatList as GHFlatList } from 'react-native-gesture-handler';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams, useFocusEffect } from 'expo-router';
import { X, Plus, Dumbbell, Camera } from 'lucide-react-native';
import DraggableFlatList from 'react-native-draggable-flatlist';
import { db } from '@/database/schema';

// Imported components
import CoverImagePickerModal from '@/components/planner/CoverImagePickerModal';
import CreateSupersetModal from '@/components/planner/CreateSupersetModal';
import { ExerciseMenu, SupersetMenu, DayMenu } from '@/components/planner/PlannerActionMenus';
import DayCard from '@/components/planner/DayCard';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = SCREEN_WIDTH - 40;
const CARD_MARGIN = 10;

interface RoutineDay {
  id: string;
  day_name: string;
  order_index: number;
}

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

interface RenderItem {
  type: 'exercise' | 'superset';
  key: string;
  exercise?: DayExercise;
  supersetId?: string;
  exercises?: DayExercise[];
}

export default function PlannerScreen() {
  const router = useRouter();
  const { routineId } = useLocalSearchParams<{ routineId?: string }>();

  const [planName, setPlanName] = useState('');
  const [description, setDescription] = useState('');
  const [coverImageUri, setCoverImageUri] = useState<string | null>(null);
  const [savedRoutineId, setSavedRoutineId] = useState<string | null>(routineId || null);
  const [days, setDays] = useState<RoutineDay[]>([]);
  const [dayExercises, setDayExercises] = useState<Record<string, DayExercise[]>>({});
  const [activeDayIndex, setActiveDayIndex] = useState(0);

  const [menuExercise, setMenuExercise] = useState<{ ex: DayExercise; dayId: string; inSuperset: boolean } | null>(null);
  const [menuDay, setMenuDay] = useState<RoutineDay | null>(null);
  const [menuSuperset, setMenuSuperset] = useState<{ supersetId: string; dayId: string } | null>(null);
  const [supersetPopup, setSupersetPopup] = useState<{ dayId: string } | null>(null);
  const [showCoverPicker, setShowCoverPicker] = useState(false);

  // Lock horizontal scroll while dragging exercises
  const [isDragging, setIsDragging] = useState(false);
  const [cardAreaHeight, setCardAreaHeight] = useState(400);

  const scrollRef = useRef<GHFlatList>(null);
  const insets = useSafeAreaInsets();

  useEffect(() => {
    if (routineId) loadRoutine(routineId);
  }, [routineId]);

  useFocusEffect(
    useCallback(() => {
      if (savedRoutineId) loadDaysAndExercises(savedRoutineId);
    }, [savedRoutineId])
  );

  const loadRoutine = (id: string) => {
    try {
      const routine = db.getFirstSync<{ name: string; description: string | null; cover_image_uri: string | null }>(
        'SELECT name, description, cover_image_uri FROM routines WHERE id = ?', [id]
      );
      if (routine) {
        setPlanName(routine.name);
        setDescription(routine.description || '');
        setCoverImageUri(routine.cover_image_uri);
      }
      loadDaysAndExercises(id);
    } catch (error) { console.error('Error loading routine:', error); }
  };
  const loadDaysAndExercises = (rId: string) => {
    try {
      const daysResult = db.getAllSync<RoutineDay>(
        'SELECT * FROM routine_days WHERE routine_id = ? ORDER BY order_index', [rId]
      );
      setDays(daysResult);
      const exMap: Record<string, DayExercise[]> = {};
      for (const day of daysResult) {
        exMap[day.id] = db.getAllSync<DayExercise>(
          `SELECT re.id, re.exercise_id, re.order_index, re.superset_id,
                  re.target_sets, re.target_reps, re.rest_time_seconds,
                  e.name, e.muscle_group, e.image_uri
           FROM routine_exercises re JOIN exercises e ON re.exercise_id = e.id
           WHERE re.routine_day_id = ? ORDER BY re.order_index`,
          [day.id]
        );
      }
      setDayExercises(exMap);
    } catch (error) { console.error('Error loading days:', error); }
  };

  const ensureRoutineSaved = (): string | null => {
    if (!planName.trim()) { Alert.alert('Erro', 'Insira um nome para o plano.'); return null; }
    try {
      if (savedRoutineId) {
        db.runSync('UPDATE routines SET name = ?, description = ?, cover_image_uri = ? WHERE id = ?',
          [planName.trim(), description.trim() || null, coverImageUri, savedRoutineId]);
        return savedRoutineId;
      }
      const id = 'routine_' + Date.now();
      db.runSync('INSERT INTO routines (id, user_id, name, description, cover_image_uri, is_builtin) VALUES (?, ?, ?, ?, ?, 0)',
        [id, 'user_1', planName.trim(), description.trim() || null, coverImageUri]);
      setSavedRoutineId(id);
      return id;
    } catch (error) { console.error(error); return null; }
  };

  const handleSave = () => {
    if (!planName.trim()) { Alert.alert('Erro', 'Insira um nome para o plano.'); return; }
    ensureRoutineSaved(); router.back();
  };

  const handleAddDay = () => {
    const id = ensureRoutineSaved();
    if (!id) return;
    try {
      const maxIdx = db.getFirstSync<{ max_idx: number }>(
        'SELECT COALESCE(MAX(order_index), 0) as max_idx FROM routine_days WHERE routine_id = ?', [id]
      );
      const dayId = 'rd_' + Date.now();
      db.runSync('INSERT INTO routine_days (id, routine_id, day_name, order_index) VALUES (?, ?, ?, ?)',
        [dayId, id, `Dia ${(maxIdx?.max_idx || 0) + 1}`, (maxIdx?.max_idx || 0) + 1]);
      loadDaysAndExercises(id);
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 200);
    } catch (error) { console.error(error); }
  };

  const handleAddExercises = (dayId: string) => {
    const id = ensureRoutineSaved();
    if (!id) return;
    router.push(`/planner/exercise-picker?dayId=${dayId}&routineId=${id}` as any);
  };

  // ---- Drag end handler ----
  const handleDragEnd = (data: RenderItem[], dayId: string) => {
    try {
      let orderIdx = 1;
      for (const item of data) {
        if (item.type === 'superset' && item.exercises) {
          for (const ex of item.exercises) {
            db.runSync('UPDATE routine_exercises SET order_index = ? WHERE id = ?', [orderIdx, ex.id]);
            orderIdx++;
          }
        } else if (item.exercise) {
          db.runSync('UPDATE routine_exercises SET order_index = ? WHERE id = ?', [orderIdx, item.exercise.id]);
          orderIdx++;
        }
      }
      if (savedRoutineId) loadDaysAndExercises(savedRoutineId);
    } catch (e) { console.error('Error reordering:', e); }
  };

  // ---- Exercise Actions ----
  const duplicateExercise = (ex: DayExercise, dayId: string) => {
    try {
      const maxIdx = db.getFirstSync<{ max_idx: number }>(
        'SELECT COALESCE(MAX(order_index), 0) as max_idx FROM routine_exercises WHERE routine_day_id = ?', [dayId]
      );
      db.runSync(
        `INSERT INTO routine_exercises (id, routine_day_id, exercise_id, order_index, superset_id, target_sets, target_reps, rest_time_seconds) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        ['re_dup_' + Date.now(), dayId, ex.exercise_id, (maxIdx?.max_idx || 0) + 1, null, ex.target_sets, ex.target_reps, ex.rest_time_seconds]
      );
      if (savedRoutineId) loadDaysAndExercises(savedRoutineId);
    } catch (e) { console.error(e); }
    setMenuExercise(null);
  };

  const deleteExercise = (reId: string) => {
    try { db.runSync('DELETE FROM routine_exercises WHERE id = ?', [reId]); if (savedRoutineId) loadDaysAndExercises(savedRoutineId); } catch (e) { console.error(e); }
    setMenuExercise(null);
  };

  const removeFromSuperset = (ex: DayExercise) => {
    try { db.runSync('UPDATE routine_exercises SET superset_id = NULL WHERE id = ?', [ex.id]); if (savedRoutineId) loadDaysAndExercises(savedRoutineId); } catch (e) { console.error(e); }
    setMenuExercise(null);
  };

  // ---- Superset ----
  const openSupersetPopup = (dayId: string) => { setSupersetPopup({ dayId }); setMenuExercise(null); };

  const saveSupersetFromPopup = (selections: string[]) => {
    if (!supersetPopup || selections.length < 2) { return; }
    try {
      const ssId = 'ss_' + Date.now();
      const dayId = supersetPopup.dayId;
      const exercises = dayExercises[dayId] || [];
      const ssReIds = new Set<string>();
      for (const exId of selections) {
        const re = exercises.find((e) => e.id === exId);
        if (re) { ssReIds.add(re.id); db.runSync('UPDATE routine_exercises SET superset_id = ? WHERE id = ?', [ssId, re.id]); }
      }
      const ssExs = selections.map((exId) => exercises.find((e) => e.id === exId)).filter(Boolean) as DayExercise[];
      const reordered: DayExercise[] = [];
      let inserted = false;
      for (const e of exercises) {
        if (ssReIds.has(e.id)) { if (!inserted) { reordered.push(...ssExs); inserted = true; } } else { reordered.push(e); }
      }
      let orderIdx = 1;
      for (const e of reordered) { db.runSync('UPDATE routine_exercises SET order_index = ? WHERE id = ?', [orderIdx, e.id]); orderIdx++; }
      if (savedRoutineId) loadDaysAndExercises(savedRoutineId);
    } catch (e) { console.error(e); }
    setSupersetPopup(null);
  };

  const dissolveSuperset = (supersetId: string) => {
    try { db.runSync('UPDATE routine_exercises SET superset_id = NULL WHERE superset_id = ?', [supersetId]); if (savedRoutineId) loadDaysAndExercises(savedRoutineId); } catch (e) { console.error(e); }
    setMenuSuperset(null);
  };

  const deleteSuperset = (supersetId: string) => {
    Alert.alert('Excluir superset', 'Deseja excluir todos os exercícios deste superset?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Excluir', style: 'destructive', onPress: () => {
        try { db.runSync('DELETE FROM routine_exercises WHERE superset_id = ?', [supersetId]); if (savedRoutineId) loadDaysAndExercises(savedRoutineId); } catch (e) { console.error(e); }
        setMenuSuperset(null);
      }},
    ]);
  };

  // ---- Day Actions ----
  const duplicateDay = (day: RoutineDay) => {
    if (!savedRoutineId) return;
    try {
      const maxIdx = db.getFirstSync<{ max_idx: number }>('SELECT COALESCE(MAX(order_index), 0) as max_idx FROM routine_days WHERE routine_id = ?', [savedRoutineId]);
      const newDayId = 'rd_dup_' + Date.now();
      db.runSync('INSERT INTO routine_days (id, routine_id, day_name, order_index) VALUES (?, ?, ?, ?)',
        [newDayId, savedRoutineId, day.day_name + ' (cópia)', (maxIdx?.max_idx || 0) + 1]);
      for (const ex of (dayExercises[day.id] || [])) {
        db.runSync(`INSERT INTO routine_exercises (id, routine_day_id, exercise_id, order_index, superset_id, target_sets, target_reps, rest_time_seconds) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          ['re_dup_' + Date.now() + '_' + ex.order_index, newDayId, ex.exercise_id, ex.order_index, null, ex.target_sets, ex.target_reps, ex.rest_time_seconds]);
      }
      loadDaysAndExercises(savedRoutineId);
    } catch (e) { console.error(e); }
    setMenuDay(null);
  };

  const deleteDay = (dayId: string) => {
    Alert.alert('Excluir dia', 'Deseja excluir este dia e todos os seus exercícios?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Excluir', style: 'destructive', onPress: () => {
        try {
          db.runSync('DELETE FROM routine_exercises WHERE routine_day_id = ?', [dayId]);
          db.runSync('DELETE FROM routine_days WHERE id = ?', [dayId]);
          if (savedRoutineId) loadDaysAndExercises(savedRoutineId);
          setActiveDayIndex(Math.max(0, activeDayIndex - 1));
        } catch (e) { console.error(e); }
        setMenuDay(null);
      }},
    ]);
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
      onMenuDay={setMenuDay}
      onAddExercises={handleAddExercises}
      onDragBegin={() => setIsDragging(true)}
      onDragEnd={(data) => { setIsDragging(false); handleDragEnd(data, day.id); }}
      onMenuExercise={(ex, dayId, inSuperset) => setMenuExercise({ ex, dayId, inSuperset })}
      onMenuSuperset={(supersetId, dayId) => setMenuSuperset({ supersetId, dayId })}
    />
  );

  return (
    <SafeAreaView className="flex-1 bg-forge-bg" edges={['top']}>
      {/* Header */}
      <View className="flex-row items-center justify-between px-5 py-3">
        <TouchableOpacity onPress={() => router.back()} className="w-9 h-9 rounded-xl bg-forge-surface justify-center items-center">
          <X size={20} color="#FFF" />
        </TouchableOpacity>
        <Text className="text-white text-base font-extrabold tracking-wide">CONSTRUIR PLANO</Text>
        <TouchableOpacity onPress={handleSave}>
          <Text className="text-forge-accent text-sm font-extrabold tracking-tight">SALVAR</Text>
        </TouchableOpacity>
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
        <TouchableOpacity
          className="absolute bottom-2 right-2 w-8 h-8 rounded-full bg-forge-surface justify-center items-center"
          onPress={() => setShowCoverPicker(true)}
        >
          <Camera size={16} color="#A0C4FF" />
        </TouchableOpacity>
      </View>

      {/* Name */}
      <View className="px-5 mb-3">
        <Text className="text-forge-muted text-[10px] font-bold tracking-widest mb-1">NOME *</Text>
        <TextInput
          className="border-b border-forge-border pb-2 text-white text-lg font-bold"
          placeholder="Meu Plano de Treino"
          placeholderTextColor="#5F6368"
          value={planName}
          onChangeText={setPlanName}
        />
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
            📋 DESLIZE PARA VER OUTROS DIAS
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
      <TouchableOpacity
        className="absolute right-6 w-14 h-14 rounded-2xl bg-forge-accent justify-center items-center"
        style={{ elevation: 8, shadowColor: '#A0C4FF', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, bottom: Math.max(24, insets.bottom + 16) }}
        activeOpacity={0.8}
        onPress={handleAddDay}
      >
        <Plus size={24} color="#FFF" />
      </TouchableOpacity>

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
        onRemoveFromSuperset={() => menuExercise && removeFromSuperset(menuExercise.ex)}
        onCreateSuperset={() => menuExercise && openSupersetPopup(menuExercise.dayId)}
        onDuplicate={() => menuExercise && duplicateExercise(menuExercise.ex, menuExercise.dayId)}
        onDelete={() => menuExercise && deleteExercise(menuExercise.ex.id)}
      />

      <SupersetMenu
        visible={!!menuSuperset}
        onClose={() => setMenuSuperset(null)}
        onDissolve={() => menuSuperset && dissolveSuperset(menuSuperset.supersetId)}
        onDelete={() => menuSuperset && deleteSuperset(menuSuperset.supersetId)}
      />

      <DayMenu
        visible={!!menuDay}
        onClose={() => setMenuDay(null)}
        onDuplicate={() => menuDay && duplicateDay(menuDay)}
        onDelete={() => menuDay && deleteDay(menuDay.id)}
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
    </SafeAreaView>
  );
}
