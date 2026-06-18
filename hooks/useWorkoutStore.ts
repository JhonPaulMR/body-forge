import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { startRestTimerNotification, stopRestTimerNotification } from '@/services/notificationService';

export interface WorkoutSet {
  id: string;
  weight: number;
  reps: number;
  is_completed: boolean;
  is_warmup: boolean;
  is_dropset?: boolean;
  is_to_failure?: boolean;
  dropset_group_id?: string;
}

export interface WorkoutExercise {
  id: string;
  exercise_id: string;
  name: string;
  muscle_group: string;
  image_uri: string | null;
  target_sets: number;
  target_reps: string;
  rest_time_seconds: number;
  superset_id: string | null;
  sets: WorkoutSet[];
  previous_sets: { weight: number; reps: number }[];
}

export interface Modification {
  type: 'SWAPPED_EXERCISE' | 'DELETED_EXERCISE' | 'ADDED_EXERCISE' | 'CREATED_SUPERSET' | 'CHANGED_REST';
  originalExerciseId?: string;
  newExerciseId?: string;
  exerciseName?: string;
  supersetId?: string;
  newRestTime?: number;
}

export interface RestTimer {
  isActive: boolean;
  totalSeconds: number;
  restEndTime: number | null;
}

interface WorkoutState {
  isActive: boolean;
  sessionId: string | null;
  routineDayId: string | null;
  startTime: number | null;
  elapsedSeconds: number;
  exercises: WorkoutExercise[];
  modifications: Modification[];
  restTimer: RestTimer;
  hasStructuralChanges: boolean;

  // Ações de fluxo
  startWorkout: (sessionId: string, routineDayId: string | null, exercises: WorkoutExercise[]) => void;
  startFreeWorkout: (sessionId: string) => void;
  finishWorkout: () => void;
  cancelWorkout: () => void;
  incrementTime: () => void;

  // Ações de Set
  updateSet: (exerciseId: string, setId: string, data: Partial<WorkoutSet>) => void;
  addSet: (exerciseId: string) => void;
  addDropSet: (exerciseId: string, afterSetId: string) => void;
  removeSet: (exerciseId: string, setId: string) => void;
  completeSet: (exerciseId: string, setId: string) => void;
  toggleSetFailure: (exerciseId: string, setId: string) => void;
  toggleSetWarmup: (exerciseId: string, setId: string) => void;

  // Ações de Exercício Ativo
  removeExercise: (exerciseId: string) => void;
  addExercisesToActive: (newExercises: WorkoutExercise[]) => void;
  replaceExerciseInActive: (oldId: string, newExercise: WorkoutExercise) => void;
  createSuperset: (exerciseIds: string[]) => void;
  removeSuperset: (supersetId: string) => void;

  // Ações de Descanso
  startRestTimer: (seconds: number) => void;
  decrementRestTimer: () => void;
  stopRestTimer: (isManual?: boolean | any) => void;
  addRestTime: (seconds: number) => void;

  // Modificações de Treino
  swapExercise: (oldExerciseId: string, newExerciseId: string, newName: string, newImage: string | null) => void;
  deleteExercise: (exerciseId: string) => void;
  addExercise: (exercise: WorkoutExercise) => void;
}

const generateId = () => Math.random().toString(36).substring(2, 9);

// Helper: find exercise + set by id (returns indices for immer mutations)
const findExSet = (exercises: WorkoutExercise[], exerciseId: string, setId: string) => {
  const exIdx = exercises.findIndex((e: any) => e.id === exerciseId);
  if (exIdx === -1) return null;
  const setIdx = exercises[exIdx].sets.findIndex((s: any) => s.id === setId);
  if (setIdx === -1) return null;
  return { exIdx, setIdx };
};

