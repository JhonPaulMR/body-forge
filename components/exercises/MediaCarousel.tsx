import { ExerciseMedia } from '@/database/repositories/ExerciseMediaRepository';
import { Camera, MoreVertical, Play } from 'lucide-react-native';
import React, { useCallback, useRef, useState } from 'react';
import { Dimensions, FlatList, Image as RNImage, Text, TouchableOpacity, View } from 'react-native';

let Video: any = null;
let ResizeMode: any = { CONTAIN: 'contain', COVER: 'cover', STRETCH: 'stretch' };
try {
  const ExpoAV = require('expo-av');
  Video = ExpoAV?.Video;
  ResizeMode = ExpoAV?.ResizeMode || ResizeMode;
} catch (e) {
  console.warn('expo-av not available in Expo Go', e);
  Video = (props: any) => (
    <View style={[props.style, { justifyContent: 'center', alignItems: 'center', backgroundColor: '#000' }]}>
      <Text style={{ color: '#fff' }}>Vídeo offline (Requer Build Nativa)</Text>
    </View>
  );
}

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

// ─── Video Slide ──────────────────────────────────────────────────
function VideoSlide({ uri }: { uri: string }) {
  const videoRef = useRef<any>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  const togglePlay = async () => {
    if (!videoRef.current) return;
    if (isPlaying && videoRef.current.pauseAsync) {
      await videoRef.current.pauseAsync();
    } else if (!isPlaying && videoRef.current.playAsync) {
      await videoRef.current.playAsync();
    }
    setIsPlaying(!isPlaying);
  };

  return (
    <TouchableOpacity
      activeOpacity={0.9}
      onPress={togglePlay}
      style={{ width: SCREEN_WIDTH, height: CAROUSEL_HEIGHT }}
    >
      <Video
        ref={videoRef}
        source={{ uri }}
        style={{ width: '100%', height: '100%' }}
        resizeMode={ResizeMode.COVER}
        isLooping
        shouldPlay={false}
        useNativeControls={false}
        onPlaybackStatusUpdate={(status: any) => {
          if (status.isLoaded) {
            setIsPlaying(status.isPlaying);
          }
        }}
      />

      {/* Play overlay */}
      {!isPlaying && (
        <View className="absolute inset-0 justify-center items-center bg-black/20">
          <View className="w-14 h-14 rounded-full bg-black/50 justify-center items-center">
            <Play size={24} color="#FFF" fill="#FFF" />
          </View>
        </View>
      )}
    </TouchableOpacity>
  );
}
