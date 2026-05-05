import React from 'react';
import { Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function GenericScreen() {
  return (
    <SafeAreaView className="flex-1 bg-forge-bg items-center justify-center">
      <Text className="text-white text-xl font-bold">Em desenvolvimento</Text>
    </SafeAreaView>
  );
}
