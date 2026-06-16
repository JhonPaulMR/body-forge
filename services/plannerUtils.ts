import AsyncStorage from '@react-native-async-storage/async-storage';
import { db } from '@/database/schema';
import { SessionRepository } from '@/database/repositories/SessionRepository';
import { scheduleDailyWorkoutReminder } from './notificationService';

export async function scheduleNextWorkoutReminder() {
  try {
    const activeIdsStr = await AsyncStorage.getItem('active_routine_ids');
    if (!activeIdsStr) return;

    const activeIds: string[] = JSON.parse(activeIdsStr);
    if (activeIds.length === 0) return;

    const primaryRoutineId = activeIds[0];

    // Buscar a rotina
    const routine = db.getFirstSync<{ name: string }>(
      'SELECT name FROM routines WHERE id = ?',
      [primaryRoutineId]
    );

    if (!routine) return;

    // Buscar todos os dias ordenados
    const days = db.getAllSync<{ id: string, day_name: string, order_index: number }>(
      'SELECT id, day_name, order_index FROM routine_days WHERE routine_id = ? ORDER BY order_index ASC',
      [primaryRoutineId]
    );

    if (days.length === 0) return;

    // Achar o último feito
    const lastSessionIndex = SessionRepository.getLastSessionOrderIndex(primaryRoutineId);
    let nextIndex = 1;

    if (lastSessionIndex && lastSessionIndex.order_index) {
      nextIndex = lastSessionIndex.order_index + 1;
    }

    // Wrap around se passou do último dia
    let nextDay = days.find(d => d.order_index === nextIndex);
    if (!nextDay) {
      nextDay = days[0]; // Volta pro primeiro dia
    }

    if (nextDay) {
      await scheduleDailyWorkoutReminder(routine.name, nextDay.day_name);
    }
  } catch (error) {
    console.error('Erro ao agendar próximo treino:', error);
  }
}
