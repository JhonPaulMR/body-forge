import { Stack } from 'expo-router';

export default function WorkoutLayout() {
  return (
    <Stack screenOptions={{ headerShown: false, animation: 'fade' }}>
      <Stack.Screen name="summary" />
      <Stack.Screen name="complete" />
    </Stack>
  );
}
