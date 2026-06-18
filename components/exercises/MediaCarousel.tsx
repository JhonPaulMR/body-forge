import { ExerciseMedia } from '@/database/repositories/ExerciseMediaRepository';
import { Camera, MoreVertical, Play, Pause, Volume2, VolumeX } from 'lucide-react-native';
import React, { useCallback, useRef, useState, useEffect } from 'react';
import { Dimensions, FlatList, Image as RNImage, Text, TouchableOpacity, View } from 'react-native';

import { useVideoPlayer, VideoView } from 'expo-video';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CAROUSEL_HEIGHT = 280;

interface CarouselItem {
  id: string;
  type: 'hero' | 'image' | 'video';
  uri: string;
  mediaId?: string;
}

interface MediaCarouselProps {
  heroImageUri: string | null;
  exerciseMedia: ExerciseMedia[];
  fallbackImage?: any;
  onMenuPress: (item: CarouselItem) => void;
}

export function MediaCarousel({ heroImageUri, exerciseMedia, fallbackImage, onMenuPress }: MediaCarouselProps) {
  const flatListRef = useRef<FlatList>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  // Build carousel items: hero image first, then media
  const items: CarouselItem[] = [];

  // Hero image (always first)
  if (heroImageUri) {
    items.push({ id: 'hero', type: 'hero', uri: heroImageUri });
  } else if (fallbackImage) {
    items.push({ id: 'hero', type: 'hero', uri: '' });
  }

  // Additional media
  exerciseMedia.forEach(m => {
    items.push({
      id: m.id,
      type: m.media_type === 'video' ? 'video' : 'image',
      uri: m.uri,
      mediaId: m.id,
    });
  });

  const onViewableItemsChanged = useCallback(({ viewableItems }: any) => {
    if (viewableItems?.length > 0) {
      setActiveIndex(viewableItems[0].index ?? 0);
    }
  }, []);

  const viewabilityConfig = { viewAreaCoveragePercentThreshold: 50 };

  const renderItem = ({ item }: { item: CarouselItem }) => {
    if (item.type === 'video') {
      return <VideoSlide uri={item.uri} />;
    }

    // ImageIcon as ImageLucide or hero
    return (
      <View style={{ width: SCREEN_WIDTH, height: CAROUSEL_HEIGHT }}>
        {item.uri ? (
          <RNImage
            source={{ uri: item.uri }}
            style={{ width: '100%', height: '100%' }}
            resizeMode="contain"
          />
        ) : fallbackImage ? (
          <RNImage
            source={fallbackImage}
            style={{ width: '100%', height: '100%' }}
            resizeMode="cover"
          />
        ) : (
          <View className="flex-1 bg-forge-surface justify-center items-center">
            <Camera size={40} color="#5F6368" />
          </View>
        )}
      </View>
    );
  };

  if (items.length === 0) {
    return (
      <View style={{ width: SCREEN_WIDTH, height: CAROUSEL_HEIGHT }} className="bg-forge-surface justify-center items-center">
        <Camera size={40} color="#5F6368" />
        <Text className="text-forge-muted text-xs mt-2">Sem mídia</Text>
      </View>
    );
  }

  return (
    <View>
      <FlatList
        ref={flatListRef}
        data={items}
        renderItem={renderItem}
        keyExtractor={item => item.id}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        getItemLayout={(_, index) => ({
          length: SCREEN_WIDTH,
          offset: SCREEN_WIDTH * index,
          index,
        })}
      />

      {/* Overlay: Menu button */}
      <TouchableOpacity
        className="absolute top-4 right-4 w-9 h-9 rounded-full bg-black/50 justify-center items-center"
        onPress={() => {
          const item = items[activeIndex] || items[0];
          if (item) {
            onMenuPress(item);
          }
        }}
      >
        <MoreVertical size={18} color="#FFF" />
      </TouchableOpacity>

      {/* Pagination dots */}
      {items.length > 1 && (
        <View className="absolute bottom-4 left-0 right-0 flex-row justify-center gap-1.5">
          {items.map((_, i) => (
            <View
              key={i}
              className={`h-1.5 rounded-full ${
                i === activeIndex ? 'bg-forge-accent w-5' : 'bg-white/40 w-1.5'
              }`}
            />
          ))}
        </View>
      )}
    </View>
  );
}

function VideoSlide({ uri }: { uri: string }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);

  const player = useVideoPlayer(uri, (player) => {
    player.loop = true;
    player.muted = isMuted;
  });

  useEffect(() => {
    if (player) {
      player.muted = isMuted;
    }
  }, [isMuted, player]);

  const togglePlay = () => {
    if (!player) return;
    if (player.playing) {
      player.pause();
      setIsPlaying(false);
    } else {
      player.play();
      setIsPlaying(true);
    }
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
  };

  return (
    <View style={{ width: SCREEN_WIDTH, height: CAROUSEL_HEIGHT }}>
      <VideoView
        player={player}
        style={{ width: '100%', height: '100%' }}
        contentFit="cover"
        nativeControls={false}
      />

      {/* Center Play/Pause button */}
      <TouchableOpacity
        className="absolute inset-0 justify-center items-center"
        activeOpacity={0.9}
        onPress={togglePlay}
      >
        <View className="w-16 h-16 rounded-full bg-black/40 justify-center items-center">
          {isPlaying ? (
            <Pause size={28} color="#FFF" fill="#FFF" />
          ) : (
            <Play size={28} color="#FFF" fill="#FFF" style={{ marginLeft: 4 }} />
          )}
        </View>
      </TouchableOpacity>

      {/* Mute toggle button */}
      <TouchableOpacity
        className="absolute bottom-4 right-4 w-10 h-10 rounded-full bg-black/50 justify-center items-center"
        activeOpacity={0.7}
        onPress={toggleMute}
      >
        {isMuted ? (
          <VolumeX size={20} color="#FFF" />
        ) : (
          <Volume2 size={20} color="#FFF" />
        )}
      </TouchableOpacity>
    </View>
  );
}
