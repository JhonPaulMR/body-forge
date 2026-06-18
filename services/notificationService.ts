import type { TimestampTrigger } from '@notifee/react-native';
import Constants from 'expo-constants';
import { PermissionStatus } from 'expo-modules-core';
import { LogBox, Platform } from 'react-native';

const isExpoGo = Constants.appOwnership === 'expo';

let notifee: any;
let AndroidImportance: any = { HIGH: 4, DEFAULT: 3, LOW: 2, MIN: 1, NONE: 0 };
let TriggerType: any = { TIMESTAMP: 0, INTERVAL: 1 };

function createMockNotifee() {
  return {
    requestPermission: async () => ({ authorizationStatus: 1 }),
    createChannel: async () => 'mock-channel',
    displayNotification: async () => {},
    createTriggerNotification: async () => {},
    cancelNotification: async () => {},
    getTriggerNotificationIds: async () => [],
    cancelTriggerNotifications: async () => {},
    registerForegroundService: () => {},
  };
}

if (!isExpoGo) {
  try {
    const notifeeModule = require('@notifee/react-native');
    notifee = notifeeModule.default;
    AndroidImportance = notifeeModule.AndroidImportance;
    TriggerType = notifeeModule.TriggerType;
    
    if (notifee && notifee.registerForegroundService) {
      notifee.registerForegroundService(() => {
        return new Promise(() => { });
      });
    }
  } catch (e) {
    console.warn('[notifee] Native module not found, using mock.');
    notifee = createMockNotifee();
  }
} else {
  notifee = createMockNotifee();
}

type ExpoNotifications = typeof import('expo-notifications');

/** Canal Android usado por todas as notificações locais; exige rebuild nativo após alterar o plugin em app.json. */
export const DEFAULT_NOTIFICATION_CHANNEL_ID = 'default';

let handlerConfigured = false;
let channelsConfigured = false;
let notificationsModule: ExpoNotifications | null | undefined;

LogBox.ignoreLogs([
  'expo-notifications: Android Push notifications',
  'expo-notifications',
]);

function isExpoGoAndroid(): boolean {
  return Platform.OS === 'android' && Constants.appOwnership === 'expo';
}

function isUsableNotificationsModule(mod: unknown): mod is ExpoNotifications {
  if (typeof mod !== 'object' || mod === null) return false;
  const m = mod as Record<string, unknown>;
  return (
    typeof m.setNotificationHandler === 'function' &&
    typeof m.getPermissionsAsync === 'function' &&
    typeof m.requestPermissionsAsync === 'function' &&
    typeof m.scheduleNotificationAsync === 'function'
  );
}

async function loadNotifications(): Promise<ExpoNotifications | null> {
  if (notificationsModule !== undefined) {
    return notificationsModule;
  }

  if (isExpoGoAndroid()) {
    notificationsModule = null;
    return null;
  }

  try {
    const imported = await import('expo-notifications');
    const candidate =
      imported &&
        typeof imported === 'object' &&
        'default' in imported &&
        imported.default &&
        typeof (imported as { default: unknown }).default === 'object'
        ? (imported as { default: ExpoNotifications }).default
        : (imported as ExpoNotifications);

    if (!isUsableNotificationsModule(candidate)) {
      notificationsModule = null;
      return null;
    }
    notificationsModule = candidate;
    return notificationsModule;
  } catch (e) {
    console.warn('[notifications] load failed:', e);
    notificationsModule = null;
    return null;
  }
}

/** True se o módulo nativo de notificações está utilizável (útil para mensagens na UI). */
export async function areLocalNotificationsAvailable(): Promise<boolean> {
  const mod = await loadNotifications();
  return mod !== null;
}

function configureNotificationHandler(Notifications: ExpoNotifications) {
  if (handlerConfigured) return;
  handlerConfigured = true;
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldPlaySound: false,
      shouldSetBadge: false,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });
}

async function ensureAndroidDefaultChannel(Notifications: ExpoNotifications) {
  if (Platform.OS !== 'android' || channelsConfigured) return;
  if (typeof Notifications.setNotificationChannelAsync !== 'function') return;
  await Notifications.setNotificationChannelAsync(DEFAULT_NOTIFICATION_CHANNEL_ID, {
    name: 'Geral',
    importance: Notifications.AndroidImportance.HIGH,
    vibrationPattern: [0, 250, 250, 250],
    sound: 'default',
  });
  channelsConfigured = true;
}

/**
 * Chame uma vez no arranque da app (ex.: RootLayout).
 * Após mudar o plugin expo-notifications em app.json, gere de novo o projeto nativo (prebuild / EAS).
 */
export async function initNotifications(): Promise<void> {
  try {
    const Notifications = await loadNotifications();
    if (!Notifications) return;
    configureNotificationHandler(Notifications);
    await ensureAndroidDefaultChannel(Notifications);
  } catch (e) {
    console.warn('[notifications] init failed:', e);
  }
}

export async function getNotificationPermissionStatus(): Promise<PermissionStatus> {
  try {
    const Notifications = await loadNotifications();
    if (!Notifications) return PermissionStatus.DENIED;
    const { status } = await Notifications.getPermissionsAsync();
    return status;
  } catch {
    return PermissionStatus.DENIED;
  }
}