export const useWorkoutStore = create<WorkoutState>()(
  persist(
    immer((set) => ({
      isActive: false,
      sessionId: null,
      routineDayId: null,
      startTime: null,
      elapsedSeconds: 0,
      exercises: [],
      modifications: [],
      hasStructuralChanges: false,
      restTimer: {
        isActive: false,
        totalSeconds: 0,
        restEndTime: null,
      },

      startWorkout: (sessionId, routineDayId, exercises) =>
        set((state) => {
          state.isActive = true;
          state.sessionId = sessionId;
          state.routineDayId = routineDayId;
          state.startTime = Date.now();
          state.elapsedSeconds = 0;
          state.exercises = exercises;
          state.modifications = [];
          state.hasStructuralChanges = false;
          state.restTimer = { isActive: false, totalSeconds: 0, restEndTime: null };
        }),

      startFreeWorkout: (sessionId) =>
        set((state) => {
          state.isActive = true;
          state.sessionId = sessionId;
          state.routineDayId = null;
          state.startTime = Date.now();
          state.elapsedSeconds = 0;
          state.exercises = [];
          state.modifications = [];
          state.hasStructuralChanges = false;
          state.restTimer = { isActive: false, totalSeconds: 0, restEndTime: null };
        }),

      finishWorkout: () => {
        set((state) => {
          state.isActive = false;
          state.sessionId = null;
          state.routineDayId = null;
          state.startTime = null;
          state.elapsedSeconds = 0;
          state.exercises = [];
          state.modifications = [];
          state.hasStructuralChanges = false;
          state.restTimer = { isActive: false, totalSeconds: 0, restEndTime: null };
        });
        stopRestTimerNotification();
      },

      cancelWorkout: () => {
        set((state) => {
          state.isActive = false;
          state.sessionId = null;
          state.routineDayId = null;
          state.startTime = null;
          state.elapsedSeconds = 0;
          state.exercises = [];
          state.modifications = [];
          state.hasStructuralChanges = false;
          state.restTimer = { isActive: false, totalSeconds: 0, restEndTime: null };
        });
        stopRestTimerNotification();
      },

      // Only touches elapsedSeconds — isolated from exercises
      incrementTime: () =>
        set((state) => {
          if (state.isActive && state.startTime) {
            state.elapsedSeconds = Math.floor((Date.now() - state.startTime) / 1000);
          }
        }),

    // SURGICAL: only mutates the specific set
    updateSet: (exerciseId, setId, data) =>
      set((state) => {
        const found = findExSet(state.exercises, exerciseId, setId);
        if (!found) return;
        Object.assign(state.exercises[found.exIdx].sets[found.setIdx], data);
      }),

    addSet: (exerciseId) =>
      set((state) => {
        const exIdx = state.exercises.findIndex((e: any) => e.id === exerciseId);
        if (exIdx === -1) return;
        const ex = state.exercises[exIdx];
        const lastSet = ex.sets[ex.sets.length - 1];
        ex.sets.push({
          id: generateId(),
          weight: lastSet ? lastSet.weight : 0,
          reps: lastSet ? lastSet.reps : 0,
          is_completed: false,
          is_warmup: false,
          is_to_failure: false,
        });
        state.hasStructuralChanges = true;
      }),

    addDropSet: (exerciseId, afterSetId) =>
      set((state) => {
        const exIdx = state.exercises.findIndex((e: any) => e.id === exerciseId);
        if (exIdx === -1) return;
        const setIndex = state.exercises[exIdx].sets.findIndex((s: any) => s.id === afterSetId);
        if (setIndex === -1) return;

        const prevSet = state.exercises[exIdx].sets[setIndex];
        state.exercises[exIdx].sets.splice(setIndex + 1, 0, {
          id: generateId(),
          weight: prevSet.weight,
          reps: prevSet.reps,
          is_completed: false,
          is_warmup: false,
          is_dropset: true,
          is_to_failure: false,
        });
        state.hasStructuralChanges = true;
      }),

    removeSet: (exerciseId, setId) =>
      set((state) => {
        const exIdx = state.exercises.findIndex((e: any) => e.id === exerciseId);
        if (exIdx === -1) return;
        const setIdx = state.exercises[exIdx].sets.findIndex((s: any) => s.id === setId);
        if (setIdx !== -1) {
          state.exercises[exIdx].sets.splice(setIdx, 1);
        }
        state.hasStructuralChanges = true;
      }),

    completeSet: (exerciseId, setId) =>
      set((state) => {
        const found = findExSet(state.exercises, exerciseId, setId);
        if (!found) return;
        const { exIdx, setIdx } = found;
        const completedSet = state.exercises[exIdx].sets[setIdx];
        completedSet.is_completed = true;

        // Autofill next uncompleted set
        const sets = state.exercises[exIdx].sets;
        for (let i = setIdx + 1; i < sets.length; i++) {
          if (!sets[i].is_completed && sets[i].weight === 0 && sets[i].reps === 0) {
            sets[i].weight = completedSet.weight;
            sets[i].reps = completedSet.reps;
            break;
          }
        }
      }),

    toggleSetFailure: (exerciseId, setId) =>
      set((state) => {
        const found = findExSet(state.exercises, exerciseId, setId);
        if (!found) return;
        const s = state.exercises[found.exIdx].sets[found.setIdx];
        s.is_to_failure = !s.is_to_failure;
        state.hasStructuralChanges = true;
      }),

    toggleSetWarmup: (exerciseId, setId) =>
      set((state) => {
        const found = findExSet(state.exercises, exerciseId, setId);
        if (!found) return;
        const s = state.exercises[found.exIdx].sets[found.setIdx];
        s.is_warmup = !s.is_warmup;
        state.hasStructuralChanges = true;
      }),

    removeExercise: (exerciseId) =>
      set((state) => {
        const idx = state.exercises.findIndex((ex: any) => ex.id === exerciseId);
        if (idx !== -1) {
          state.exercises.splice(idx, 1);
        }
        state.hasStructuralChanges = true;
      }),

    addExercisesToActive: (newExercises) =>
      set((state) => {
        state.exercises.push(...newExercises);
        state.hasStructuralChanges = true;
      }),

    replaceExerciseInActive: (oldId, newExercise) =>
      set((state) => {
        const idx = state.exercises.findIndex((e: any) => e.id === oldId);
        if (idx === -1) return;
        state.exercises[idx] = newExercise;
        state.hasStructuralChanges = true;
      }),

    createSuperset: (exerciseIds) =>
      set((state) => {
        const supersetId = 'ss_' + Date.now();
        state.exercises.forEach((ex: any) => {
          if (exerciseIds.includes(ex.id)) {
            ex.superset_id = supersetId;
          }
        });
        state.hasStructuralChanges = true;
      }),

    removeSuperset: (supersetId) =>
      set((state) => {
        state.exercises.forEach((ex: any) => {
          if (ex.superset_id === supersetId) {
            ex.superset_id = null;
          }
        });
        state.hasStructuralChanges = true;
      }),

    startRestTimer: (seconds) => {
      set((state) => {
        state.restTimer = {
          isActive: true,
          totalSeconds: seconds,
          restEndTime: Date.now() + seconds * 1000,
        };
      });
      startRestTimerNotification(seconds);
    },

    decrementRestTimer: () =>
      set((state) => {
        if (state.restTimer.isActive && state.restTimer.restEndTime) {
          if (Date.now() >= state.restTimer.restEndTime) {
            state.restTimer.isActive = false;
            state.restTimer.restEndTime = null;
          }
        }
      }),

    stopRestTimer: (isManual) => {
      const shouldCancelAlert = isManual === true || typeof isManual === 'object';
      set((state) => {
        state.restTimer.isActive = false;
        state.restTimer.restEndTime = null;
      });
      stopRestTimerNotification(shouldCancelAlert);
    },

    addRestTime: (seconds) => {
      let newTotal = 0;
      let remaining = 0;
      set((state) => {
        state.restTimer.totalSeconds += seconds;
        state.restTimer.restEndTime = state.restTimer.restEndTime
          ? state.restTimer.restEndTime + seconds * 1000
          : Date.now() + seconds * 1000;
        newTotal = state.restTimer.totalSeconds;
        remaining = Math.max(0, Math.ceil((state.restTimer.restEndTime - Date.now()) / 1000));
      });
      if (remaining > 0) {
        // Cancel old and start new to refresh foreground service and triggers
        stopRestTimerNotification().then(() => {
          startRestTimerNotification(remaining);
        });
      }
    },

    swapExercise: (oldExerciseId, newExerciseId, newName, newImage) =>
      set((state) => {
        const ex = state.exercises.find((e: any) => e.id === oldExerciseId);
        if (!ex) return;
        ex.exercise_id = newExerciseId;
        ex.name = newName;
        ex.image_uri = newImage;
        ex.sets.forEach((s: any) => { s.weight = 0; s.reps = 0; s.is_completed = false; });
        state.modifications.push({
          type: 'SWAPPED_EXERCISE',
          originalExerciseId: oldExerciseId,
          newExerciseId,
          exerciseName: newName,
        });
      }),

    deleteExercise: (exerciseId) =>
      set((state) => {
        const idx = state.exercises.findIndex((ex: any) => ex.id === exerciseId);
        if (idx !== -1) {
          state.exercises.splice(idx, 1);
        }
        state.modifications.push({
          type: 'DELETED_EXERCISE',
          originalExerciseId: exerciseId,
        });
      }),

    addExercise: (exercise) =>
      set((state) => {
        state.exercises.push(exercise);
        state.modifications.push({
          type: 'ADDED_EXERCISE',
          newExerciseId: exercise.exercise_id,
          exerciseName: exercise.name,
        });
      }),
    })),
    {
      name: 'workout-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        isActive: state.isActive,
        sessionId: state.sessionId,
        routineDayId: state.routineDayId,
        startTime: state.startTime,
        exercises: state.exercises,
        modifications: state.modifications,
        restTimer: state.restTimer,
        hasStructuralChanges: state.hasStructuralChanges,
      }),
    }
  )
);
