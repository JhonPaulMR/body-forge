import { Stack } from 'expo-router';

export default function PlannerLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="details" />
      <Stack.Screen name="edit-exercise" />
      <Stack.Screen name="edit-set" options={{ presentation: 'modal' }} />
      <Stack.Screen name="exercise-picker" options={{ presentation: 'modal' }} />
    </Stack>
  );
}
