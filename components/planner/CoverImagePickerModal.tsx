import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Image, Modal, FlatList, ActivityIndicator } from 'react-native';
import { X, Camera, Search } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';

const predefinedCovers = [
  'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=500', 
  'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?q=80&w=500',
  'https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?q=80&w=500',
  'https://images.unsplash.com/photo-1541534741688-6078c6bfb5c5?q=80&w=500',
  'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?q=80&w=500',
  'https://images.unsplash.com/photo-1603287681836-b174ce5074c2?q=80&w=500',
  'https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?q=80&w=500',
  'https://images.unsplash.com/photo-1530822847156-5df684ec5ee1?q=80&w=500',
];

interface Props {
  visible: boolean;
  onClose: () => void;
  onSelectCover: (uri: string) => void;
}

export default function CoverImagePickerModal({ visible, onClose, onSelectCover }: Props) {
  const [unsplashQuery, setUnsplashQuery] = useState('');
  const [unsplashResults, setUnsplashResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchPage, setSearchPage] = useState(1);

  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [16, 9],
      quality: 0.8,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      onSelectCover(result.assets[0].uri);
      onClose();
    }
  };

  const searchUnsplash = async (query: string, page: number = 1, append: boolean = false) => {
    if (!query) {
      setUnsplashResults([]);
      return;
    }
    
    setIsSearching(true);
    try {
      const response = await fetch(`https://api.unsplash.com/search/photos?page=${page}&per_page=14&query=${encodeURIComponent(query)}&orientation=landscape`, {
        headers: {
          'Authorization': `Client-ID ${process.env.EXPO_PUBLIC_UNSPLASH_ACCESS_KEY}`
        }
      });
      const data = await response.json();
      
      if (data && data.results) {
        if (append) {
          setUnsplashResults(prev => [...prev, ...data.results]);
        } else {
          setUnsplashResults(data.results);
        }
        setSearchPage(page);
      }
    } catch (error) {
      console.error('Unsplash error:', error);
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View className="flex-1 bg-forge-bg pt-12">
        {/* Header */}
        <View className="flex-row items-center px-4 pb-4 border-b border-forge-border">
          <TouchableOpacity onPress={onClose} className="w-10 h-10 justify-center items-center">
            <X size={24} color="#FFF" />
          </TouchableOpacity>
          <View className="flex-1 bg-forge-surface-hover ml-2 mr-2 rounded-2xl flex-row items-center px-3 py-2">
            <Search size={18} color="#5F6368" />
            <TextInput
              className="flex-1 ml-2 text-white text-[13px] font-semibold"
              placeholder="Search Unsplash..."
              placeholderTextColor="#5F6368"
              value={unsplashQuery}
              onChangeText={setUnsplashQuery}
              onSubmitEditing={() => searchUnsplash(unsplashQuery, 1)}
              returnKeyType="search"
            />
            {unsplashQuery.length > 0 && (
              <TouchableOpacity onPress={() => { setUnsplashQuery(''); setUnsplashResults([]); }}>
                <X size={16} color="#5F6368" />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {isSearching && unsplashResults.length === 0 ? (
          <View className="flex-1 justify-center items-center">
            <ActivityIndicator size="large" color="#A0C4FF" />
            <Text className="text-forge-muted mt-4 font-bold text-xs tracking-widest">SEARCHING...</Text>
          </View>
        ) : (
          <FlatList
            data={unsplashResults.length > 0 ? unsplashResults : ['UPLOAD_CUSTOM', ...predefinedCovers]}
            keyExtractor={(item, idx) => typeof item === 'string' ? item + idx : item.id}
            numColumns={2}
            contentContainerStyle={{ padding: 16 }}
            columnWrapperStyle={{ justifyContent: 'space-between' }}
            renderItem={({ item, index }) => {
              const isUnsplash = unsplashResults.length > 0;
              
              if (item === 'UPLOAD_CUSTOM') {
                return (
                  <TouchableOpacity
                    className="w-[48%] aspect-[4/5] bg-forge-surface rounded-2xl justify-center items-center mb-4 border border-forge-border"
                    onPress={pickImage}
                  >
                    <View className="w-14 h-14 rounded-full bg-forge-accent-bg justify-center items-center mb-3">
                      <Camera size={24} color="#A0C4FF" />
                    </View>
                    <Text className="text-white text-sm font-bold">Upload Custom</Text>
                  </TouchableOpacity>
                );
              }

              const uri = isUnsplash ? item.urls.small : item;
              const author = isUnsplash ? item.user.name : null;

              return (
                <TouchableOpacity
                  className="w-[48%] aspect-[4/5] bg-forge-surface rounded-2xl overflow-hidden mb-4"
                  onPress={() => {
                    onSelectCover(isUnsplash ? item.urls.regular : uri);
                    onClose();
                  }}
                >
                  <Image source={{ uri }} className="w-full h-full" />
                  {author && (
                    <View className="absolute bottom-0 left-0 right-0 bg-black/50 px-2 py-1.5">
                      <Text className="text-white text-[10px] font-semibold" numberOfLines={1}>{author}</Text>
                    </View>
                  )}
                </TouchableOpacity>
              );
            }}
            onEndReached={() => {
              if (unsplashResults.length > 0 && !isSearching) {
                searchUnsplash(unsplashQuery, searchPage + 1, true);
              }
            }}
            onEndReachedThreshold={0.5}
            ListFooterComponent={
              isSearching && unsplashResults.length > 0 ? (
                <View className="py-4 items-center">
                  <ActivityIndicator size="small" color="#A0C4FF" />
                </View>
              ) : null
            }
          />
        )}
      </View>
    </Modal>
  );
}
