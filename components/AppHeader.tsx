import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Menu } from 'lucide-react-native';

export function AppHeader() {
  return (
    <View className="flex-row items-center justify-between py-2 px-5 mb-4">
      <TouchableOpacity>
        <Menu size={24} color="#FFF" />
      </TouchableOpacity>
      <Text className="text-white text-lg font-black tracking-wide">BODY FORGE</Text>
      <View className="w-9 h-9 rounded-full bg-forge-border justify-center items-center">
         <View className="w-8 h-8 bg-forge-avatar rounded-2xl overflow-hidden">
           <View className="flex-1 bg-forge-skin mt-2 mx-1.5 rounded-t-[10px]" />
         </View>
      </View>
    </View>
  );
}
