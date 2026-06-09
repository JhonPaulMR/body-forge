import { View, Text } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ExerciseList } from '@/components/exercises/ExerciseList';

export default function CatalogoScreen() {
  const insets = useSafeAreaInsets();

  return (
    <View className="flex-1 bg-forge-background" style={{ paddingTop: insets.top }}>
      <View className="px-6 pt-4 pb-2">
        <Text className="text-3xl font-black text-white">Catálogo</Text>
        <Text className="text-forge-muted text-sm mt-1">
          Explore os exercícios disponíveis e assista às animações
        </Text>
      </View>
      <View className="flex-1 px-4 mt-4">
        <ExerciseList />
      </View>
    </View>
  );
}
