import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Image } from 'expo-image';
import { ExerciseRepository, Exercise } from '@/database/repositories/ExerciseRepository';
import { Dumbbell } from 'lucide-react-native';

export function ExerciseList() {
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadExercises(true);
  }, []);

  const loadExercises = async (isInitial = false) => {
    if (loading) return;
    setLoading(true);
    
    try {
      const currentOffset = isInitial ? 0 : page * 20;
      const data = await ExerciseRepository.getAllPaginated(20, currentOffset);
      
      if (data.length > 0) {
        setExercises(prev => isInitial ? data : [...prev, ...data]);
        setPage(prev => (isInitial ? 1 : prev + 1));
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const renderItem = ({ item }: { item: Exercise }) => (
    <TouchableOpacity className="flex-row items-center p-4 border-b border-forge-border bg-forge-surface-alt mb-2 rounded-2xl">
      {item.gif_url ? (
        <Image
          source={{ uri: item.gif_url }}
          style={{ width: 80, height: 80, borderRadius: 12, marginRight: 16 }}
          contentFit="cover"
          cachePolicy="memory" // Importante: Cache na RAM para economizar disco durante navegação livre
          placeholder={null}
        />
      ) : (
        <View className="w-20 h-20 bg-forge-surface rounded-xl mr-4 items-center justify-center">
          <Dumbbell color="#5F6368" size={32} />
        </View>
      )}
      <View className="flex-1">
        <Text className="text-white text-base font-bold capitalize" numberOfLines={2}>{item.name}</Text>
        <Text className="text-forge-muted text-sm capitalize mt-1 font-semibold">Alvo: {item.target || item.body_part}</Text>
        {item.equipment && (
          <Text className="text-forge-muted-dark text-xs capitalize mt-0.5">{item.equipment}</Text>
        )}
      </View>
    </TouchableOpacity>
  );

  return (
    <View className="flex-1">
      <FlatList
        data={exercises}
        keyExtractor={item => item.id}
        renderItem={renderItem}
        onEndReached={() => loadExercises(false)}
        onEndReachedThreshold={0.5}
        initialNumToRender={8}
        maxToRenderPerBatch={8}
        windowSize={5}
        removeClippedSubviews={true}
        ListFooterComponent={loading ? <ActivityIndicator color="#A0C4FF" style={{ margin: 20 }} /> : null}
      />
    </View>
  );
}
