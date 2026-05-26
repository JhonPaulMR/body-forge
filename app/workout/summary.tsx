import React, { useMemo, useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Dimensions, Alert } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { X, Check } from 'lucide-react-native';
import { useWorkoutStore, WorkoutExercise } from '@/hooks/useWorkoutStore';
import { db } from '@/database/schema';
import { ConfirmUpdateModal, DetectedModification } from '@/components/workout/ActiveWorkoutModals';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const formatTime = (seconds: number) => {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
};

export default function WorkoutSummaryScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { sessionId, exercises, elapsedSeconds, cancelWorkout, routineDayId, hasStructuralChanges } = useWorkoutStore();
  const [confirmModal, setConfirmModal] = useState(false);
  const [modifications, setModifications] = useState<DetectedModification[]>([]);
  const [selectedModIds, setSelectedModIds] = useState<Set<string>>(new Set());
  const [originalExercises, setOriginalExercises] = useState<any[]>([]);

  React.useEffect(() => {
    if (hasStructuralChanges && routineDayId) {
      const origs = db.getAllSync<any>(`
        SELECT re.*, e.name 
        FROM routine_exercises re 
        JOIN exercises e ON re.exercise_id = e.id 
        WHERE re.routine_day_id = ? 
        ORDER BY re.order_index
      `, [routineDayId]);
      
      setOriginalExercises(origs);

      const mods: DetectedModification[] = [];
      
      // 1. Check for removed exercises
      origs.forEach(orig => {
        const found = exercises.find(ex => ex.exercise_id === orig.exercise_id);
        if (!found) {
          mods.push({
            id: `rm_${orig.exercise_id}`,
            action: 'REMOVED',
            name: orig.name,
            description: 'Exercício removido do treino.'
          });
        }
      });

      // 2. Check for added/modified
      exercises.forEach(ex => {
        const orig = origs.find(o => o.exercise_id === ex.exercise_id);
        if (!orig) {
          mods.push({
            id: `add_${ex.exercise_id}`,
            action: 'ADDED',
            name: ex.name,
            description: 'Novo exercício adicionado.'
          });
        } else {
          // Compare sets length and configs
          const origTargetSets = orig.target_sets || 1;
          let origConfigs: any[] = [];
          if (orig.set_configs) {
            try { origConfigs = JSON.parse(orig.set_configs); } catch(e){}
          }
          
          let hasStatusChanges = false;
          ex.sets.forEach((set, i) => {
            if (i < origTargetSets) {
              const origConf = origConfigs[i] || {};
              if (!!set.is_warmup !== !!origConf.warmup || 
                  !!set.is_dropset !== !!origConf.dropSet || 
                  !!set.is_to_failure !== !!origConf.untilFailure) {
                hasStatusChanges = true;
              }
            }
          });

          if (ex.sets.length !== origTargetSets) {
            mods.push({
              id: `mod_${ex.exercise_id}`,
              action: 'MODIFIED',
              name: ex.name,
              description: `Mudou de ${origTargetSets} para ${ex.sets.length} séries.`
            });
          } else if (hasStatusChanges) {
            mods.push({
              id: `mod_${ex.exercise_id}`,
              action: 'MODIFIED',
              name: ex.name,
              description: 'Status de séries alterado (Dropset/Falha/Aquec).'
            });
          }
        }
      });
      
      setModifications(mods);
      setSelectedModIds(new Set(mods.map(m => m.id)));
    }
  }, [hasStructuralChanges, routineDayId, exercises]);

  const stats = useMemo(() => {
    let totalVolume = 0;
    let completedSetsCount = 0;

    exercises.forEach(ex => {
      ex.sets.forEach(set => {
        if (set.is_completed) {
          totalVolume += (set.weight || 0) * (set.reps || 0);
          completedSetsCount += 1;
        }
      });
    });

    return { totalVolume, completedSetsCount };
  }, [exercises]);

  const handleDoneClick = () => {
    if (hasStructuralChanges && modifications.length > 0) {
      setConfirmModal(true);
    } else {
      finalizeAndSaveWorkout(false);
    }
  };

  const finalizeAndSaveWorkout = (applyChanges: boolean) => {
    setConfirmModal(false);
    try {
      if (applyChanges && routineDayId) {
        // Construct patched exercises
        const finalExercises: any[] = [];
        
        exercises.forEach(ex => {
          const modIdAdd = `add_${ex.exercise_id}`;
          const modIdMod = `mod_${ex.exercise_id}`;
          const orig = originalExercises.find(o => o.exercise_id === ex.exercise_id);
          
          if (!orig) {
            // Added exercise
            if (selectedModIds.has(modIdAdd)) {
              finalExercises.push(ex);
            }
          } else {
            // Modified or unmodified
            if (modifications.find(m => m.id === modIdMod)) {
              if (selectedModIds.has(modIdMod)) {
                finalExercises.push(ex); // Keep mods
              } else {
                // Keep orig
                finalExercises.push({
                  ...ex, // copy non-structural data like rest_time if unchanged, or just mapping back
                  sets: Array.from({ length: orig.target_sets || 1 }).map((_, i) => {
                    let origConf: any = {};
                    try { if (orig.set_configs) origConf = JSON.parse(orig.set_configs)[i] || {}; } catch(e){}
                    return {
                      is_warmup: !!origConf.warmup,
                      is_dropset: !!origConf.dropSet,
                      is_to_failure: !!origConf.untilFailure,
                    };
                  }),
                  target_reps: orig.target_reps,
                  rest_time_seconds: orig.rest_time_seconds
                });
              }
            } else {
              finalExercises.push(ex); // Unmodified
            }
          }
        });

        // Add back removed exercises if unselected
        originalExercises.forEach(orig => {
          const modIdRm = `rm_${orig.exercise_id}`;
          if (modifications.find(m => m.id === modIdRm) && !selectedModIds.has(modIdRm)) {
             finalExercises.splice(orig.order_index, 0, {
               exercise_id: orig.exercise_id,
               superset_id: orig.superset_id,
               target_reps: orig.target_reps,
               rest_time_seconds: orig.rest_time_seconds,
               sets: Array.from({ length: orig.target_sets || 1 }).map((_, i) => {
                 let origConf: any = {};
                 try { if (orig.set_configs) origConf = JSON.parse(orig.set_configs)[i] || {}; } catch(e){}
                 return {
                   is_warmup: !!origConf.warmup,
                   is_dropset: !!origConf.dropSet,
                   is_to_failure: !!origConf.untilFailure,
                 };
               })
             });
          }
        });

        db.runSync('DELETE FROM routine_exercises WHERE routine_day_id = ?', [routineDayId]);
        
        finalExercises.forEach((ex, index) => {
          const reId = 're_' + Math.random().toString(36).substr(2, 9);
          const targetSets = ex.sets.length > 0 ? ex.sets.length : 1;
          const setConfigs = ex.sets.map((s: any) => ({
            warmup: s.is_warmup || false,
            dropSet: s.is_dropset || false,
            untilFailure: s.is_to_failure || false,
            minReps: parseInt((ex.target_reps || '8-12').split('-')[0]) || 8,
            maxReps: parseInt((ex.target_reps || '8-12').split('-')[1] || (ex.target_reps || '12')) || 12,
            restTime: ex.rest_time_seconds || 90,
          }));

          db.runSync(`
            INSERT INTO routine_exercises 
            (id, routine_day_id, exercise_id, order_index, superset_id, target_sets, target_reps, rest_time_seconds, set_configs)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
          `, [
            reId, 
            routineDayId, 
            ex.exercise_id, 
            index, 
            ex.superset_id || null, 
            targetSets, 
            ex.target_reps || '8-12', 
            ex.rest_time_seconds || 90,
            JSON.stringify(setConfigs)
          ]);
        });
      }

      if (sessionId) {
        db.runSync(
          'UPDATE sessions SET end_time = ?, total_volume_kg = ? WHERE id = ?',
          [new Date().toISOString(), stats.totalVolume, sessionId]
        );

        exercises.forEach((ex, index) => {
          const completedSets = ex.sets.filter(s => s.is_completed);
          if (completedSets.length === 0) return;

          const sessionExerciseId = 'se_' + Math.random().toString(36).substr(2, 9);
          db.runSync(
            'INSERT INTO session_exercises (id, session_id, exercise_id, order_index) VALUES (?, ?, ?, ?)',
            [sessionExerciseId, sessionId, ex.exercise_id, index]
          );

          completedSets.forEach((set, setIndex) => {
            db.runSync(
              'INSERT INTO sets (id, session_exercise_id, weight, reps, rpe, is_completed, is_warmup, set_order, is_dropset, is_to_failure) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
              [set.id, sessionExerciseId, set.weight, set.reps, 0, 1, set.is_warmup ? 1 : 0, setIndex, set.is_dropset ? 1 : 0, set.is_to_failure ? 1 : 0]
            );
          });
        });
      }
      
      cancelWorkout();
      router.replace('/workout/complete');

    } catch (e: any) {
      console.error('Error saving workout session:', e);
      Alert.alert('Erro ao salvar', e.message || 'Ocorreu um erro desconhecido.');
    }
  };

  const formatVolume = (vol: number) => {
    if (vol >= 1000) return (vol / 1000).toFixed(1) + 'k';
    return vol.toString();
  };

  return (
    <SafeAreaView className="flex-1 bg-forge-bg" edges={['top']}>
      <View className="flex-row items-center justify-between px-4 py-4 border-b border-forge-border">
        <TouchableOpacity onPress={() => router.back()} className="p-2 -ml-2">
          <X size={24} color="#8A8F98" />
        </TouchableOpacity>
        <Text className="text-white font-bold tracking-widest text-sm uppercase">RESUMO</Text>
        <View className="w-8 h-8 bg-forge-surface-hover rounded-full items-center justify-center">
          <Text className="text-white font-bold text-xs">U</Text>
        </View>
      </View>

      <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 100 }}>
        <View className="p-5">
          <Text className="text-forge-accent text-[10px] font-black tracking-[2px] mb-1 uppercase">TREINOS RÁPIDOS</Text>
          <Text className="text-white text-[32px] font-black leading-9 mb-2 uppercase">FORGE SESSION</Text>
          <Text className="text-forge-muted text-sm font-medium mb-8">Bom trabalho, você destruiu hoje!</Text>

          <View className="flex-row gap-3 mb-8">
            <View className="flex-1 bg-forge-surface p-4 rounded-2xl border border-forge-border">
              <Text className="text-forge-muted text-[10px] font-bold tracking-wider mb-2">TEMPO</Text>
              <Text className="text-white text-2xl font-black">{formatTime(elapsedSeconds)}</Text>
            </View>
            <View className="flex-1 bg-forge-surface p-4 rounded-2xl border border-forge-border">
              <Text className="text-forge-muted text-[10px] font-bold tracking-wider mb-2">SÉRIES</Text>
              <Text className="text-white text-2xl font-black">{stats.completedSetsCount}</Text>
            </View>
            <View className="flex-1 bg-forge-surface p-4 rounded-2xl border border-forge-border">
              <Text className="text-forge-muted text-[10px] font-bold tracking-wider mb-2">PESO (KG)</Text>
              <Text className="text-[#FCA5A5] text-2xl font-black">{formatVolume(stats.totalVolume)}</Text>
            </View>
          </View>

          <Text className="text-forge-muted text-xs font-bold tracking-wider mb-3">EXECUÇÃO DE EXERCÍCIOS</Text>
          
          <View className="gap-4">
            {exercises.map(ex => {
              const completedSets = ex.sets.filter(s => s.is_completed);
              if (completedSets.length === 0) return null;

              return (
                <View key={ex.id} className="mb-2">
                  <View className="flex-row justify-between items-end mb-2">
                    <Text className="text-white font-bold text-base flex-1 pr-2">{ex.name}</Text>
                    <Text className="text-forge-muted text-xs">{ex.sets.length} Séries</Text>
                  </View>
                  
                  <View className="bg-forge-surface rounded-xl border border-forge-border overflow-hidden">
                    {ex.sets.map((set, i) => (
                      <View key={set.id} className={`flex-row justify-between items-center p-3 ${i !== ex.sets.length - 1 ? 'border-b border-forge-border/50' : ''}`}>
                        <View className="flex-row items-center gap-4">
                          <Text className="text-forge-muted font-bold text-xs w-4">{i + 1}</Text>
                          {set.is_completed ? (
                            <Text className="text-white font-semibold text-sm">{set.weight}kg x {set.reps}</Text>
                          ) : (
                            <Text className="text-forge-muted font-medium text-sm italic">Incompleto</Text>
                          )}
                        </View>
                        {set.is_completed ? (
                          <Check size={16} color="#10B981" />
                        ) : (
                          <View className="w-4 h-4 rounded-full border border-forge-muted" />
                        )}
                      </View>
                    ))}
                  </View>
                </View>
              );
            })}
          </View>
        </View>
      </ScrollView>

      <View 
        className="absolute bottom-0 left-0 right-0 px-4 pt-4 bg-forge-bg border-t border-forge-border flex-row gap-3"
        style={{ paddingBottom: Math.max(insets.bottom, 16) }}
      >
        <TouchableOpacity className="flex-1 border border-forge-border rounded-xl py-4 items-center justify-center">
          <Text className="text-white font-bold">Compartilhar</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          onPress={handleDoneClick}
          className="flex-1 bg-forge-accent rounded-xl py-4 items-center justify-center"
        >
          <Text className="text-forge-bg font-black tracking-wide">FEITO</Text>
        </TouchableOpacity>
      </View>

      <ConfirmUpdateModal 
        visible={confirmModal}
        modifications={modifications}
        selectedIds={selectedModIds}
        onToggleSelection={(id) => {
          setSelectedModIds(prev => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
          });
        }}
        onApply={() => finalizeAndSaveWorkout(true)}
        onKeepOriginal={() => finalizeAndSaveWorkout(false)}
      />
    </SafeAreaView>
  );
}
