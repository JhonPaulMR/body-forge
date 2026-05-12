import React from 'react';
import { View, Text, Image, TouchableOpacity } from 'react-native';

interface FeaturedPlanCardProps {
  title: string;
  duration: string;
  frequency: string;
  image: string;
}

export function FeaturedPlanCard({ title, duration, frequency, image }: FeaturedPlanCardProps) {
  return (
    <>
      <Text className="text-forge-muted text-[11px] font-bold tracking-wide mb-3">EM DESTAQUE</Text>
      <View className="h-[180px] rounded-[20px] overflow-hidden mb-6 bg-forge-surface-hover">
        <Image
          source={{ uri: image }}
          className="w-full h-full absolute opacity-35"
        />
        <View className="flex-1 p-5 justify-end flex-row items-end">
          <View className="flex-1">
            <Text className="text-white text-[26px] font-black mb-1.5">{title}</Text>
            <Text className="text-forge-text-secondary text-xs font-semibold">
              {duration} • {frequency}
            </Text>
          </View>
          <TouchableOpacity className="bg-forge-accent px-5 py-2.5 rounded-3xl">
            <Text className="text-forge-bg text-xs font-extrabold tracking-tight">COMEÇAR</Text>
          </TouchableOpacity>
        </View>
      </View>
    </>
  );
}
