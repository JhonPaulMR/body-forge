import React, { useMemo, useCallback } from 'react';
import { View, Text, TouchableOpacity, Dimensions } from 'react-native';
import { GripVertical, Link, MoreVertical, Plus, Dumbbell } from 'lucide-react-native';
import DraggableFlatList, { RenderItemParams, ScaleDecorator } from 'react-native-draggable-flatlist';
import { useRouter } from 'expo-router';

// Types mapping what we need
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

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = SCREEN_WIDTH - 40;
const CARD_MARGIN = 10;

interface DayCardProps {
  day: RoutineDay;
  exercises: DayExercise[];
  cardAreaHeight: number;
  onMenuDay: (day: RoutineDay) => void;
  onAddExercises: (dayId: string) => void;
  onDragBegin: () => void;
  onDragEnd: (data: RenderItem[], dayId: string) => void;
  onMenuExercise: (ex: DayExercise, dayId: string, inSuperset: boolean) => void;
  onMenuSuperset: (supersetId: string, dayId: string) => void;
}

function groupExercises(exercises: DayExercise[]): RenderItem[] {
  const items: RenderItem[] = [];
  const processedSupersets = new Set<string>();
  for (const ex of exercises) {
    if (ex.superset_id) {
      if (processedSupersets.has(ex.superset_id)) continue;
      processedSupersets.add(ex.superset_id);
      items.push({
        type: 'superset', key: 'ss_' + ex.superset_id, supersetId: ex.superset_id,
        exercises: exercises.filter((e) => e.superset_id === ex.superset_id),
      });
    } else {
      items.push({ type: 'exercise', key: ex.id, exercise: ex });
    }
  }
  return items;
}

