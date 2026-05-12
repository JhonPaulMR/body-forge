import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Modal, Pressable, ActivityIndicator } from 'react-native';
import { X, ArrowDown, Check } from 'lucide-react-native';
import { isValidYoutubeUrl, downloadAndAddVideo } from '@/services/exerciseMediaService';
import { VideoQuality } from '@/constants/api';

interface YouTubeDownloadModalProps {
  visible: boolean;
  exerciseId: string;
  onClose: () => void;
  onDownloadComplete: () => void;
}

export function YouTubeDownloadModal({ visible, exerciseId, onClose, onDownloadComplete }: YouTubeDownloadModalProps) {
  const [url, setUrl] = useState('');
  const [quality, setQuality] = useState<VideoQuality>('sd');
  const [isDownloading, setIsDownloading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleDownload = async () => {
    if (!isValidYoutubeUrl(url)) {
      setError('Link inválido. Use um link do YouTube válido.');
      return;
    }

    setError(null);
    setIsDownloading(true);
    setProgress(0);

    try {
      await downloadAndAddVideo(exerciseId, url.trim(), quality, (p) => {
        setProgress(p);
      });

      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        setUrl('');
        setProgress(0);
        onDownloadComplete();
        onClose();
      }, 1200);
    } catch (err: any) {
      setError(err.message || 'Erro ao baixar o vídeo.');
    } finally {
      setIsDownloading(false);
    }
  };

  const handleClose = () => {
    if (isDownloading) return; // Prevent closing during download
    setUrl('');
    setError(null);
    setProgress(0);
    setSuccess(false);
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="slide">
      <Pressable className="flex-1 bg-black/60 justify-end" onPress={handleClose}>
        <Pressable className="bg-forge-surface rounded-t-3xl px-5 pt-5 pb-10">
          {/* Header */}
          <View className="flex-row items-center justify-between mb-6">
            <Text className="text-white text-base font-extrabold tracking-wide">ADICIONAR VÍDEO</Text>
            <TouchableOpacity
              onPress={handleClose}
              disabled={isDownloading}
              className="w-8 h-8 rounded-full bg-forge-border justify-center items-center"
              style={{ opacity: isDownloading ? 0.3 : 1 }}
            >
              <X size={16} color="#FFF" />
            </TouchableOpacity>
          </View>

          {/* URL Input */}
          <Text className="text-forge-muted text-[10px] font-bold tracking-widest mb-2">LINK DO YOUTUBE</Text>
          <TextInput
            className="bg-forge-bg rounded-xl p-4 text-white text-sm font-medium border border-forge-border mb-5"
            placeholder="https://youtube.com/shorts/..."
            placeholderTextColor="#5F6368"
            value={url}
            onChangeText={(t) => { setUrl(t); setError(null); }}
            autoCapitalize="none"
            autoCorrect={false}
            editable={!isDownloading}
          />

          {/* Quality Selector */}
          <Text className="text-forge-muted text-[10px] font-bold tracking-widest mb-3">QUALIDADE</Text>
          <View className="flex-row gap-3 mb-6">
            <TouchableOpacity
              className={`flex-1 py-4 rounded-xl border items-center ${
                quality === 'sd'
                  ? 'bg-forge-accent/15 border-forge-accent'
                  : 'bg-forge-bg border-forge-border'
              }`}
              onPress={() => setQuality('sd')}
              disabled={isDownloading}
            >
              <Text className={`text-lg font-black ${quality === 'sd' ? 'text-forge-accent' : 'text-white'}`}>SD</Text>
              <Text className={`text-[10px] font-bold mt-0.5 ${quality === 'sd' ? 'text-forge-accent' : 'text-forge-muted'}`}>480p</Text>
            </TouchableOpacity>

            <TouchableOpacity
              className={`flex-1 py-4 rounded-xl border items-center ${
                quality === 'hd'
                  ? 'bg-purple-500/15 border-purple-400'
                  : 'bg-forge-bg border-forge-border'
              }`}
              onPress={() => setQuality('hd')}
              disabled={isDownloading}
            >
              <Text className={`text-lg font-black ${quality === 'hd' ? 'text-purple-400' : 'text-white'}`}>HD</Text>
              <Text className={`text-[10px] font-bold mt-0.5 ${quality === 'hd' ? 'text-purple-400' : 'text-forge-muted'}`}>720p</Text>
            </TouchableOpacity>
          </View>

          {/* Error */}
          {error && (
            <View className="bg-red-500/10 rounded-xl p-3 mb-4">
              <Text className="text-red-400 text-xs font-semibold text-center">{error}</Text>
            </View>
          )}

          {/* Progress Bar */}
          {isDownloading && (
            <View className="mb-5">
              <View className="w-full h-2 bg-forge-border rounded-full overflow-hidden mb-2">
                <View
                  className="h-full rounded-full"
                  style={{
                    width: `${Math.round(progress * 100)}%`,
                    backgroundColor: quality === 'hd' ? '#A78BFA' : '#A0C4FF',
                  }}
                />
              </View>
              <View className="flex-row items-center justify-center gap-2">
                <ActivityIndicator size="small" color={quality === 'hd' ? '#A78BFA' : '#A0C4FF'} />
                <Text className="text-forge-muted text-[11px] font-bold">
                  Baixando... {Math.round(progress * 100)}%
                </Text>
              </View>
            </View>
          )}

          {/* Success */}
          {success && (
            <View className="bg-forge-green/10 rounded-xl p-4 mb-4 flex-row items-center justify-center gap-2">
              <Check size={18} color="#4ADE80" />
              <Text className="text-forge-green text-sm font-bold">Vídeo adicionado!</Text>
            </View>
          )}

          {/* Buttons */}
          <View className="flex-row gap-3">
            <TouchableOpacity
              className="flex-1 py-4 rounded-xl border border-forge-border items-center"
              onPress={handleClose}
              disabled={isDownloading}
              style={{ opacity: isDownloading ? 0.3 : 1 }}
            >
              <Text className="text-forge-muted text-sm font-bold">CANCELAR</Text>
            </TouchableOpacity>

            <TouchableOpacity
              className={`flex-1 py-4 rounded-xl items-center flex-row justify-center gap-2 ${
                !url || isDownloading ? 'bg-forge-border' : 'bg-forge-accent'
              }`}
              onPress={handleDownload}
              disabled={!url || isDownloading}
            >
              <ArrowDown size={16} color={!url || isDownloading ? '#5F6368' : '#1A1D24'} />
              <Text className={`text-sm font-extrabold ${!url || isDownloading ? 'text-forge-muted' : 'text-forge-bg'}`}>
                BAIXAR
              </Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
