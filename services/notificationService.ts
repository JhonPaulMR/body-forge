import Constants from 'expo-constants';
import { PermissionStatus } from 'expo-modules-core';
import { LogBox, Platform } from 'react-native';

/**
 * Porque o tigrinho-app pode mostrar notificações locais no Expo Go e o body-forge não (Android):
 * - tigrinho-app usa Expo SDK ~54 e import estático de expo-notifications em app/index.tsx
 *   (ver tigrinho-app/package.json: "expo": "~54.0.0", expo-notifications ~0.32).
 * - body-forge usa Expo SDK 55 (package.json expo ^55): no Expo Go Android o módulo pode
 *   inicializar incompleto ou com APIs undefined; por isso carregamos só por import dinâmico,
 *   validamos funções expostas e evitamos import em Expo Go Android (Constants.appOwnership === 'expo').
 * Notificações fiáveis: development build ou `npx expo run:android` / `expo run:ios`.
 */
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
    const Notifications = await loadNotifications();
    if (!Notifications) return;

    const granted = await ensureNotificationPermission();
    if (!granted) return;

    const trigger: null | { channelId: string } =
      Platform.OS === 'android' ? { channelId: DEFAULT_NOTIFICATION_CHANNEL_ID } : null;

    await Notifications.scheduleNotificationAsync({
      content: {
        title: payload.title,
        body: payload.body,
        data: payload.data ?? {},
      },
      trigger,
    });
  } catch (e) {
    console.warn('[notifications] schedule failed:', e);
  }
}