const DayCardComponent = ({
  day, exercises, cardAreaHeight,
  onMenuDay, onAddExercises, onDragBegin, onDragEnd, onMenuExercise, onMenuSuperset
}: DayCardProps) => {
  const router = useRouter();
  
  // Memoize grouped items to prevent recalculation inside the list
  const items = useMemo(() => groupExercises(exercises), [exercises]);

  const renderDragItem = useCallback(({ item, drag, isActive }: RenderItemParams<RenderItem>) => {
    if (item.type === 'superset') {
      return (
        <ScaleDecorator>
          <View className={`mb-2 ${isActive ? 'opacity-70' : ''}`}>
            <TouchableOpacity
              className="flex-row items-center bg-forge-bg rounded-t-xl py-3"
              activeOpacity={0.8}
              onLongPress={drag}
              delayLongPress={150}
            >
              <View className="px-2.5"><GripVertical size={16} color={isActive ? '#A0C4FF' : '#3A3D44'} /></View>
              <Link size={14} color="#A0C4FF" />
              <View className="flex-1 ml-2">
                <Text className="text-white text-[13px] font-bold">Superset</Text>
                <Text className="text-forge-muted text-[10px] font-medium">{item.exercises!.length} exercícios</Text>
              </View>
              <TouchableOpacity className="px-3 py-2"
                onPress={() => onMenuSuperset(item.supersetId!, day.id)}>
                <MoreVertical size={16} color="#5F6368" />
              </TouchableOpacity>
            </TouchableOpacity>
            {item.exercises!.map((ex) => (
              <TouchableOpacity
                key={ex.id}
                className="flex-row items-center bg-forge-bg py-3 border-l-2 border-forge-accent ml-3 rounded-r-xl mb-0.5"
                activeOpacity={0.7}
                onPress={() => router.push(`/planner/edit-exercise?reId=${ex.id}&dayId=${day.id}` as any)}
              >
                <View className="flex-1 ml-3">
                  <Text className="text-white text-[13px] font-bold mb-0.5">{ex.name}</Text>
                  <Text className="text-forge-muted text-[10px] font-medium">{ex.target_sets} séries × {ex.target_reps} reps</Text>
                </View>
                <TouchableOpacity className="px-3 py-2"
                  onPress={() => onMenuExercise(ex, day.id, true)}>
                  <MoreVertical size={16} color="#5F6368" />
                </TouchableOpacity>
              </TouchableOpacity>
            ))}
          </View>
        </ScaleDecorator>
      );
    }

    const ex = item.exercise!;
    return (
      <ScaleDecorator>
        <TouchableOpacity
          className={`flex-row items-center bg-forge-bg rounded-xl mb-2 py-3 ${isActive ? 'opacity-70' : ''}`}
          activeOpacity={0.7}
          onPress={() => router.push(`/planner/edit-exercise?reId=${ex.id}&dayId=${day.id}` as any)}
        >
          <TouchableOpacity className="px-2.5" onLongPress={drag} delayLongPress={150}>
            <GripVertical size={16} color={isActive ? '#A0C4FF' : '#3A3D44'} />
          </TouchableOpacity>
          <View className="flex-1">
            <Text className="text-white text-[13px] font-bold mb-0.5">{ex.name}</Text>
            <Text className="text-forge-muted text-[10px] font-medium">{ex.target_sets} séries × {ex.target_reps} reps</Text>
          </View>
          <TouchableOpacity className="px-3 py-2"
            onPress={() => onMenuExercise(ex, day.id, false)}>
            <MoreVertical size={16} color="#5F6368" />
          </TouchableOpacity>
        </TouchableOpacity>
      </ScaleDecorator>
    );
  }, [day.id, onMenuExercise, onMenuSuperset, router]);

  return (
    <View style={{ width: CARD_WIDTH, height: cardAreaHeight, marginHorizontal: CARD_MARGIN }}>
      <View className="bg-forge-surface rounded-[20px] flex-1 overflow-hidden">
        {/* Day Header */}
        <View className="flex-row items-center justify-between p-5 pb-3">
          <Text className="text-white text-2xl font-black">{day.day_name}</Text>
          <TouchableOpacity onPress={() => onMenuDay(day)} className="p-1">
            <MoreVertical size={18} color="#5F6368" />
          </TouchableOpacity>
        </View>

        {/* Exercise List (DraggableFlatList) */}
        {items.length > 0 ? (
          <DraggableFlatList
            data={items}
            keyExtractor={(item) => item.key}
            renderItem={renderDragItem}
            onDragBegin={onDragBegin}
            onDragEnd={({ data }) => onDragEnd(data, day.id)}
            activationDistance={20}
            containerStyle={{ flex: 1 }}
            contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 16 }}
            ListFooterComponent={
              <TouchableOpacity
                className="flex-row items-center justify-center bg-forge-accent-bg rounded-2xl py-4 mt-2 gap-2"
                onPress={() => onAddExercises(day.id)}
              >
                <Plus size={18} color="#A0C4FF" />
                <Text className="text-forge-accent text-xs font-extrabold tracking-tight">ADICIONAR EXERCÍCIOS</Text>
              </TouchableOpacity>
            }
          />
        ) : (
          <View className="flex-1 items-center justify-center px-4 pb-5">
            <View className="w-16 h-16 rounded-2xl bg-forge-bg border border-dashed border-forge-border-light justify-center items-center mb-4">
              <Dumbbell size={24} color="#5F6368" />
            </View>
            <Text className="text-white text-base font-bold mb-1">Seu treino está vazio</Text>
            <Text className="text-forge-muted text-xs text-center mb-4">
              Adicionar exercícios para o{'\n'}seu treino
            </Text>
            <TouchableOpacity
              className="flex-row items-center justify-center bg-forge-accent-bg rounded-2xl py-4 px-8 gap-2"
              onPress={() => onAddExercises(day.id)}
            >
              <Plus size={18} color="#A0C4FF" />
              <Text className="text-forge-accent text-xs font-extrabold tracking-tight">ADICIONAR EXERCÍCIOS</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </View>
  );
};

// React.memo prevents the UI from re-rendering if the specific day props haven't changed.
// Extremely important when users are just typing the "Plan Name" or dragging items in ANOTHER day.
export default React.memo(DayCardComponent, (prevProps, nextProps) => {
  return (
    prevProps.day.id === nextProps.day.id &&
    prevProps.day.day_name === nextProps.day.day_name &&
    prevProps.cardAreaHeight === nextProps.cardAreaHeight &&
    prevProps.exercises === nextProps.exercises
  );
});
