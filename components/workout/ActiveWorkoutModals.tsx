import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, TextInput, ScrollView, Modal, Image } from 'react-native';
import { X, Check } from 'lucide-react-native';
import { WorkoutExercise } from '@/hooks/useWorkoutStore';
import { muscleImages } from '@/constants/muscleImages';
import { getExerciseStats, ExerciseHistorySession } from '@/services/exerciseService';
import { ExerciseMediaRepository } from '@/database/repositories/ExerciseMediaRepository';
import { toTitleCase } from '@/utils/stringUtils';
import { ExerciseNotesModal } from '@/components/exercises/ExerciseNotesModal';

// --- HISTORY MODAL ---
export function HistoryModal({ exercise, visible, onClose }: { exercise: WorkoutExercise | null, visible: boolean, onClose: () => void }) {
  const [history, setHistory] = useState<ExerciseHistorySession[]>([]);

  useEffect(() => {
    if (visible && exercise) {
      const stats = getExerciseStats(exercise.exercise_id);
      setHistory(stats.history);
    }
  }, [visible, exercise]);

  if (!exercise) return null;

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View className="flex-1 justify-end bg-black/60">
        <View className="bg-forge-bg rounded-t-3xl h-[80%] p-6">
          <View className="flex-row justify-between items-center mb-6">
            <View>
              <Text className="text-white text-xl font-bold">Histórico</Text>
              <Text className="text-forge-muted text-sm">{toTitleCase(exercise.name)}</Text>
            </View>
            <TouchableOpacity onPress={onClose} className="p-2 bg-forge-surface rounded-full">
              <X size={20} color="#8A8F98" />
            </TouchableOpacity>
          </View>
          
          <ScrollView showsVerticalScrollIndicator={false}>
            {history.length === 0 ? (
              <Text className="text-forge-muted text-center mt-10">Nenhum histórico encontrado para este exercício.</Text>
            ) : (
              history.map((session, sIdx) => (
                <View key={sIdx} className="mb-6">
                  <View className="flex-row justify-between items-center mb-3">
                    <Text className="text-white text-[13px] font-extrabold tracking-tight flex-1">{session.date}</Text>
                    {session.isPersonalRecord && (
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
                          <Text className="text-white text-[22px] font-black">{set.weight || 0}</Text>
                          <Text className="text-forge-muted text-[13px] font-semibold"> kg</Text>
                          <Text className="text-forge-muted-dark text-lg font-semibold">×</Text>
                          <Text className="text-white text-[22px] font-black">{set.reps || 0}</Text>
                          <Text className="text-forge-muted text-[13px] font-semibold"> reps</Text>
                        </View>
                        {!!set.is_to_failure && (
                          <Text className="text-[#EF4444] font-bold text-[10px] ml-2 uppercase">Falha</Text>
                        )}
                        {volume > 0 && (
                          <Text className="text-forge-muted-dark text-[9px] font-bold tracking-tight mt-1 w-full pl-12">VOLUME: {volume} KG</Text>
                        )}
                      </View>
                    );
                  })}
                </View>
              ))
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

// --- NOTES MODAL ---
export function NotesModal({ exercise, visible, onClose }: { exercise: WorkoutExercise | null, visible: boolean, onClose: () => void }) {
  if (!exercise) return null;
  return (
    <ExerciseNotesModal
      exerciseId={exercise.exercise_id}
      exerciseName={exercise.name}
      visible={visible}
      onClose={onClose}
    />
  );
}


export type DetectedModification = {
  id: string;
  action: 'ADDED' | 'REMOVED' | 'MODIFIED';
  name: string;
  description: string;
};

// --- CONFIRM MODIFICATIONS MODAL ---
export function ConfirmUpdateModal({ 
  visible, 
  modifications, 
  selectedIds,
  onToggleSelection,
  onApply, 
  onKeepOriginal 
}: { 
  visible: boolean, 
  modifications: DetectedModification[], 
  selectedIds: Set<string>,
  onToggleSelection: (id: string) => void,
  onApply: () => void, 
  onKeepOriginal: () => void 
}) {
  if (!visible) return null;

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View className="flex-1 justify-end bg-black/60">
        <View className="bg-[#1C1E23] rounded-t-3xl h-[85%] p-6">
          <View className="flex-row justify-between items-center mb-4">
            <Text className="text-white text-2xl font-bold">Atualizar seu treino?</Text>
            <TouchableOpacity onPress={onKeepOriginal} className="p-2">
              <X size={24} color="#FFF" />
            </TouchableOpacity>
          </View>
          
          <Text className="text-forge-muted text-sm mb-6">
            Você fez alterações durante o treino. Selecione quais modificações estruturais deseja salvar na rotina original para a próxima vez:
          </Text>

          <ScrollView showsVerticalScrollIndicator={false} className="flex-1 mb-4">
            {modifications.map(mod => {
              const isSelected = selectedIds.has(mod.id);
              return (
                <TouchableOpacity 
                  key={mod.id} 
                  onPress={() => onToggleSelection(mod.id)}
                  className={`flex-row items-center justify-between p-4 rounded-2xl border mb-3 ${isSelected ? 'bg-forge-surface-hover/30 border-[#3B82F6]/50' : 'bg-forge-surface border-forge-border'}`}
                >
                  <View className="flex-1">
                    <Text className="text-white font-bold mb-1">{mod.name}</Text>
                    <Text className="text-forge-muted text-xs leading-relaxed pr-2">{mod.description}</Text>
                  </View>
                  <View className={`w-6 h-6 rounded items-center justify-center border ${isSelected ? 'bg-[#3B82F6] border-[#3B82F6]' : 'border-forge-border bg-transparent'}`}>
                    {isSelected && <Check size={16} color="#FFF" />}
                  </View>
                </TouchableOpacity>
              )
            })}
          </ScrollView>

          <View className="mt-2 gap-3 pb-4">
            <TouchableOpacity onPress={onApply} className="bg-[#3B82F6] py-4 rounded-full items-center">
              <Text className="text-white font-bold">Aplicar alterações selecionadas</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={onKeepOriginal} className="bg-transparent border border-forge-border py-4 rounded-full items-center">
              <Text className="text-white font-bold">Manter treino original</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

// --- CREATE SUPERSET MODAL ---
export function CreateSupersetModal({ visible, currentExerciseId, exercises, onClose, onSave }: { visible: boolean, currentExerciseId: string, exercises: WorkoutExercise[], onClose: () => void, onSave: (ids: string[]) => void }) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set([currentExerciseId]));

  useEffect(() => {
    if (visible) {
      setSelectedIds(new Set([currentExerciseId]));
    }
  }, [visible, currentExerciseId]);

  const toggleSelect = (id: string) => {
    const newSet = new Set(selectedIds);
    if (newSet.has(id)) {
      if (id !== currentExerciseId) newSet.delete(id); // Can't unselect the base exercise
    } else {
      newSet.add(id);
    }
    setSelectedIds(newSet);
  };

  const handleSave = () => {
    if (selectedIds.size > 1) {
      onSave(Array.from(selectedIds));
    }
    onClose();
  };

  if (!visible) return null;

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View className="flex-1 justify-end bg-black/60">
        <View className="bg-[#1C1E23] rounded-t-3xl h-[85%] p-6">
          <View className="flex-row items-center mb-6">
            <TouchableOpacity onPress={onClose} className="p-2 -ml-2 mr-2">
              <X size={24} color="#FFF" />
            </TouchableOpacity>
            <Text className="text-white text-xl font-bold">Criar Superset</Text>
          </View>
          
          <Text className="text-forge-muted text-sm mb-6">
            Selecione os exercícios que deseja agrupar em superset
          </Text>

          <ScrollView showsVerticalScrollIndicator={false} className="flex-1">
            {exercises.map(ex => {
              const exerciseImage = ex.image_uri || muscleImages[ex.muscle_group as keyof typeof muscleImages] || muscleImages['Peito'];
              const isSelected = selectedIds.has(ex.id);
              
              return (
                <TouchableOpacity 
                  key={ex.id} 
                  className="flex-row items-center justify-between mb-4"
                  onPress={() => toggleSelect(ex.id)}
                >
                  <View className="flex-row items-center gap-4 flex-1">
                    <View className="w-14 h-14 bg-white rounded-xl overflow-hidden">
                      {exerciseImage ? (
                        <Image source={{ uri: exerciseImage }} className="w-full h-full" resizeMode="cover" />
                      ) : (
                        <View className="w-full h-full items-center justify-center bg-forge-surface"><Text className="text-white font-bold">{toTitleCase(ex.name).charAt(0)}</Text></View>
                      )}
                    </View>
                    <View className="flex-1 pr-4">
                      <Text className="text-white font-bold text-sm">{toTitleCase(ex.name)}</Text>
                    </View>
                  </View>
                  
                  <View className={`w-8 h-8 rounded-full border-2 items-center justify-center ${isSelected ? 'bg-[#3B82F6] border-[#3B82F6]' : 'border-forge-border bg-transparent'}`}>
                    {isSelected && <Text className="text-white font-bold text-xs">1</Text>}
                  </View>
                </TouchableOpacity>
              )
            })}
          </ScrollView>

          <View className="mt-4">
            <TouchableOpacity 
              onPress={handleSave} 
              disabled={selectedIds.size < 2}
              className={`py-4 rounded-full items-center ${selectedIds.size > 1 ? 'bg-[#3B82F6]' : 'bg-forge-surface border border-forge-border opacity-50'}`}
            >
              <Text className={`font-bold ${selectedIds.size > 1 ? 'text-white' : 'text-forge-muted'}`}>Salvar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

// --- ACTION MENU MODAL ---
export function ActionMenuModal({ visible, onClose, options }: { 
  visible: boolean; 
  onClose: () => void; 
  options: { label: string; onPress: () => void; destructive?: boolean }[] 
}) {
  if (!visible) return null;

  return (
    <Modal visible={visible} transparent animationType="fade">
      <TouchableOpacity 
        className="flex-1 bg-black/60 justify-center items-center px-6"
        activeOpacity={1}
        onPress={onClose}
      >
        <View className="bg-[#1C1E23] w-full rounded-2xl overflow-hidden shadow-2xl border border-forge-border">
          {options.map((opt, i) => (
            <TouchableOpacity 
              key={i}
              className={`p-5 ${i !== options.length - 1 ? 'border-b border-forge-border/50' : ''}`}
              onPress={() => {
                onClose();
                opt.onPress();
              }}
            >
              <Text className={`text-center font-medium text-base ${opt.destructive ? 'text-[#EF4444]' : 'text-white'}`}>
                {opt.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </TouchableOpacity>
    </Modal>
  );
}
