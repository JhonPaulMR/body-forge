import React from 'react';
import { View, Text, TouchableOpacity, TextInput } from 'react-native';
import { Check, Plus, Minus, MoreVertical } from 'lucide-react-native';
import { useWorkoutStore, WorkoutSet, WorkoutExercise } from '@/hooks/useWorkoutStore';

interface WorkoutSetRowProps {
  set: WorkoutSet;
  exercise: WorkoutExercise;
  globalSetIndex: number;
  prevText: string;
  isFirstInGroup: boolean;
  isVisualDropset: boolean;
  menuVisibleId: string | null;
  setMenuVisibleId: (id: string | null) => void;
  handleComplete: (ex: WorkoutExercise, setId: string) => void;
}

const WorkoutSetRowComponent = ({
  set,
  exercise,
  globalSetIndex,
  prevText,
  isFirstInGroup,
  isVisualDropset,
  menuVisibleId,
  setMenuVisibleId,
  handleComplete,
}: WorkoutSetRowProps) => {
  // Access store actions at event-time, not render-time
  const handleAdjustValue = (field: 'weight' | 'reps', currentVal: number, delta: number) => {
    const newVal = Math.max(0, currentVal + delta);
    useWorkoutStore.getState().updateSet(exercise.id, set.id, { [field]: newVal });
  };

  const handleTextChange = (field: 'weight' | 'reps', text: string) => {
    const val = field === 'weight' ? (parseFloat(text) || 0) : (parseInt(text) || 0);
    useWorkoutStore.getState().updateSet(exercise.id, set.id, { [field]: val });
  };

  return (
    <View 
      className={`p-4 border relative ${set.is_completed ? 'border-[#10B981]/50 bg-[#10B981]/5' : (set.is_warmup ? 'border-[#F59E0B]/50 bg-[#F59E0B]/5' : 'border-forge-border bg-forge-surface')} ${isVisualDropset ? 'border-t-0 rounded-b-2xl bg-forge-surface-hover/30' : 'rounded-2xl'} ${!isFirstInGroup ? 'rounded-t-none -mt-1' : ''}`}
    >
      <View className="flex-row justify-between items-center mb-4">
        <View className="flex-row items-center gap-2">
          <View className={`w-6 h-6 rounded-full items-center justify-center ${set.is_completed ? 'bg-[#10B981]' : 'bg-forge-bg border border-forge-border'}`}>
            {set.is_completed ? <Check size={14} color="#FFF" /> : <Text className="text-forge-muted text-[10px] font-bold">{globalSetIndex}</Text>}
          </View>
          <View>
            <Text className={`font-bold ${set.is_warmup ? 'text-[#F59E0B]' : 'text-white'}`}>
              {set.is_warmup ? `AQUECIMENTO ${globalSetIndex}` : (!isVisualDropset ? `SÉRIE ${globalSetIndex}` : `SÉRIE ${globalSetIndex} (DROP)`)}
            </Text>
          </View>
        </View>
        
        <View className="flex-row items-center gap-2">
          <Text className="text-forge-muted text-[10px] font-medium">Anterior: {prevText}</Text>
          
          <TouchableOpacity 
            className="p-1 -mr-2"
            onPress={() => setMenuVisibleId(menuVisibleId === set.id ? null : set.id)}
          >
            <MoreVertical size={16} color="#8A8F98" />
          </TouchableOpacity>
        </View>
      </View>

      <View className="flex-row gap-4 mb-4">
        <View className="flex-1">
          <Text className="text-forge-muted text-[10px] font-bold mb-2 tracking-widest">PESO (KG)</Text>
          <View className="bg-forge-bg border border-forge-border flex-row items-center justify-between rounded-xl px-2 h-12">
            <TouchableOpacity onPress={() => handleAdjustValue('weight', set.weight, -1)} className="p-2">
              <Minus size={18} color="#A0C4FF" />
            </TouchableOpacity>
            <TextInput 
              className="flex-1 text-white text-center font-bold text-lg"
              keyboardType="numeric"
              value={set.weight ? set.weight.toString() : '0'}
              onChangeText={(t) => handleTextChange('weight', t)}
              editable={!set.is_completed}
            />
            <TouchableOpacity onPress={() => handleAdjustValue('weight', set.weight, 1)} className="p-2">
              <Plus size={18} color="#A0C4FF" />
            </TouchableOpacity>
          </View>
        </View>
        <View className="flex-1">
          <View className="flex-row items-center justify-between mb-2">
            <Text className="text-forge-muted text-[10px] font-bold tracking-widest">REPS</Text>
            {set.is_to_failure ? (
              <Text className="text-[#EF4444] text-[10px] font-bold uppercase">Até a falha</Text>
            ) : exercise.target_reps ? (
              <Text className="text-[#A0C4FF] text-[10px] font-bold">{exercise.target_reps} reps</Text>
            ) : null}
          </View>
          <View className="bg-forge-bg border border-forge-border flex-row items-center justify-between rounded-xl px-2 h-12">
            <TouchableOpacity onPress={() => handleAdjustValue('reps', set.reps, -1)} className="p-2">
              <Minus size={18} color="#A0C4FF" />
            </TouchableOpacity>
            <TextInput 
              className="flex-1 text-white text-center font-bold text-lg"
              keyboardType="numeric"
              value={set.reps ? set.reps.toString() : '0'}
              onChangeText={(t) => handleTextChange('reps', t)}
              editable={!set.is_completed}
            />
            <TouchableOpacity onPress={() => handleAdjustValue('reps', set.reps, 1)} className="p-2">
              <Plus size={18} color="#A0C4FF" />
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {!set.is_completed && (
        <TouchableOpacity 
          onPress={() => handleComplete(exercise, set.id)}
          className="bg-[#10B981] h-12 rounded-xl items-center justify-center flex-row gap-2 shadow-sm"
        >
          <Check size={18} color="#FFF" strokeWidth={3} />
          <Text className="text-white font-black tracking-widest text-[14px]">COMPLETAR SÉRIE</Text>
        </TouchableOpacity>
      )}

      {/* Menu Flutuante */}
      {menuVisibleId === set.id && (
        <View className="absolute top-10 right-4 bg-[#2D3038] border border-forge-border rounded-xl py-1 z-50 shadow-lg min-w-[150px]">
          {set.is_completed && (
            <TouchableOpacity 
              className="px-4 py-3 border-b border-forge-border/30"
              onPress={() => {
                useWorkoutStore.getState().updateSet(exercise.id, set.id, { is_completed: false });
                setMenuVisibleId(null);
              }}
            >
              <Text className="text-white font-medium">Editar</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity 
            className="px-4 py-3 border-b border-forge-border/30"
            onPress={() => {
              useWorkoutStore.getState().addDropSet(exercise.id, set.id);
              setMenuVisibleId(null);
            }}
          >
            <Text className="text-white font-medium">Add Drop Set</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            className="px-4 py-3 border-b border-forge-border/30"
            onPress={() => {
              useWorkoutStore.getState().toggleSetWarmup(exercise.id, set.id);
              setMenuVisibleId(null);
            }}
          >
            <Text className="text-white font-medium">
              {set.is_warmup ? 'Remover Aquecimento' : 'Marcar Aquecimento'}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity 
            className="px-4 py-3 border-b border-forge-border/30"
            onPress={() => {
              useWorkoutStore.getState().toggleSetFailure(exercise.id, set.id);
              setMenuVisibleId(null);
            }}
          >
            <Text className="text-white font-medium">
              {set.is_to_failure ? 'Remover Falha' : 'Marcar Falha'}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity 
            className="px-4 py-3"
            onPress={() => {
              useWorkoutStore.getState().removeSet(exercise.id, set.id);
              setMenuVisibleId(null);
            }}
          >
            <Text className="text-[#EF4444] font-medium">Excluir Série</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

export const WorkoutSetRow = React.memo(WorkoutSetRowComponent, (prevProps, nextProps) => {
  return (
    prevProps.set.weight === nextProps.set.weight &&
    prevProps.set.reps === nextProps.set.reps &&
    prevProps.set.is_completed === nextProps.set.is_completed &&
    prevProps.set.is_warmup === nextProps.set.is_warmup &&
    prevProps.set.is_to_failure === nextProps.set.is_to_failure &&
    prevProps.menuVisibleId === nextProps.menuVisibleId &&
    prevProps.globalSetIndex === nextProps.globalSetIndex
  );
});
