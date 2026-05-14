import { Feather } from '@expo/vector-icons';
import { Trash2, X } from 'lucide-react-native';
import React from 'react';
import { Alert, Modal, Pressable, Text, TouchableOpacity, View } from 'react-native';

interface MediaOptionsMenuProps {
  visible: boolean;
  onClose: () => void;
  onAddMedia: () => void;
  onReplaceMedia?: () => void;
  onDelete?: () => void;
  canReplace: boolean;
  canDelete: boolean;
}

export function MediaOptionsMenu({
  visible,
  onClose,
  onAddMedia,
  onReplaceMedia,
  onDelete,
  canReplace,
  canDelete,
}: MediaOptionsMenuProps) {
  const handleDelete = () => {
    Alert.alert(
      'Apagar mídia',
      'Tem certeza que deseja apagar esta mídia?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Apagar',
          style: 'destructive',
          onPress: () => {
            onDelete?.();
            onClose();
          },
        },
      ]
    );
  };

  return (
    <Modal visible={visible} transparent animationType="fade">
      <Pressable className="flex-1 bg-black/60 justify-end" onPress={onClose}>
        <Pressable className="bg-forge-surface rounded-t-3xl px-5 pt-5 pb-10">
          {/* Header */}
          <View className="flex-row items-center justify-between mb-5">
            <Text className="text-white text-base font-extrabold tracking-wide">GERENCIAR MÍDIA</Text>
            <TouchableOpacity
              onPress={onClose}
              className="w-8 h-8 rounded-full bg-forge-border justify-center items-center"
            >
              <X size={16} color="#FFF" />
            </TouchableOpacity>
          </View>

          {/* Options */}
          <TouchableOpacity
            className="flex-row items-center py-4 border-b border-forge-border"
            onPress={() => { onAddMedia(); onClose(); }}
          >
            <View className="w-10 h-10 rounded-xl bg-forge-accent/15 justify-center items-center mr-4">
              <Feather name="plus-circle" size={18} color="#A0C4FF" />
            </View>
            <View className="flex-1">
              <Text className="text-white text-sm font-bold">Adicionar Mídia</Text>
              <Text className="text-forge-muted text-[11px]">Imagem ou vídeo do dispositivo</Text>
            </View>
          </TouchableOpacity>

          {canReplace && (
            <TouchableOpacity
              className="flex-row items-center py-4 border-b border-forge-border"
              onPress={() => { onReplaceMedia?.(); onClose(); }}
            >
              <View className="w-10 h-10 rounded-xl bg-forge-green/15 justify-center items-center mr-4">
                <Feather name="refresh-cw" size={18} color="#4ADE80" />
              </View>
              <View className="flex-1">
                <Text className="text-white text-sm font-bold">Trocar Mídia</Text>
                <Text className="text-forge-muted text-[11px]">Substituir a mídia atual</Text>
              </View>
            </TouchableOpacity>
          )}

          {canDelete && (
            <TouchableOpacity
              className="flex-row items-center py-4"
              onPress={handleDelete}
            >
              <View className="w-10 h-10 rounded-xl bg-red-500/15 justify-center items-center mr-4">
                <Trash2 size={18} color="#EF4444" />
              </View>
              <View className="flex-1">
                <Text className="text-red-400 text-sm font-bold">Apagar Mídia</Text>
                <Text className="text-forge-muted text-[11px]">Remover a mídia selecionada</Text>
              </View>
            </TouchableOpacity>
          )}
        </Pressable>
      </Pressable>
    </Modal>
  );
}