export async function ensureNotificationPermission(): Promise<boolean> {
  try {
    const Notifications = await loadNotifications();
    if (!Notifications) return false;
    const { status: existing } = await Notifications.getPermissionsAsync();
    let finalStatus = existing;
    if (existing !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    return finalStatus === 'granted';
  } catch {
    return false;
  }
}

export type ImmediateNotificationPayload = {
  title: string;
  body: string;
  data?: Record<string, unknown>;
};

export async function scheduleImmediateLocalNotification(
  payload: ImmediateNotificationPayload
): Promise<void> {
  try {
    await requestNotifeePermissions();
    const channelId = await notifee.createChannel({
      id: 'default',
      name: 'Geral',
      importance: AndroidImportance.HIGH,
    });

    await notifee.displayNotification({
      title: payload.title,
      body: payload.body,
      data: payload.data as any,
      android: {
        channelId,
        importance: AndroidImportance.HIGH,
      },
    });
  } catch (e) {
    console.warn('[notifee] schedule immediate failed:', e);
  }
}

// ==========================================
// NOTIFEE IMPLEMENTATION (Novas Notificações)
// ==========================================

export async function requestNotifeePermissions() {
  await notifee.requestPermission();
}

export async function startRestTimerNotification(seconds: number) {
  if (!notifee || !notifee.createChannel) return;
  
  const { useSettingsStore } = require('@/hooks/useSettingsStore');
  const settings = useSettingsStore.getState();
  
  if (!settings.restTimerEnabled) return;

  try {
    await requestNotifeePermissions();

    const channelId = await notifee.createChannel({
      id: 'rest_timer',
      name: 'Cronômetro de Descanso',
      importance: AndroidImportance.HIGH,
    });

    const alertChannelId = await notifee.createChannel({
      id: 'rest_timer_alerts',
      name: 'Alertas de Descanso',
      importance: AndroidImportance.HIGH,
      sound: settings.restTimerSound ? 'default' : undefined,
    });

    const timestamp = Date.now() + seconds * 1000;
    
    // Usaremos esta ID para o cronômetro visual
    const NOTIFICATION_ID = 'rest_timer_notification'; 

    // 1. Exibe a notificação inicial com o cronômetro rodando
    await notifee.displayNotification({
      id: NOTIFICATION_ID,
      title: 'Descanso Ativo ⏱️',
      body: 'Recuperando o fôlego...',
      android: {
        channelId,
        onlyAlertOnce: true,
        ongoing: true, // Impede que o usuário arraste e feche a notificação
        showChronometer: true,
        chronometerDirection: 'down',
        timestamp,
        color: '#A0C4FF',
      },
    });

    // 2. Agendar aviso de finalização (Uma nova notificação separada)
    const trigger0s: TimestampTrigger = {
      type: TriggerType.TIMESTAMP,
      timestamp: timestamp,
      alarmManager: {
        allowWhileIdle: true,
      },
    };
    
    await notifee.createTriggerNotification(
      {
        id: 'rest_timer_end_notification',
        title: '🔥 Tempo esgotado!',
        body: 'Fim do descanso. Volte para a barra!',
        android: {
          channelId: alertChannelId,
          importance: AndroidImportance.HIGH,
          ongoing: false, // Agora permite que o usuário feche a notificação
          vibrationPattern: settings.restTimerVibration ? [0, 500, 200, 500] : undefined,
        },
      },
      trigger0s
    );
  } catch (e) {
    console.warn('[notifee] Falha ao iniciar cronômetro:', e);
  }
}

export async function stopRestTimerNotification(cancelAlert: boolean = true) {
  if (!notifee || !notifee.cancelNotification) return;
  try {
    await notifee.cancelNotification('rest_timer_notification');
    if (cancelAlert) {
      await notifee.cancelTriggerNotification('rest_timer_end_notification');
      await notifee.cancelNotification('rest_timer_end_notification');
    }
  } catch (e) { }
}

export function setupNotificationListeners(router: any) {
  if (!notifee || !notifee.onForegroundEvent) return () => {};

  const unsubscribe = notifee.onForegroundEvent(({ type, detail }: any) => {
    // 1 é EventType.PRESS
    if (type === 1 && detail.notification?.id?.startsWith('rest_timer')) {
      router.push('/treino');
    }
  });

  notifee.getInitialNotification().then((initialNotification: any) => {
    if (initialNotification && initialNotification.notification?.id?.startsWith('rest_timer')) {
      setTimeout(() => router.push('/treino'), 500);
    }
  });

  return unsubscribe;
}

export async function scheduleDailyWorkoutReminder(routineName: string, dayName: string) {
  const { useSettingsStore } = require('@/hooks/useSettingsStore');
  const settings = useSettingsStore.getState();

  try {
    // Se estiver desativado, apenas garantimos que a notificação existente seja cancelada
    if (!settings.dailyReminders) {
      if (notifee && notifee.cancelNotification) {
        await notifee.cancelNotification('daily_workout_reminder');
      }
      return;
    }

    await requestNotifeePermissions();
    const channelId = await notifee.createChannel({
      id: 'daily_reminder',
      name: 'Lembretes de Treino',
      importance: AndroidImportance.DEFAULT,
    });

    await notifee.cancelNotification('daily_workout_reminder');

    const now = new Date();
    let triggerTime = new Date();
    triggerTime.setHours(8, 0, 0, 0);

    if (now.getTime() >= triggerTime.getTime()) {
      triggerTime.setDate(triggerTime.getDate() + 1);
    }

    const trigger: TimestampTrigger = {
      type: TriggerType.TIMESTAMP,
      timestamp: triggerTime.getTime(),
      alarmManager: true, // required for exact timing in background
    };

    await notifee.createTriggerNotification(
      {
        id: 'daily_workout_reminder',
        title: 'Lembrete de Treino do Dia 💪',
        body: `Hoje o treino é o ${dayName} do plano ${routineName}.`,
        android: {
          channelId,
        },
      },
      trigger
    );
  } catch (e) {
    console.warn('[notifee] Falha ao agendar lembrete:', e);
  }
}
