import React from 'react';
import { View, Text, TouchableOpacity, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { UserRoutine } from '@/hooks/usePlansData';
import { Dumbbell } from 'lucide-react-native';

interface PlanCardProps {
  plan: UserRoutine;
}

export function PlanCard({ plan }: PlanCardProps) {
  const router = useRouter();

  const handlePress = () => {
    router.push({
      pathname: '/planner/details',
      params: { routineId: plan.id }
    });
  };

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={handlePress}
      className="w-44 h-60 rounded-3xl mr-4 overflow-hidden bg-forge-surface border border-forge-border"
    >
      <Image
        source={{ uri: plan.cover_image_uri || 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=1000' }}
        className="w-full h-full absolute"
        resizeMode="cover"
      />
      <LinearGradient
        colors={['transparent', 'rgba(11, 14, 20, 0.7)', 'rgba(11, 14, 20, 0.95)']}
        className="absolute w-full h-full"
      />
      
      <View className="flex-1 justify-end p-4">
        <Text className="text-white text-lg font-black tracking-tight mb-2 leading-tight" numberOfLines={2}>
          {plan.name}
        </Text>
        
        <View className="flex-row items-center gap-1.5">
          <Dumbbell size={14} color="#A0C4FF" />
          <Text className="text-forge-muted text-[11px] font-bold tracking-widest uppercase">
            {plan.day_count} {plan.day_count === 1 ? 'dia' : 'dias'}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}
